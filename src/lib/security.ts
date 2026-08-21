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
 * - Secret configured  → always enforce (dev and prod).
 * - Secret missing + production → fail closed (deny).
 * - Secret missing + development → allow (local ergonomics).
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const authHeader = request.headers.get('authorization');
  if (safeCompareTokens(authHeader, `Bearer ${secret}`)) return true;
  // Also accept a raw `x-cron-secret` header for non-Vercel callers
  // (GitHub Actions, manual triggers).
  return safeCompareTokens(request.headers.get('x-cron-secret'), secret);
}
