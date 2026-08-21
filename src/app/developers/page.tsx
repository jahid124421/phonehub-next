import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Free Public API — PhoneHub for Developers",
  description:
    "Free, no-key JSON API for phone specs, search, brands, news and prices. Built for developers, researchers and hobby projects.",
  alternates: { canonical: "/developers" },
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/search",
    description: "Full-text search across all products with filters, sorting and pagination.",
    params: [
      ["q", "string", "Search query (e.g. q=galaxy s26)"],
      ["cat", "string", "Category slug filter (e.g. cat=phones)"],
      ["brand", "string", "Comma-separated brand ids (e.g. brand=samsung,apple)"],
      ["sort", "string", "popularity | rating | price_asc | price_desc | release_year"],
      ["page / limit", "number", "Pagination (limit max 100)"],
      ["ids", "string", "Comma-separated product ids to fetch directly"],
    ],
    example: `/api/search?q=pixel&sort=price_asc&limit=10`,
  },
  {
    method: "GET",
    path: "/api/finder",
    description: "Faceted filtering — the same engine that powers the Advanced Finder.",
    params: [
      ["brands", "string", "Comma-separated brand names"],
      ["priceMin / priceMax", "number", "Base price range in USD"],
      ["ramMin / storageMin / batteryMin", "number", "Minimum GB / GB / mAh"],
      ["fiveG / nfc / wirelessCharging", "boolean", "Feature flags (true)"],
      ["sort", "string", "popularity | price_asc | price_desc | newest | score"],
    ],
    example: `/api/finder?batteryMin=5000&fiveG=true&priceMax=800`,
  },
  {
    method: "GET",
    path: "/api/brands",
    description: "All brands with product counts and logos.",
    params: [],
    example: `/api/brands`,
  },
  {
    method: "GET",
    path: "/api/news",
    description: "Latest deduplicated tech news from 10+ sources.",
    params: [["limit", "number", "Max items to return"]],
    example: `/api/news?limit=20`,
  },
  {
    method: "GET",
    path: "/api/prices/[productId]",
    description: "Current store prices and 6-month price history for a product.",
    params: [],
    example: `/api/prices/apple-iphone-17-pro`,
  },
  {
    method: "POST",
    path: "/api/answer",
    description:
      "AI answers grounded in our product data. Body: { \"question\": \"...\" } (or GET ?q=). Rate-limited to 20 req/min per IP. A shared daily AI budget applies — when it is spent, answers are served by the local heuristic engine (same product data, no LLM prose) until the next UTC day. Check the X-AI-Source and X-AI-Budget-Remaining response headers.",
    params: [["question", "string", "Natural-language question (max 500 chars)"]],
    example: `/api/answer?q=best+battery+phone+under+600`,
  },
];

export default function DevelopersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">PhoneHub Public API</h1>
        <p style={{ color: "var(--muted)" }}>
          Free JSON over HTTPS. No API key, no signup — send requests from
          anywhere (browser, curl, your backend). Fair-use rate limits apply
          (20 req/min per IP on AI endpoints) — if you build something cool, a
          link back is appreciated.
        </p>
        <div
          className="text-sm"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 16px",
          }}
        >
          Base URL: <code style={{ color: "var(--primary)" }}>{SITE_URL}</code>
          &nbsp;·&nbsp; Responses are cached at the CDN edge (search/brands/news: 1h).
        </div>
      </header>

      {ENDPOINTS.map((ep) => (
        <section
          key={ep.path}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span
              style={{
                background: ep.method === "GET" ? "#16a34a22" : "#6366f122",
                color: ep.method === "GET" ? "#22c55e" : "#818cf8",
                fontWeight: 700,
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 6,
                letterSpacing: "0.05em",
              }}
            >
              {ep.method}
            </span>
            <code className="font-semibold">{ep.path}</code>
          </div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {ep.description}
          </p>
          {ep.params.length > 0 && (
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Param</th>
                  <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Type</th>
                  <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {ep.params.map(([name, type, note]) => (
                  <tr key={name}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                      <code>{name}</code>
                    </td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{type}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div
            className="text-xs"
            style={{
              background: "var(--bg, #0d0f14)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 12px",
              overflowX: "auto",
            }}
          >
            <code>curl &quot;{SITE_URL}{ep.example}&quot;</code>
          </div>
        </section>
      ))}

      <footer className="text-sm space-y-2" style={{ color: "var(--muted)" }}>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Terms of use</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Free for personal and commercial projects within fair use.</li>
          <li>Please cache responses client-side; don&apos;t hammer endpoints in loops.</li>
          <li>Data is provided as-is; prices are indicative and may not reflect live store offers.</li>
          <li>Attribution (&quot;Data from PhoneHub&quot; + link) required for public-facing uses.</li>
        </ul>
      </footer>
    </div>
  );
}
