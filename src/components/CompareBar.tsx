"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCompareList, toggleCompare } from "./CompareButton";

export default function CompareBar() {
  const [items, setItems] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  // Resolve product slugs to display names via lightweight API.
  // Previously this imported `getAllProducts()` which bundled the full 2.9 MB
  // products.json into every page's client JS. Now we fetch only the names
  // for the IDs actually in the compare tray.
  useEffect(() => {
    if (!items.length) return;
    const missing = items.filter((id) => !(id in nameMap));
    if (!missing.length) return;
    let cancelled = false;
    fetch(`/api/products?ids=${missing.join(",")}`)
      .then((r) => r.json())
      .then((data: { products: Array<{ id: string; name: string }> }) => {
        if (cancelled) return;
        const patch: Record<string, string> = {};
        for (const p of data.products || []) patch[p.id] = p.name;
        // Fill gaps for ids that the API didn't return (deleted products)
        for (const id of missing) if (!(id in patch)) patch[id] = id;
        setNameMap((prev) => ({ ...prev, ...patch }));
      })
      .catch(() => {
        if (cancelled) return;
        const fallback: Record<string, string> = {};
        for (const id of missing) fallback[id] = id;
        setNameMap((prev) => ({ ...prev, ...fallback }));
      });
    return () => { cancelled = true; };
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setItems(getCompareList());

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string[];
      setItems(detail);
    };
    window.addEventListener("compare-updated", handler);
    return () => window.removeEventListener("compare-updated", handler);
  }, []);

  useEffect(() => {
    setVisible(items.length > 0);
  }, [items]);

  const handleClear = () => {
    localStorage.setItem("phonehub_compare", JSON.stringify([]));
    setItems([]);
    window.dispatchEvent(new CustomEvent("compare-updated", { detail: [] }));
  };

  const handleRemove = (id: string) => {
    const updated = toggleCompare(id);
    setItems([...updated]);
  };

  if (!visible) return null;

  const compareUrl = `/compare?ids=${items.join(",")}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-base-100/95 backdrop-blur-lg border-t border-base-300 p-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            {items.map((id) => {
              const name = nameMap[id] || id;
              return (
                <button
                  key={id}
                  onClick={() => handleRemove(id)}
                  className="badge badge-outline badge-md gap-1 hover:badge-error transition-colors max-w-[160px]"
                  title={`Remove ${name} from compare`}
                >
                  <span className="truncate">{name}</span>
                  <svg className="w-3 h-3 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              );
            })}
          </div>
          <span className="text-sm font-medium whitespace-nowrap flex-none">
            Compare {items.length} {items.length === 1 ? "phone" : "phones"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-none ml-auto">
          <button onClick={handleClear} className="btn btn-ghost btn-sm">
            Clear
          </button>
          <Link
            href={compareUrl}
            className={`btn btn-primary btn-sm whitespace-nowrap ${items.length < 2 ? "btn-disabled" : ""}`}
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}
