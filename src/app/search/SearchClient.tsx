"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { type Brand } from "@/lib/data";
import PhoneCard, { type CardProduct } from "@/components/PhoneCard";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import { CATEGORIES } from "@/lib/categories";

const PER_PAGE = 20;
const MAX_PRICE_LIMIT = 200000;

const CAT_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.label])
);

interface Props {
  initialResults: CardProduct[];
  initialBrands: Brand[];
  categories: string[];
  totalProducts: number;
  brandProductCounts: Record<string, number>;
}

export default function SearchClient({
  initialResults,
  initialBrands,
  categories,
  totalProducts,
  brandProductCounts,
}: Props) {
  return (
    <Suspense
      fallback={<div className="container py-12 text-center">Loading search...</div>}
    >
      <SearchClientInner
        initialResults={initialResults}
        initialBrands={initialBrands}
        categories={categories}
        totalProducts={totalProducts}
        brandProductCounts={brandProductCounts}
      />
    </Suspense>
  );
}

function SearchClientInner({
  initialResults,
  initialBrands,
  categories,
  totalProducts: _totalProducts,
  brandProductCounts,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetched results state
  const [results, setResults] = useState<CardProduct[]>(initialResults);
  const [total, setTotal] = useState(initialResults.length);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Read URL params
  const q = searchParams.get("q") || "";
  const cat = searchParams.get("cat") || "all";
  const brandParam = searchParams.get("brand") || "";
  const sort = searchParams.get("sort") || "popularity";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const maxPriceParam = parseInt(
    searchParams.get("maxPrice") || String(MAX_PRICE_LIMIT),
    10
  );
  const minRatingParam =
    parseFloat(searchParams.get("minRating") || "0") || 0;

  const selectedBrands = useMemo(
    () => new Set(brandParam ? brandParam.split(",").filter(Boolean) : []),
    [brandParam]
  );

  // Determine if we should use initialResults (default params, page 1)
  const isDefaultParams =
    !q &&
    cat === "all" &&
    !brandParam &&
    sort === "popularity" &&
    page === 1 &&
    maxPriceParam >= MAX_PRICE_LIMIT &&
    minRatingParam === 0;

  // Fetch from API when params change
  useEffect(() => {
    if (isDefaultParams) {
      setResults(initialResults);
      setTotal(_totalProducts);
      setTotalPages(Math.ceil(_totalProducts / PER_PAGE));
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat && cat !== "all") params.set("cat", cat);
    if (brandParam) params.set("brand", brandParam);
    if (sort && sort !== "popularity") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    params.set("limit", String(PER_PAGE));

    fetch(`/api/search?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.results || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    q,
    cat,
    brandParam,
    sort,
    page,
    maxPriceParam,
    minRatingParam,
    isDefaultParams,
    initialResults,
    _totalProducts,
  ]);

  // Note: maxPrice and minRating are client-side only filters when using initialResults
  // When using the API, we rely on the API to handle these. For the default view
  // (initialResults), apply client-side price/rating filters if set.
  const pageItems = useMemo(() => {
    if (!isDefaultParams) return results;

    // For default view with initialResults, apply any active client-side filters
    let list = results;
    if (maxPriceParam < MAX_PRICE_LIMIT || minRatingParam > 0) {
      list = list.filter((p) => {
        if (p.basePrice > 0 && p.basePrice > maxPriceParam) return false;
        if (p.rating < minRatingParam) return false;
        return true;
      });
    }
    return list;
  }, [results, isDefaultParams, maxPriceParam, minRatingParam]);

  const safePage = Math.min(page, totalPages);

  // URL updater
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      // Reset page on filter changes (not when page itself changes)
      if (!("page" in updates)) {
        params.delete("page");
      }
      const qs = params.toString();
      router.push(qs ? `/search?${qs}` : "/search");
    },
    [router, searchParams]
  );

  // Filter change handlers
  const handleBrandToggle = useCallback(
    (brandId: string, checked: boolean) => {
      const next = new Set(selectedBrands);
      if (checked) next.add(brandId);
      else next.delete(brandId);
      updateParams({ brand: next.size > 0 ? Array.from(next).join(",") : null });
    },
    [selectedBrands, updateParams]
  );

  const handleCategoryChange = useCallback(
    (c: string) => {
      updateParams({ cat: c === "all" ? null : c });
    },
    [updateParams]
  );

  const handleSortChange = useCallback(
    (val: string) => {
      updateParams({ sort: val === "popularity" ? null : val });
    },
    [updateParams]
  );

  const handleMaxPriceChange = useCallback(
    (val: number) => {
      updateParams({ maxPrice: val >= MAX_PRICE_LIMIT ? null : String(val) });
    },
    [updateParams]
  );

  const handleMinRatingChange = useCallback(
    (val: number) => {
      updateParams({ minRating: val === 0 ? null : String(val) });
    },
    [updateParams]
  );

  const handleReset = useCallback(() => {
    router.push("/search");
  }, [router]);

  // Breadcrumb label
  const crumbLabel = q
    ? `Search: "${q}"`
    : cat !== "all"
      ? CAT_LABELS[cat] || cat
      : "All Products";

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: crumbLabel }]} />

      {/* Mobile filter toggle */}
      <button
        className="btn btn-sm btn-outline mt-3 lg:hidden"
        onClick={() => setSidebarOpen((v) => !v)}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586L3.293 6.707A1 1 0 013 6V4z"
          />
        </svg>
        Filters
      </button>

      <div className="flex gap-6 mt-4">
        {/* Sidebar */}
        <aside
          className={`w-[260px] shrink-0 space-y-5 ${
            sidebarOpen ? "block" : "hidden"
          } lg:block`}
        >
          <div className="bg-base-200 border border-base-300 rounded-xl p-4 space-y-5 sticky top-20">
            <h3 className="font-semibold text-base">Filters</h3>

            {/* Brand checkboxes */}
            <div>
              <p className="font-medium text-sm mb-2">Brand</p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {initialBrands
                  .filter((b) => brandProductCounts[b.id])
                  .map((b) => (
                    <label
                      key={b.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs checkbox-primary"
                        checked={selectedBrands.has(b.id)}
                        onChange={(e) =>
                          handleBrandToggle(b.id, e.target.checked)
                        }
                      />
                      <span className="truncate">
                        {b.name}
                        <span className="text-base-content/40 ml-1">
                          ({brandProductCounts[b.id]})
                        </span>
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Max Price */}
            <div>
              <p className="font-medium text-sm mb-2">
                Max Price:{" "}
                <span className="text-primary">
                  ${maxPriceParam.toLocaleString()}
                </span>
              </p>
              <input
                type="range"
                className="range range-sm range-primary"
                min={0}
                max={MAX_PRICE_LIMIT}
                step={5000}
                value={maxPriceParam}
                onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
              />
              <div className="flex justify-between text-sm text-base-content/50 mt-1">
                <span>$0</span>
                <span>${MAX_PRICE_LIMIT.toLocaleString()}</span>
              </div>
            </div>

            {/* Min Rating */}
            <div>
              <p className="font-medium text-sm mb-2">Min Rating</p>
              <div className="space-y-1.5">
                {[
                  { value: 0, label: "Any" },
                  { value: 4, label: "4★ & up" },
                  { value: 4.5, label: "4.5★ & up" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="minRating"
                      className="radio radio-xs radio-primary"
                      value={opt.value}
                      checked={minRatingParam === opt.value}
                      onChange={() => handleMinRatingChange(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Featured Searches */}
            <div>
              <p className="font-medium text-sm mb-2">Featured Searches</p>
              <div className="space-y-1.5">
                {[
                  { label: "8GB RAM", param: "q", value: "8GB RAM" },
                  { label: "256GB Storage", param: "q", value: "256GB" },
                  { label: "5000mAh Battery", param: "q", value: "5000mAh" },
                  { label: "64MP Camera", param: "q", value: "64MP" },
                ].map((feat) => (
                  <label
                    key={feat.label}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs checkbox-primary"
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateParams({ [feat.param]: feat.value });
                        } else {
                          updateParams({ [feat.param]: null });
                        }
                      }}
                    />
                    {feat.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Reset */}
            <button
              className="btn btn-warning btn-sm w-full font-semibold"
              onClick={handleReset}
            >
              Reset All
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Category chips + Sort on same line */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {["all", ...categories].map((c) => (
                <button
                  key={c}
                  onClick={() => handleCategoryChange(c)}
                  className={`btn btn-sm ${
                    cat === c ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {c === "all" ? "All" : CAT_LABELS[c] || c}
                </button>
              ))}
            </div>
            <select
              className="select select-sm select-bordered w-auto"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="popularity">Sort: Popularity</option>
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Sort: Price low → high</option>
              <option value="price_desc">Sort: Price high → low</option>
              <option value="rating">Sort: Rating</option>
            </select>
          </div>

          {/* Results count + loading indicator */}
          <div className="flex items-center justify-between mb-3 text-sm text-base-content/60">
            <span>
              {total.toLocaleString()} products found
              {isLoading && " · Loading..."}
            </span>
          </div>

          {/* Results grid */}
          {pageItems.length > 0 ? (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              }}
            >
              {pageItems.map((p) => (
                <PhoneCard key={p.id} product={p} score={p.score} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-base-content/50">
              <p className="text-lg">No products match your filters.</p>
              <p className="text-sm mt-1">Try widening your search.</p>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && totalPages > 1 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              basePath="/search"
            />
          )}
        </div>
      </div>
    </div>
  );
}
