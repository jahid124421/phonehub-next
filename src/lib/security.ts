import crypto from 'node:crypto';

/**
 * Timing-safe comparison of two secret strings (e.g. bearer tokens).
 *
 * A plain `===`/`!==` comparison short-circuits on the first differing byte,
 * which leaks how much of the guess was correct and allows an attacker to
 * recover the secret byte-by-byte via response-time measurement.
 * `crypto.timingSafeEqual` compares in constant time.
 *
 * Returns false for missing/empty values and never throws.
 */
export function safeCompareTokens(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!provided || !expected) return false;

  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  if (providedBuf.length !== expectedBuf.length) {
    // Lengths differ — still burn a comparison to reduce the timing signal.
    crypto.timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Verify an `Authorization: Bearer <token>` header against CRON_SECRET.
 *
 * Policy:
 * - Secret configured → always enforce (every environment).
 * - Secret missing → fail closed, unless ALLOW_INSECURE_CRON=1 is set
 *   (explicit opt-in intended for local development only).
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed by default — this also covers preview/staging deployments,
    // which build with NODE_ENV=production and may inherit env vars.
    return process.env.ALLOW_INSECURE_CRON === '1';
  }
  const authHeader = request.headers.get('authorization');
  if (safeCompareTokens(authHeader, `Bearer ${secret}`)) return true;
  // Also accept a raw `x-cron-secret` header for non-Vercel callers
  // (GitHub Actions, manual triggers).
  return safeCompareTokens(request.headers.get('x-cron-secret'), secret);
}
