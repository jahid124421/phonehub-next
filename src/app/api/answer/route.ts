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

/**
 * Atomically check-and-reserve one answer's worth of tokens for an IP.
 * The reservation is recorded synchronously, BEFORE any await — so concurrent
 * requests from the same IP cannot interleave between check and record and
 * slip past the budget. On failure the caller must refundTokenSpend().
 */
function tryReserveTokens(ip: string): boolean {
  const now = Date.now();
  const timestamps = (tokenSpends.get(ip) || []).filter((t) => now - t < TOKEN_WINDOW_MS);
  if ((timestamps.length + 1) * TOKEN_COST_PER_ANSWER > TOKEN_BUDGET) {
    tokenSpends.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  tokenSpends.set(ip, timestamps);
  // Occasional cleanup to avoid unbounded growth
  if (tokenSpends.size > 1000) {
    for (const [key, ts] of tokenSpends) {
      if (ts.every((t) => now - t >= TOKEN_WINDOW_MS)) tokenSpends.delete(key);
    }
  }
  return true;
}

/** Refund one reservation (e.g. the AI call threw and consumed nothing). */
function refundTokenSpend(ip: string): void {
  const timestamps = tokenSpends.get(ip);
  if (!timestamps || timestamps.length === 0) return;
  timestamps.pop(); // all entries cost the same; dropping the newest is a fair refund
  tokenSpends.set(ip, timestamps);
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

  // Reserve budget AFTER validation (bad requests stay cheap) but BEFORE the
  // async AI call, so concurrent same-IP requests can't race the limiter.
  if (!tryReserveTokens(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before trying again.' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const result = await answerQuestion(trimmed);
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
    refundTokenSpend(ip); // the call consumed no upstream tokens
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
  // GET is disabled in production: query strings end up in access logs and
  // browser history (question privacy), and cross-origin GETs need no CORS
  // preflight — any third-party page could burn AI budget from a visitor's
  // browser. Kept in dev for quick local testing.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return handle(request.nextUrl.searchParams.get('q'), request);
}
