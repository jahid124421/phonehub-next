import { NextRequest, NextResponse } from 'next/server';
import { answerQuestion } from '@/lib/ai';

export const dynamic = 'force-dynamic';

const MAX_QUESTION_LEN = 500;
const RATE_LIMIT = 20; // requests per window
const WINDOW_MS = 60_000; // 1 minute

// ─── In-memory rate limiter (per-IP sliding window) ─────────────────────────

const hits = new Map<string, number[]>();

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

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

async function handle(question: string | null, request: NextRequest) {
  if (isRateLimited(getClientIp(request))) {
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

  try {
    const result = await answerQuestion(trimmed);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    // answerQuestion is designed to never throw (falls back to local),
    // but guard anyway so users never see an unhandled error.
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
