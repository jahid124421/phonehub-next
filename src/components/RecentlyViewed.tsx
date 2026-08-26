"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

const VIEWED_KEY = "phonehub_viewed";
const MAX_VIEWED = 10;

interface ViewedItem {
  id: string;
  name: string;
  image: string;
  brand: string;
  addedAt: string;
}

function getViewed(): ViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addViewed(product: Omit<ViewedItem, "addedAt">): ViewedItem[] {
  let list = getViewed().filter((v) => v.id !== product.id);
  list.unshift({
    ...product,
    addedAt: new Date().toISOString(),
  });
  if (list.length > MAX_VIEWED) list = list.slice(0, MAX_VIEWED);
  localStorage.setItem(VIEWED_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("viewed-updated", { detail: list }));
  return list;
}

function clearViewed() {
  localStorage.removeItem(VIEWED_KEY);
  window.dispatchEvent(new CustomEvent("viewed-updated", { detail: [] }));
}

// The current product's display fields are passed in from the server page —
// this component must NOT import @/lib/data (would bundle 2.9MB of JSON).
export default function RecentlyViewed({
  currentProduct,
}: {
  currentProduct?: { id: string; name: string; image: string; brand: string };
}) {
  const [items, setItems] = useState<ViewedItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const currentProductId = currentProduct?.id;

  useEffect(() => {
    if (currentProduct) {
      addViewed(currentProduct);
    }
    setItems(getViewed());
    setMounted(true);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ViewedItem[];
      setItems(detail);
    };
    window.addEventListener("viewed-updated", handler);
    return () => window.removeEventListener("viewed-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProductId]);

  const handleClear = () => {
    clearViewed();
    setItems([]);
  };

  // Exclude current product from the list
  const displayItems = items.filter((v) => v.id !== currentProductId);

  if (!mounted || displayItems.length < 2) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recently Viewed</h2>
        <button onClick={handleClear} className="btn btn-ghost btn-sm gap-1 text-base-content/60">
          <Trash2 className="w-3.5 h-3.5" />
          Clear History
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
        {displayItems.map((item) => (
          <Link
            key={item.id}
            href={`/phone/${item.id}`}
            className="snap-start shrink-0 w-28 flex flex-col items-center gap-2 group"
          >
            <div className="w-24 h-24 rounded-xl bg-base-200 border border-base-300 overflow-hidden flex items-center justify-center group-hover:border-primary transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain p-2"
                loading="lazy"
              />
            </div>
            <span className="text-sm text-center line-clamp-2 leading-snug text-base-content/80 group-hover:text-primary transition-colors">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
