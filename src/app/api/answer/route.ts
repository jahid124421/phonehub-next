import { NextRequest, NextResponse } from 'next/server';
import { answerQuestion, llmBudgetRemaining, llmBudgetLimit } from '@/lib/ai';
import { captureError } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

const MAX_QUESTION_LEN = 500;
const RATE_LIMIT = 20; // requests per window
const WINDOW_MS = 60_000; // 1 minute

// ─── Per-IP token budget (defense-in-depth on top of req/min limiting) ──────
// Each successful answer costs an estimated TOKEN_COST_PER_ANSWER tokens.
// An IP that spends more than TOKEN_BUDGET within the sliding TOKEN_WINDOW_MS
// gets a 429 — this caps per-IP AI consumption even for carefully paced abuse.
const TOKEN_WINDOW_MS = 5 * 60_000; // 5 minutes
const TOKEN_BUDGET = 500; // estimated tokens per window per IP
const TOKEN_COST_PER_ANSWER = 50;

// ─── In-memory rate limiter (per-IP sliding window) ─────────────────────────

const hits = new Map<string, number[]>();
const tokenSpends = new Map<string, number[]>(); // timestamps of successful answers

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    hits.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  hits.set(ip, timestamps);
  // Occasional cleanup to avoid unbounded growth
  if (hits.size > 1000) {
    for (const [key, ts] of hits) {
      if (ts.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

function isTokenBudgetExceeded(ip: string): boolean {
  const now = Date.now();
  const timestamps = (tokenSpends.get(ip) || []).filter((t) => now - t < TOKEN_WINDOW_MS);
  tokenSpends.set(ip, timestamps);
  return timestamps.length * TOKEN_COST_PER_ANSWER >= TOKEN_BUDGET;
}

function recordTokenSpend(ip: string): void {
  const now = Date.now();
  const timestamps = (tokenSpends.get(ip) || []).filter((t) => now - t < TOKEN_WINDOW_MS);
  timestamps.push(now);
  tokenSpends.set(ip, timestamps);
  // Occasional cleanup to avoid unbounded growth
  if (tokenSpends.size > 1000) {
    for (const [key, ts] of tokenSpends) {
      if (ts.every((t) => now - t >= TOKEN_WINDOW_MS)) tokenSpends.delete(key);
    }
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

async function handle(question: string | null, request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!question || typeof question !== 'string') {
    return NextResponse.json(
      { error: 'Question is required' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const trimmed = question.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_QUESTION_LEN) {
    return NextResponse.json(
      { error: `Question must be 1-${MAX_QUESTION_LEN} characters` },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Token budget check happens after validation so bad requests are cheap,
  // and before the (potentially costly) AI call.
  if (isTokenBudgetExceeded(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before trying again.' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const result = await answerQuestion(trimmed);
    recordTokenSpend(ip);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'X-AI-Source': result.source,
        'X-AI-Budget-Limit': String(llmBudgetLimit()),
        'X-AI-Budget-Remaining': String(llmBudgetRemaining()),
      },
    });
  } catch (error) {
    // answerQuestion is designed to never throw (falls back to local),
    // but guard anyway so users never see an unhandled error.
    await captureError(error, { route: '/api/answer', operation: 'answer' });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function POST(request: NextRequest) {
  let question: string | null = null;
  try {
    const body = (await request.json()) as { question?: string };
    question = body.question ?? null;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  return handle(question, request);
}

export async function GET(request: NextRequest) {
  return handle(request.nextUrl.searchParams.get('q'), request);
}
