/**
 * Startup environment validation.
 *
 * Warn-only by design: the site is built to run with zero env vars
 * (JSON data + heuristic AI fallback), so we never crash on a missing
 * variable — we just make misconfiguration loud in the logs.
 */

interface EnvCheck {
  name: string;
  requiredInProduction: boolean;
  purpose: string;
}

const CHECKS: EnvCheck[] = [
  {
    name: 'DATABASE_URL',
    requiredInProduction: false,
    purpose: 'Postgres-backed API (falls back to bundled JSON when unset)',
  },
  {
    name: 'GROQ_API_KEY',
    requiredInProduction: false,
    purpose: 'LLM answers via Groq (falls back to Gemini, then heuristics)',
  },
  {
    name: 'GEMINI_API_KEY',
    requiredInProduction: false,
    purpose: 'LLM fallback via Gemini',
  },
  {
    name: 'CRON_SECRET',
    requiredInProduction: true,
    purpose: 'Protects /api/cron/daily and /api/revalidate',
  },
];

const PLACEHOLDER_PATTERN = /^(changeme|change-me|todo|xxx|your[_-]|<|placeholder)/i;

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const problems: string[] = [];

  for (const check of CHECKS) {
    const value = process.env[check.name];
    if (!value) {
      if (check.requiredInProduction && isProd) {
        problems.push(
          `❌ ${check.name} is NOT set in production — ${check.purpose}`
        );
      } else if (!value) {
        problems.push(`ℹ️  ${check.name} not set — ${check.purpose}`);
      }
      continue;
    }
    if (PLACEHOLDER_PATTERN.test(value.trim())) {
      problems.push(
        `⚠️  ${check.name} looks like a placeholder value — ${check.purpose}`
      );
    }
  }

  if (isProd && !process.env.NEXT_PUBLIC_SITE_URL) {
    problems.push(
      'ℹ️  NEXT_PUBLIC_SITE_URL not set — canonical URLs will use the default domain'
    );
  }

  if (isProd && !process.env.SENTRY_DSN && !process.env.ERROR_WEBHOOK_URL) {
    problems.push(
      'ℹ️  No error sink configured (SENTRY_DSN / ERROR_WEBHOOK_URL) — errors only reach Vercel logs'
    );
  }

  for (const p of problems) {
    if (p.startsWith('❌')) console.error(`[env] ${p}`);
    else console.warn(`[env] ${p}`);
  }

  if (problems.length === 0) {
    console.log('[env] ✅ Environment looks good');
  }
}
