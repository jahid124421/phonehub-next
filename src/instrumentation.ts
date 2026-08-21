/**
 * Next.js instrumentation hook — runs once at server startup.
 *
 * - register(): validates environment configuration (warn-only).
 * - onRequestError(): captures otherwise-unhandled errors from nested
 *   server components / route handlers and forwards them to the
 *   monitoring sinks (structured logs, Sentry, webhook).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env');
    validateEnv();
  }
}

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routePath?: string; routeType?: string }
) {
  const { captureError } = await import('./lib/monitoring');
  await captureError(error, {
    route: context.routePath ?? request.path,
    operation: context.routeType ?? request.method,
  });
}
