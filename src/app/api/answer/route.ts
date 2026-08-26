import { NextRequest, NextResponse } from 'next/server';
import { answerQuestion } from '@/lib/ai';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

const MAX_QUESTION_LEN = 500;
const RATE_LIMIT = 20; // requests per window per IP
const WINDOW_MS = 60_000; // 1 minute
const GLOBAL_LIMIT = 300; // circuit breaker: max requests per window across ALL IPs

// Every response from this endpoint carries these headers: never indexable,
// never cached — this route spends LLM quota on each call.
const BASE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

// ─── Rate limiting ──────────────────────────────────────────────────────────
// NOTE: in-memory limits are best-effort on serverless (per-instance). The
// global circuit breaker caps worst-case spend per instance; for hard limits
// move this to Upstash/Vercel KV post-launch.

const hits = new Map<string, number[]>();
let globalHits: number[] = [];

function prune(timestamps: number[], now: number): number[] {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Global circuit breaker — one scraper rotating IPs still trips this.
  globalHits = prune(globalHits, now);
  if (globalHits.length >= GLOBAL_LIMIT) return true;

  const timestamps = prune(hits.get(ip) || [], now);
  if (timestamps.length >= RATE_LIMIT) {
    hits.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  globalHits.push(now);
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

// ─── Origin check ───────────────────────────────────────────────────────────
// Reject cross-site usage: this endpoint is for our own UI, not a public LLM
// proxy. Requests with no Origin/Referer (curl, server-to-server) are allowed
// through but still rate-limited — same-origin browser abuse is the main leak.

function isAllowedOrigin(request: NextRequest): boolean {
  const source = request.headers.get('origin') || request.headers.get('referer');
  if (!source) return true;
  try {
    const { host } = new URL(source);
    const siteHost = new URL(SITE_URL).host;
    return (
      host === siteHost ||
      host === 'localhost' ||
      host.startsWith('localhost:') ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app') // preview deployments
    );
  } catch {
    return false;
  }
}

// ─── Handler (POST only — no GET, so crawlers/prefetchers can't spend quota) ─

export async function POST(request: NextRequest) {
  // Kill switch: set AI_ANSWERS_ENABLED=false to disable spend instantly.
  if (process.env.AI_ANSWERS_ENABLED === 'false') {
    return NextResponse.json(
      { error: 'AI answers are temporarily disabled.' },
      { status: 503, headers: BASE_HEADERS }
    );
  }

  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { error: 'Cross-origin requests are not allowed.' },
      { status: 403, headers: BASE_HEADERS }
    );
  }

  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: BASE_HEADERS }
    );
  }

  let question: string | null = null;
  try {
    const body = (await request.json()) as { question?: string };
    question = body.question ?? null;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: BASE_HEADERS }
    );
  }

  if (!question || typeof question !== 'string') {
    return NextResponse.json(
      { error: 'Question is required' },
      { status: 400, headers: BASE_HEADERS }
    );
  }

  const trimmed = question.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_QUESTION_LEN) {
    return NextResponse.json(
      { error: `Question must be 1-${MAX_QUESTION_LEN} characters` },
      { status: 400, headers: BASE_HEADERS }
    );
  }

  try {
    const result = await answerQuestion(trimmed);
    return NextResponse.json(result, { headers: BASE_HEADERS });
  } catch {
    // answerQuestion is designed to never throw (falls back to local),
    // but guard anyway so users never see an unhandled error.
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500, headers: BASE_HEADERS }
    );
  }
}

// Explicit 405 for everything else — previously a GET ?q= handler let
// crawlers, link previewers and CDN prefetch burn LLM quota.
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with a JSON body: { "question": "..." }' },
    { status: 405, headers: { ...BASE_HEADERS, Allow: 'POST' } }
  );
}
