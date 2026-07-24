"use client";

import { useState, useEffect } from "react";

const COMPARE_KEY = "phonehub_compare";
const MAX_COMPARE = 4;

export function getCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(COMPARE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleCompare(productId: string): string[] {
  const list = getCompareList();
  const index = list.indexOf(productId);
  if (index > -1) {
    list.splice(index, 1);
  } else if (list.length < MAX_COMPARE) {
    list.push(productId);
  }
  localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("compare-updated", { detail: list }));
  return list;
}

export default function CompareButton({ productId }: { productId: string }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const list = getCompareList();
    setChecked(list.includes(productId));

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string[];
      setChecked(detail.includes(productId));
    };
    window.addEventListener("compare-updated", handler);
    return () => window.removeEventListener("compare-updated", handler);
  }, [productId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const list = toggleCompare(productId);
    setChecked(list.includes(productId));
  };

  return (
    <button
      onClick={handleToggle}
      className={`btn btn-sm ${checked ? "btn-primary" : "btn-ghost"} gap-1`}
      title={checked ? "Remove from compare" : "Add to compare"}
      aria-label={checked ? "Remove from compare" : "Add to compare"}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      {checked ? "Added" : "Compare"}
    </button>
  );
}
