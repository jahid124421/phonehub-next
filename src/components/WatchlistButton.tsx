"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const WATCHLIST_KEY = "phonehub_watchlist";

export function getWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleWatchlist(productId: string): string[] {
  const list = getWatchlist();
  const index = list.indexOf(productId);
  if (index > -1) {
    list.splice(index, 1);
  } else {
    list.push(productId);
  }
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("watchlist-updated", { detail: list }));
  return list;
}

export default function WatchlistButton({ productId }: { productId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const list = getWatchlist();
    setSaved(list.includes(productId));

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string[];
      setSaved(detail.includes(productId));
    };
    window.addEventListener("watchlist-updated", handler);
    return () => window.removeEventListener("watchlist-updated", handler);
  }, [productId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const list = toggleWatchlist(productId);
    setSaved(list.includes(productId));
  };

  return (
    <button
      onClick={handleToggle}
      className={`btn btn-ghost btn-sm gap-1`}
      title={saved ? "Remove from watchlist" : "Add to watchlist"}
      aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Heart
        className={`w-4 h-4 ${saved ? "fill-error text-error" : ""}`}
      />
      {saved ? "Saved" : "Watch"}
    </button>
  );
}
