import type { NewsItem } from "@/lib/data";

/**
 * Rumor tracker — surfaces leak/rumor stories from the aggregated news feed.
 * Server-rendered; used as a sidebar on /upcoming.
 */
export default function RumorTracker({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;

  return (
    <aside
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#eab308",
            display: "inline-block",
          }}
        />
        <h2 className="font-bold text-base">Rumor Tracker</h2>
        <span className="text-xs" style={{ color: "var(--muted)", marginLeft: "auto" }}>
          {items.length} active
        </span>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
        Latest leaks &amp; whispers from across the web — unverified until marked
        confirmed.
      </p>
      <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="text-sm font-medium leading-snug"
                style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {item.title}
              </div>
              <div className="text-xs mt-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
                <span
                  style={{
                    background: "#eab30822",
                    color: "#eab308",
                    fontWeight: 600,
                    padding: "1px 7px",
                    borderRadius: 12,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.tag || "rumor"}
                </span>
                <span>{item.source}</span>
                <span>•</span>
                <span>{item.dateLabel}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
