"use client";
import { useEffect, useState } from "react";

type Item = { asin: string; title: string; image: string | null; price: { display: string } | null; url: string };

export default function AmazonPrice({ asin, keyword, compact = false }: { asin?: string; keyword?: string; compact?: boolean }) {
  const [item, setItem] = useState<Item | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    const q = asin ? `asin=${encodeURIComponent(asin)}` : keyword ? `q=${encodeURIComponent(keyword)}` : null;
    if (!q) return;
    let alive = true;
    fetch(`/api/amazon?${q}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        setConfigured(Boolean(j.configured));
        setFallbackUrl(j.url || null);
        const it: Item | null = j.item || j.items?.[0] || null;
        if (it) setItem(it);
      })
      .catch(() => alive && setConfigured(false));
    return () => { alive = false; };
  }, [asin, keyword]);

  if (!asin && !keyword) return null;
  // Before load — show nothing to avoid layout shift
  if (configured === null) return null;
  // Not configured — show affordance linking to Amazon search/results
  if (!configured) {
    return (
      <a
        href={fallbackUrl || `https://www.amazon.com/s?k=${encodeURIComponent(keyword || asin || "")}`}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        className={compact ? "text-xs font-semibold text-primary hover:underline" : "btn btn-ghost btn-sm"}
        title="Open on Amazon (live price requires Amazon PA-API keys — see README / .env.example)"
      >
        View on Amazon →
      </a>
    );
  }
  if (!item) return null;
  return (
    <a href={item.url} target="_blank" rel="nofollow sponsored noopener noreferrer" className={`inline-flex items-center gap-2 ${compact ? "text-xs" : "btn btn-primary btn-sm"}`}>
      {item.price ? item.price.display : "View on Amazon"} <span aria-hidden>↗</span>
    </a>
  );
}
