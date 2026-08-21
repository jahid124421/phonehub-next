/**
 * Lightweight, zero-dependency error tracking.
 *
 * Isomorphic: safe to import from server code AND client components
 * (e.g. error.tsx) — it uses no Node-only APIs.
 *
 * Every captured error is:
 *  1. Logged as a structured JSON line (picked up by Vercel function logs
 *     and any log drain; on the client it lands in the browser console).
 *  2. Forwarded to Sentry via the Envelope HTTP API — no SDK required.
 *     Server: uses SENTRY_DSN. Client: uses NEXT_PUBLIC_SENTRY_DSN
 *     (Sentry DSNs are public-by-design).
 *  3. Posted to `ERROR_WEBHOOK_URL` (Slack/Discord-compatible) — server
 *     only; the webhook URL is never exposed to the browser bundle.
 *
 * Nothing here ever throws — monitoring must never break the request path.
 */

export interface ErrorContext {
  /** Route or area where the error occurred, e.g. "/api/search". */
  route?: string;
  /** What was being attempted, e.g. "prisma-query". */
  operation?: string;
  /** Any extra structured data worth attaching. */
  extra?: Record<string, unknown>;
}

// ─── Sentry envelope transport (SDK-free) ────────────────────────────────────

interface ParsedDsn {
  host: string;
  projectId: string;
  publicKey: string;
}

function parseDsn(dsn: string): ParsedDsn | null {
  // DSN format: https://<publicKey>@<host>/<projectId>
  const match = dsn.match(/^https?:\/\/([a-f0-9]+)@([a-z0-9.-]+\.[a-z]{2,}(?::\d+)?)\/(\d+)$/i);
  if (!match) return null;
  return { publicKey: match[1], host: match[2], projectId: match[3] };
}

/** crypto.randomUUID() exists in Node 19+ and all modern browsers. */
function newEventId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return (uuid ?? `${Date.now()}${Math.random().toString(16).slice(2)}`).replace(/-/g, '');
}

function buildSentryEnvelope(
  dsn: ParsedDsn,
  error: unknown,
  context: ErrorContext
): string {
  const eventId = newEventId();
  const err = error instanceof Error ? error : new Error(String(error));

  const header = JSON.stringify({
    event_id: eventId,
    sent_at: new Date().toISOString(),
  });
  const itemHeader = JSON.stringify({ type: 'event' });
  const event = JSON.stringify({
    event_id: eventId,
    timestamp: Math.floor(Date.now() / 1000),
    platform: typeof window === 'undefined' ? 'node' : 'javascript',
    level: 'error',
    logger: 'phonehub',
    transaction: context.route,
    exception: {
      values: [
        {
          type: err.name || 'Error',
          value: (err.message || String(error)).slice(0, 1000),
          stacktrace: err.stack
            ? { frames: [{ filename: 'unknown', function: err.stack.slice(0, 2000) }] }
            : undefined,
        },
      ],
    },
    tags: { route: context.route, operation: context.operation },
    extra: context.extra,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.NODE_ENV,
  });

  return `${header}\n${itemHeader}\n${event}\n`;
}

async function sendToSentry(
  dsn: ParsedDsn,
  envelope: string,
  signal: AbortSignal
): Promise<void> {
  const url = `https://${dsn.host}/api/${dsn.projectId}/envelope/`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=phonehub-edge/1.0`,
    },
    body: envelope,
    signal,
    cache: 'no-store',
  });
}

async function sendToWebhook(
  url: string,
  error: unknown,
  context: ErrorContext,
  signal: AbortSignal
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  // Slack + Discord both render `content`/`text` message bodies.
  const text =
    `🔴 PhoneHub error` +
    (context.route ? ` in \`${context.route}\`` : '') +
    (context.operation ? ` (${context.operation})` : '') +
    `\n\`\`\`${(err.message || String(error)).slice(0, 500)}\`\`\``;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, content: text }),
    signal,
    cache: 'no-store',
  });
}

// ─── Remote-sink throttling ──────────────────────────────────────────────────
// Routes like /api/search intentionally fall back to JSON when the DB is
// unreachable — without throttling, a DB outage would fire one webhook/Sentry
// event per request. Remote sinks are sent at most once per key per window;
// the structured console log in captureError always runs.

const REMOTE_THROTTLE_MS = 5 * 60_000;
const lastRemoteSent = new Map<string, number>();

function shouldSendRemote(key: string): boolean {
  const now = Date.now();
  const last = lastRemoteSent.get(key) ?? 0;
  if (now - last < REMOTE_THROTTLE_MS) return false;
  lastRemoteSent.set(key, now);
  // Occasional cleanup to avoid unbounded growth
  if (lastRemoteSent.size > 500) {
    for (const [k, ts] of lastRemoteSent) {
      if (now - ts >= REMOTE_THROTTLE_MS) lastRemoteSent.delete(k);
    }
  }
  return true;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Capture an error: structured log + optional Sentry/webhook forwarding.
 * Await it inside route handlers so the flush completes before the
 * serverless function freezes. Never throws.
 */
export async function captureError(
  error: unknown,
  context: ErrorContext = {}
): Promise<void> {
  // 1. Structured log line (always) — queryable in Vercel log drains.
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      JSON.stringify({
        level: 'error',
        route: context.route,
        operation: context.operation,
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        extra: context.extra,
        ts: new Date().toISOString(),
      })
    );
  } catch {
    /* ignore logging failures */
  }

  // 2. Optional remote sinks, throttled per route+error so an outage
  //    cannot flood Sentry or the webhook channel.
  const err = error instanceof Error ? error : new Error(String(error));
  const throttleKey = `${context.route ?? 'unknown'}:${err.name}:${err.message?.slice(0, 80)}`;
  if (!shouldSendRemote(throttleKey)) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  const tasks: Promise<unknown>[] = [];

  const dsnRaw = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  const dsn = dsnRaw ? parseDsn(dsnRaw) : null;
  if (dsn) {
    tasks.push(sendToSentry(dsn, buildSentryEnvelope(dsn, error, context), controller.signal));
  }
  // Webhook stays server-only: its URL must never ship to the browser bundle.
  if (typeof window === 'undefined' && process.env.ERROR_WEBHOOK_URL) {
    tasks.push(sendToWebhook(process.env.ERROR_WEBHOOK_URL, error, context, controller.signal));
  }

  try {
    await Promise.allSettled(tasks);
  } finally {
    clearTimeout(timer);
  }
}
