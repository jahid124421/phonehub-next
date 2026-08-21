# PhoneHub

Find, compare & decide — a fast, clean, ad-light alternative to GSMArena / Smartprix.
Live at [phonehub-next.vercel.app](https://phonehub-next.vercel.app/).

## Why it exists

| Incumbent weakness | PhoneHub's answer |
| --- | --- |
| Ad-choked, slow, 2012-era UX | Static-first Next.js, dark mode, PWA, keyboard-first (`Ctrl+K`) command palette |
| Compare = static table dump | Diff-highlighted compare for up to 4 devices + per-use-case verdict scoring |
| Shallow filters | Advanced Finder with 40+ facets |
| News is a blog, not a hub | Deduped multi-source news + rumor tracker + launch calendar |
| No answers, only data | AI answer layer (Groq → Gemini → local heuristic fallback) |
| Closed platform | Free public JSON API — see `/developers` |

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS 4 + daisyUI 5
- **Database:** Postgres (Supabase) + Prisma 7 — JSON-file fallback keeps the site fully functional without a DB
- **Search:** Postgres `tsvector` FTS with in-memory fallback
- **AI:** Groq (`llama-3.3-70b-versatile`) primary → Gemini (`gemini-2.0-flash`) fallback → local heuristic engine
- **Data:** RSS aggregation (10+ sources), daily GitHub Actions + Vercel cron refresh
- **Deploy:** Vercel

## Getting started

```bash
npm install
cp .env.example .env   # fill in what you have — everything is optional
npm run dev
```

The site runs with **zero env vars** (JSON data + heuristic AI fallback). Add keys to unlock more:

| Variable | Unlocks |
| --- | --- |
| `DATABASE_URL` | Postgres-backed API responses (Prisma) |
| `GROQ_API_KEY` | LLM answers via Groq (free at console.groq.com) |
| `GEMINI_API_KEY` | LLM fallback via Gemini free tier |
| `CRON_SECRET` | Protects `/api/cron/daily` and `/api/revalidate` (required in prod) |
| `ALLOW_INSECURE_CRON` | Local dev only: call cron endpoints without a secret (never deploy) |
| `AI_DAILY_LLM_BUDGET` | Shared daily cap on LLM calls (default 500; heuristics take over when spent) |
| `SENTRY_DSN` | Server error tracking in Sentry (SDK-free, via Envelope API) |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser error reporting via error boundaries (DSNs are public-by-design) |
| `ERROR_WEBHOOK_URL` | Slack/Discord error alerts |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs for sitemap/OG tags |

Error tracking is built in: API routes emit structured JSON logs (Vercel log drains) and optionally forward to Sentry/webhook sinks — see `src/lib/monitoring.ts`.

## Key routes

- `/search` — full-text search · `/advanced-finder` — 40+ facet filters
- `/compare?ids=a,b,c` — up to 4 devices, verdict scoring
- `/best/[slug]` — 30 programmatic "best of" landing pages · `/vs/a-vs-b` — head-to-head pages
- `/upcoming` — launch calendar + rumor tracker · `/developers` — public API docs
- `/api/search`, `/api/finder`, `/api/brands`, `/api/news`, `/api/prices/[id]`, `/api/answer`

## Data pipeline

- `scripts/fetch-news.ts` — RSS aggregation + dedupe → `src/data/news.json`
- `scripts/compute-scores.ts` — PhoneHubScore per device → `src/data/scores.json`
- `scripts/enrich-specs.ts` — parses specs into filterable facets
- `.github/workflows/daily.yml` — daily refresh, commits data, pings IndexNow

## License

MIT (data aggregated from public sources; see `/disclosure`).
