"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export default function CategoryStrip() {
  const searchParams = useSearchParams();
  const activeCat = searchParams.get("cat") || "all";

  return (
    <div className="cat-strip-outer relative">
      <div className="cat-strip">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCat === cat.slug;
          return (
            <div
              key={cat.slug}
              className="relative group"
            >
              <Link
                href={cat.slug === "all" ? "/search" : `/search?cat=${cat.slug}`}
                className={`cat-strip-link flex items-center justify-center gap-1.5 ${
                  isActive ? "cat-strip-link--active" : ""
                }`}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
                {cat.subs && (
                  <ChevronDown
                    size={12}
                    className="opacity-50 transition-transform duration-200 group-hover:rotate-180"
                  />
                )}
              </Link>

              {/* Dropdown – CSS-only via group-hover */}
              {cat.subs && (
                <div className="absolute top-full left-0 z-50 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
                  <div className="cat-dropdown">
                    {cat.subs.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/search?category=${cat.slug}&sub=${sub.slug}`}
                        className="cat-dropdown-item"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
