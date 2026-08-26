import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Fail-closed auth guard for cron/revalidate endpoints.
 *
 * The naive check `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``
 * FAILS OPEN when CRON_SECRET is unset — anyone sending `Bearer undefined`
 * passes. This guard instead returns 503 when the secret is missing or too
 * weak, and compares tokens in constant time.
 */

function eq(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Returns null when the request is authorized, or a Response to send back
 * immediately when it is not.
 *
 * Usage (first line of the route handler):
 *   const denied = guardCron(req); if (denied) return denied;
 */
export function guardCron(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    // Fail CLOSED: no secret configured → endpoint disabled, not open.
    return new Response("CRON_SECRET not configured", { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const alt = req.headers.get("x-cron-secret") ?? "";
  if ((bearer && eq(bearer, secret)) || (alt && eq(alt, secret))) return null;
  return new Response("Unauthorized", { status: 401 });
}
