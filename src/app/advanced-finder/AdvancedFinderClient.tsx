"use client";

import { useEffect, useRef, useState } from "react";
import PhoneCard, { type CardProduct } from "@/components/PhoneCard";
import {
  DEFAULT_FINDER_STATE,
  SORT_OPTIONS,
  countActiveFilters,
  encodeFinderState,
  type FacetOptions,
  type FinderState,
  type RangeBounds,
  type SortKey,
} from "./finder-shared";

const RESULTS_LIMIT = 60;

interface AdvancedFinderClientProps {
  facetOptions: FacetOptions;
  initialState: FinderState;
  initialResults: CardProduct[];
  initialTotal: number;
}

type ToggleKey = "has5G" | "nfc" | "wirelessCharging" | "ipRating" | "esim";

const TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: "has5G", label: "5G" },
  { key: "nfc", label: "NFC" },
  { key: "wirelessCharging", label: "Wireless charging" },
  { key: "ipRating", label: "Water resistant (IP)" },
  { key: "esim", label: "eSIM" },
];

/** Dual-thumb range facet built from two stacked native range inputs. */
function FacetRange({
  label,
  bounds,
  step,
  format,
  lo,
  hi,
  onChange,
}: {
  label: string;
  bounds: RangeBounds;
  step: number;
  format: (v: number) => string;
  lo: number | null;
  hi: number | null;
  onChange: (lo: number | null, hi: number | null) => void;
}) {
  const curLo = lo ?? bounds.min;
  const curHi = hi ?? bounds.max;
  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
          {label}
        </h3>
        <span className="text-xs text-base-content/60">
          {format(curLo)} – {format(curHi)}
        </span>
      </div>
      <input
        type="range"
        aria-label={`${label} minimum`}
        className="range range-xs range-primary w-full"
        min={bounds.min}
        max={bounds.max}
        step={step}
        value={curLo}
        onChange={(e) => {
          const v = Math.min(Number(e.target.value), curHi);
          onChange(v <= bounds.min ? null : v, hi);
        }}
      />
      <input
        type="range"
        aria-label={`${label} maximum`}
        className="range range-xs range-primary w-full -mt-1"
        min={bounds.min}
        max={bounds.max}
        step={step}
        value={curHi}
        onChange={(e) => {
          const v = Math.max(Number(e.target.value), curLo);
          onChange(lo, v >= bounds.max ? null : v);
        }}
      />
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="card card-compact bg-base-200 border border-base-300 animate-pulse">
      <div className="aspect-square bg-base-300" />
      <div className="card-body p-4 gap-2">
        <div className="h-4 bg-base-300 rounded w-3/4" />
        <div className="h-3 bg-base-300 rounded w-1/2" />
        <div className="h-5 bg-base-300 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function AdvancedFinderClient({
  facetOptions,
  initialState,
  initialResults,
  initialTotal,
}: AdvancedFinderClientProps) {
  const [state, setState] = useState<FinderState>(initialState);
  const [queryState, setQueryState] = useState<FinderState>(initialState);
  const [results, setResults] = useState<CardProduct[]>(initialResults);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");

  const seq = useRef(0);
  const firstRun = useRef(true);

  const update = (patch: Partial<FinderState>) =>
    setState((s) => ({ ...s, ...patch }));

  // Debounce all filter changes (~250ms — mainly for sliders)
  useEffect(() => {
    const t = setTimeout(() => setQueryState(state), 250);
    return () => clearTimeout(t);
  }, [state]);

  // Fetch results + sync shareable URL whenever the debounced state changes
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const qs = encodeFinderState(queryState);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);

    const mySeq = ++seq.current;
    setLoading(true);
    fetch(`/api/finder?${qs ? `${qs}&` : ""}limit=${RESULTS_LIMIT}`)
      .then((r) => {
        if (!r.ok) throw new Error(`finder request failed: ${r.status}`);
        return r.json() as Promise<{ results: CardProduct[]; total: number }>;
      })
      .then((data) => {
        if (seq.current !== mySeq) return;
        setResults(data.results);
        setTotal(data.total);
      })
      .catch(() => {
        /* keep previous results on error */
      })
      .finally(() => {
        if (seq.current === mySeq) setLoading(false);
      });
  }, [queryState]);

  const toggleBrand = (brand: string) =>
    update({
      brands: state.brands.includes(brand)
        ? state.brands.filter((b) => b !== brand)
        : [...state.brands, brand],
    });

  const clearAll = () =>
    setState({ ...DEFAULT_FINDER_STATE, sort: state.sort });

  const activeCount = countActiveFilters(state);

  // ── Active filter chips ──────────────────────────────────────────────────
  const chips: { key: string; label: string; remove: () => void }[] = [];
  state.brands.forEach((b) =>
    chips.push({ key: `brand-${b}`, label: b, remove: () => toggleBrand(b) })
  );
  const rangeChip = (
    key: string,
    label: string,
    lo: number | null,
    hi: number | null,
    bounds: RangeBounds,
    format: (v: number) => string,
    clear: () => void
  ) => {
    if (lo == null && hi == null) return;
    chips.push({
      key,
      label: `${label}: ${format(lo ?? bounds.min)} – ${format(hi ?? bounds.max)}`,
      remove: clear,
    });
  };
  rangeChip("price", "Price", state.priceMin, state.priceMax, facetOptions.price, (v) => `$${v}`, () =>
    update({ priceMin: null, priceMax: null })
  );
  rangeChip("ram", "RAM", state.ramMin, state.ramMax, facetOptions.ram, (v) => `${v} GB`, () =>
    update({ ramMin: null, ramMax: null })
  );
  rangeChip("storage", "Storage", state.storageMin, state.storageMax, facetOptions.storage, (v) => `${v} GB`, () =>
    update({ storageMin: null, storageMax: null })
  );
  rangeChip("battery", "Battery", state.batteryMin, state.batteryMax, facetOptions.battery, (v) => `${v} mAh`, () =>
    update({ batteryMin: null, batteryMax: null })
  );
  rangeChip("screen", "Screen", state.screenMin, state.screenMax, facetOptions.screen, (v) => `${v}"`, () =>
    update({ screenMin: null, screenMax: null })
  );
  rangeChip("year", "Year", state.yearMin, state.yearMax, facetOptions.year, (v) => `${v}`, () =>
    update({ yearMin: null, yearMax: null })
  );
  TOGGLES.forEach((t) => {
    if (state[t.key]) {
      chips.push({
        key: t.key,
        label: t.label,
        remove: () => update({ [t.key]: false } as Partial<FinderState>),
      });
    }
  });
  if (state.chipsetFamily) {
    chips.push({
      key: "chipset",
      label: state.chipsetFamily,
      remove: () => update({ chipsetFamily: null }),
    });
  }

  // ── Filter panel (shared between desktop sidebar & mobile drawer) ────────
  const visibleBrands = facetOptions.brands.filter((b) =>
    b.toLowerCase().includes(brandQuery.trim().toLowerCase())
  );

  const filterPanel = (
    <div className="space-y-5">
      {/* Brand multi-select with search */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
          Brand
        </h3>
        <input
          type="text"
          className="input input-bordered input-sm w-full mb-2"
          placeholder="Search brands…"
          value={brandQuery}
          onChange={(e) => setBrandQuery(e.target.value)}
        />
        <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
          {visibleBrands.map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={state.brands.includes(b)}
                onChange={() => toggleBrand(b)}
              />
              <span className="capitalize">{b}</span>
            </label>
          ))}
          {visibleBrands.length === 0 && (
            <p className="text-xs text-base-content/50">No brands match.</p>
          )}
        </div>
      </section>

      <FacetRange label="Price" bounds={facetOptions.price} step={10} format={(v) => `$${v}`}
        lo={state.priceMin} hi={state.priceMax}
        onChange={(lo, hi) => update({ priceMin: lo, priceMax: hi })} />
      <FacetRange label="RAM" bounds={facetOptions.ram} step={1} format={(v) => `${v} GB`}
        lo={state.ramMin} hi={state.ramMax}
        onChange={(lo, hi) => update({ ramMin: lo, ramMax: hi })} />
      <FacetRange label="Storage" bounds={facetOptions.storage} step={8} format={(v) => `${v} GB`}
        lo={state.storageMin} hi={state.storageMax}
        onChange={(lo, hi) => update({ storageMin: lo, storageMax: hi })} />
      <FacetRange label="Battery" bounds={facetOptions.battery} step={100} format={(v) => `${v} mAh`}
        lo={state.batteryMin} hi={state.batteryMax}
        onChange={(lo, hi) => update({ batteryMin: lo, batteryMax: hi })} />
      <FacetRange label="Screen size" bounds={facetOptions.screen} step={0.1} format={(v) => `${v.toFixed(1)}"`}
        lo={state.screenMin} hi={state.screenMax}
        onChange={(lo, hi) => update({ screenMin: lo, screenMax: hi })} />
      <FacetRange label="Release year" bounds={facetOptions.year} step={1} format={(v) => `${v}`}
        lo={state.yearMin} hi={state.yearMax}
        onChange={(lo, hi) => update({ yearMin: lo, yearMax: hi })} />

      {/* Chipset family */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
          Chipset family
        </h3>
        <select
          className="select select-bordered select-sm w-full"
          value={state.chipsetFamily ?? ""}
          onChange={(e) => update({ chipsetFamily: e.target.value || null })}
        >
          <option value="">Any chipset</option>
          {facetOptions.chipsetFamilies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </section>

      {/* Feature checkboxes */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
          Features
        </h3>
        <div className="space-y-1">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={state[t.key]}
                onChange={(e) => update({ [t.key]: e.target.checked } as Partial<FinderState>)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold">Advanced Phone Finder</h1>
        <p className="text-base-content/60 max-w-2xl mx-auto">
          Narrow down {facetOptions.totalProducts.toLocaleString()} phones by brand, price,
          RAM, storage, battery, display, chipset, connectivity and more.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Mobile filter toggle */}
        <div className="lg:hidden w-full">
          <button className="btn btn-outline btn-sm w-full" onClick={() => setMobileOpen(true)}>
            Filters
            {activeCount > 0 && <span className="badge badge-primary badge-sm">{activeCount}</span>}
          </button>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="card bg-base-200 border border-base-300 p-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Filters</h2>
              {activeCount > 0 && (
                <button className="btn btn-ghost btn-xs" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-base-100 border-r border-base-300 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Filters</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(false)} aria-label="Close filters">
                  ✕
                </button>
              </div>
              {filterPanel}
              <button className="btn btn-primary w-full mt-6" onClick={() => setMobileOpen(false)}>
                Show {total.toLocaleString()} results
              </button>
            </div>
          </div>
        )}

        {/* Results column */}
        <div className="flex-1 min-w-0 w-full">
          {/* Active chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.remove}
                  className="badge badge-outline gap-1 py-3 hover:badge-error transition-colors"
                >
                  <span className="capitalize">{c.label}</span>
                  <span aria-hidden>✕</span>
                </button>
              ))}
              <button className="btn btn-ghost btn-xs" onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}

          {/* Count + sort */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-sm text-base-content/60">
              {loading ? (
                "Searching…"
              ) : (
                <>
                  <span className="font-semibold text-base-content">{total.toLocaleString()}</span>{" "}
                  phones found
                  {total > results.length && ` — showing first ${results.length}`}
                </>
              )}
            </p>
            <select
              className="select select-bordered select-sm"
              value={state.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              aria-label="Sort results"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-base-content/50">
              <p className="text-lg font-medium">No phones match your filters</p>
              <p className="text-sm mt-2">Try widening a range or clearing some filters</p>
              <button className="btn btn-primary btn-sm mt-4" onClick={clearAll}>
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map((p) => (
                <PhoneCard key={p.id} product={p} score={p.score} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
