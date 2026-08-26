"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, Trash2, Search } from "lucide-react";
import { getWatchlist, toggleWatchlist } from "@/components/WatchlistButton";
import PhoneCard, { type CardProduct } from "@/components/PhoneCard";
import Breadcrumb from "@/components/Breadcrumb";

/**
 * Watchlist is localStorage-based, so this must stay a client component —
 * but it fetches details for saved IDs from /api/products instead of
 * bundling the full products.json (2.9MB) into the client.
 */
export default function WatchlistClient() {
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [mounted, setMounted] = useState(false);

  const load = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    try {
      const res = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(","))}`);
      if (!res.ok) throw new Error(`products request failed: ${res.status}`);
      const data = (await res.json()) as { products: CardProduct[] };
      // Preserve watchlist order
      const byId = new Map(data.products.map((p) => [p.id, p]));
      setProducts(ids.map((id) => byId.get(id)).filter((p): p is CardProduct => !!p));
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    load(getWatchlist());
    setMounted(true);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string[];
      load(detail);
    };
    window.addEventListener("watchlist-updated", handler);
    return () => window.removeEventListener("watchlist-updated", handler);
  }, [load]);

  const handleRemove = (productId: string) => {
    toggleWatchlist(productId);
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Watchlist" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex items-center gap-3">
        <Heart className="w-7 h-7 text-error" />
        <h1 className="text-3xl font-bold">My Watchlist</h1>
        {mounted && products.length > 0 && (
          <span className="badge badge-soft badge-primary badge-lg">{products.length}</span>
        )}
      </div>

      {!mounted ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center">
            <Heart className="w-10 h-10 text-base-content/30" />
          </div>
          <h2 className="text-xl font-semibold text-base-content/70">Your watchlist is empty</h2>
          <p className="text-base-content/50 max-w-md">
            Browse devices to add favorites. Tap the heart icon on any product to save it here.
          </p>
          <Link href="/search" className="btn btn-primary gap-2">
            <Search className="w-4 h-4" />
            Browse Devices
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <PhoneCard product={product} score={product.score} />
              <button
                onClick={() => handleRemove(product.id)}
                className="absolute top-2 right-2 btn btn-circle btn-sm btn-error btn-outline opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-base-100"
                title="Remove from watchlist"
                aria-label="Remove from watchlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
