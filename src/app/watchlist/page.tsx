"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Trash2, Search } from "lucide-react";
import { getAllProducts, type Product } from "@/lib/data";
import { getWatchlist, toggleWatchlist } from "@/components/WatchlistButton";
import PhoneCard from "@/components/PhoneCard";
import Breadcrumb from "@/components/Breadcrumb";

export default function WatchlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const ids = getWatchlist();
    const all = getAllProducts();
    const filtered = ids
      .map((id) => all.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
    setProducts(filtered);
    setMounted(true);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string[];
      const filtered = detail
        .map((id) => all.find((p) => p.id === id))
        .filter((p): p is Product => !!p);
      setProducts(filtered);
    };
    window.addEventListener("watchlist-updated", handler);
    return () => window.removeEventListener("watchlist-updated", handler);
  }, []);

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
              <PhoneCard product={product} />
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
