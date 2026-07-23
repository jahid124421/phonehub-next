"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCompareList, toggleCompare } from "./CompareButton";

export default function CompareBar() {
  const [items, setItems] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

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
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {items.map((id) => (
              <button
                key={id}
                onClick={() => handleRemove(id)}
                className="badge badge-outline badge-sm gap-1 hover:badge-error transition-colors"
                title="Remove from compare"
              >
                {id.length > 12 ? id.slice(0, 12) + "..." : id}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
          <span className="text-sm font-medium whitespace-nowrap">
            Compare {items.length} {items.length === 1 ? "phone" : "phones"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleClear} className="btn btn-ghost btn-sm">
            Clear
          </button>
          <Link
            href={compareUrl}
            className={`btn btn-primary btn-sm ${items.length < 2 ? "btn-disabled" : ""}`}
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}
