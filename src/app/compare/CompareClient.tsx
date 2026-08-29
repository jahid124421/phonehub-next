'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/lib/data';
import { formatPrice, formatDate } from '@/lib/formatters';
import Breadcrumb from '@/components/Breadcrumb';
import ScoreBadge from '@/components/ScoreBadge';
import type { PhoneHubScore } from '@/lib/score-calculator';
import { scoreColor } from "@/lib/score-color";
import {
  computeRecommendation,
  computeUseCaseVerdicts,
  getLowestPrice,
  getRowVerdict,
  type ScoresMap,
  type SpecsMap,
} from '@/lib/compare-verdict';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

const USE_CASE_ICONS: Record<string, string> = {
  overall: '🏆',
  photography: '📷',
  gaming: '🎮',
  battery: '🔋',
  value: '💰',
};

interface CompareClientProps {
  // No props — specs & scores are fetched on demand for the selected IDs
  // via /api/specs so the page never ships the full 1.6k-product dataset
  // to the client (previously 474 KB specs + 181 KB scores).
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'phonehub_compare';
const MAX_PRODUCTS = 4;

const SECTION_ORDER = [
  'Network',
  'Launch',
  'Body',
  'Display',
  'Platform',
  'Memory',
  'Main Camera',
  'Selfie Camera',
  'Sound',
  'Comms',
  'Features',
  'Battery',
  'Misc',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const lowestPrice = getLowestPrice;

function sortSections(sections: string[]): string[] {
  const orderMap = new Map(SECTION_ORDER.map((s, i) => [s.toLowerCase(), i]));
  return [...sections].sort((a, b) => {
    const ai = orderMap.get(a.toLowerCase()) ?? 999;
    const bi = orderMap.get(b.toLowerCase()) ?? 999;
    return ai - bi;
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CompareClient(_props: CompareClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [allSpecs, setAllSpecs] = useState<SpecsMap>({});
  const [allScores, setAllScores] = useState<ScoresMap>({});
  const [diffsOnly, setDiffsOnly] = useState(false);

  // Derive selected IDs from URL or localStorage
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    const urlIds = (searchParams.get('ids') || '').split(',').filter(Boolean);
    if (urlIds.length > 0) {
      const trimmed = urlIds.slice(0, MAX_PRODUCTS);
      setSelectedIds(trimmed);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch {}
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
        setSelectedIds(stored.slice(0, MAX_PRODUCTS));
      } catch {
        setSelectedIds([]);
      }
    }
  }, [searchParams]);

  // Fetch product details for selected IDs from API
  useEffect(() => {
    if (selectedIds.length === 0) {
      setSelectedProducts([]);
      return;
    }

    let cancelled = false;
    setIsLoadingProducts(true);

    fetch(`/api/search?ids=${selectedIds.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const products = (data.results || []) as Product[];
        // Maintain order matching selectedIds
        const ordered = selectedIds
          .map((id) => products.find((p) => p.id === id))
          .filter(Boolean) as Product[];
        setSelectedProducts(ordered);
        setIsLoadingProducts(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  // Fetch specs & scores for the selected IDs (on demand — avoids shipping
  // the full 1.6k-product specs/scores datasets to every visitor).
  useEffect(() => {
    if (selectedIds.length < 2) {
      setAllSpecs({});
      setAllScores({});
      return;
    }
    let cancelled = false;
    fetch(`/api/specs?ids=${selectedIds.join(',')}`)
      .then((r) => r.json())
      .then((data: { specs: SpecsMap; scores: ScoresMap }) => {
        if (cancelled) return;
        setAllSpecs(data.specs || {});
        setAllScores((data.scores as ScoresMap) || {});
      })
      .catch(() => {
        if (cancelled) return;
        setAllSpecs({});
        setAllScores({});
      });
    return () => { cancelled = true; };
  }, [selectedIds]);

  // Update URL + localStorage
  const persistIds = useCallback(
    (ids: string[]) => {
      setSelectedIds(ids);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
      const params = new URLSearchParams();
      if (ids.length) params.set('ids', ids.join(','));
      router.replace(`/compare?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const removeProduct = useCallback(
    (id: string) => {
      persistIds(selectedIds.filter((i) => i !== id));
    },
    [selectedIds, persistIds],
  );

  // Collect all spec sections + keys (union across selected products)
  const specSections = useMemo(() => {
    const sections: Record<string, Set<string>> = {};
    selectedProducts.forEach((p) => {
      const specs = allSpecs[p.id];
      if (!specs) return;
      Object.entries(specs).forEach(([section, rows]) => {
        if (!sections[section]) sections[section] = new Set();
        Object.keys(rows).forEach((k) => sections[section].add(k));
      });
    });
    return sections;
  }, [selectedProducts, allSpecs]);

  const sortedSections = useMemo(() => sortSections(Object.keys(specSections)), [specSections]);

  // Verdicts + recommendation (deterministic, derived from specs/scores)
  const useCaseVerdicts = useMemo(
    () => computeUseCaseVerdicts(selectedProducts, allSpecs, allScores),
    [selectedProducts, allSpecs, allScores],
  );
  const recommendation = useMemo(
    () => computeRecommendation(selectedProducts, allSpecs, allScores),
    [selectedProducts, allSpecs, allScores],
  );

  // Don't render until mounted (avoid hydration mismatch with useSearchParams)
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />
        <h1 className="text-3xl font-bold mt-4 mb-2">Compare Devices</h1>
        <div className="loading loading-spinner loading-lg mt-12 mx-auto block" />
      </div>
    );
  }

  /* ---- Empty state ---- */
  if (selectedProducts.length < 2 && !isLoadingProducts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />
        <div className="flex flex-col items-center justify-center text-center py-20">
          <h1 className="text-3xl font-bold mb-2">Compare Devices</h1>
          <p className="text-base-content/60 mb-8 max-w-md">
            Add up to 4 devices to compare specs side by side
          </p>
          <Link href="/search" className="btn btn-primary">
            Browse Devices
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Loading state ---- */
  if (isLoadingProducts || selectedProducts.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />
        <h1 className="text-3xl font-bold mt-4 mb-2">Compare Devices</h1>
        <div className="loading loading-spinner loading-lg mt-12 mx-auto block" />
      </div>
    );
  }

  /* ---- Comparison table ---- */
  const colCount = selectedProducts.length + 1; // +1 for label column

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />
      <h1 className="text-3xl font-bold mt-4 mb-1">Compare Devices</h1>
      <p className="text-base-content/60 mb-6">
        Comparing {selectedProducts.length} device{selectedProducts.length > 1 ? 's' : ''} side by side
      </p>

      {/* ---- PhoneHub recommends ---- */}
      {recommendation && (
        <div className="rounded-box border border-primary/40 bg-primary/5 p-4 mb-4 flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5" aria-hidden>🏆</span>
          <div>
            <p className="font-bold">{recommendation.headline}</p>
            <p className="text-sm text-base-content/70 mt-1">{recommendation.body}</p>
          </div>
        </div>
      )}

      {/* ---- Verdict strip: winner per use-case ---- */}
      {useCaseVerdicts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {useCaseVerdicts.map((v) => {
            const winner = selectedProducts[v.winnerIndex];
            if (!winner) return null;
            const isOverall = v.id === 'overall';
            return (
              <div
                key={v.id}
                className={`rounded-box border p-3 ${
                  isOverall
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-base-300 bg-base-200/50'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                  {USE_CASE_ICONS[v.id]} {v.label}
                </p>
                <p className={`font-bold text-sm mt-1 ${isOverall ? 'text-primary' : ''}`}>
                  {winner.name}
                </p>
                <p className="text-xs text-base-content/60 mt-1">{v.reason}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Controls ---- */}
      <div className="flex justify-end mb-2">
        <label className="label cursor-pointer gap-2 py-0">
          <span className="label-text text-sm text-base-content/70">Show differences only</span>
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={diffsOnly}
            onChange={(e) => setDiffsOnly(e.target.checked)}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-pin-cols w-full">
          {/* ---- Header: product images + names + remove ---- */}
          <thead>
            <tr>
              <th className="sticky left-0 bg-base-100 z-10 min-w-[140px]" />
              {selectedProducts.map((p) => (
                <th key={p.id} className="text-center min-w-[180px]">
                  <Link href={`/phone/${p.id}`}>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="mx-auto rounded-lg bg-white p-1.5"
                      style={{ height: 120, width: 120, objectFit: 'contain', aspectRatio: '1' }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (p.fallbackImg && img.src !== p.fallbackImg) {
                          img.src = p.fallbackImg;
                        }
                      }}
                    />
                  </Link>
                  <Link
                    href={`/phone/${p.id}`}
                    className="block mt-2 font-semibold text-sm hover:text-primary transition-colors"
                  >
                    {p.name}
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm mt-2 text-error"
                    onClick={() => removeProduct(p.id)}
                  >
                    Remove ✕
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          {/* ---- Summary rows ---- */}
          <tbody>
            {/* PhoneHub Score row */}
            {(() => {
              const totals = selectedProducts.map((p) => allScores[p.id]?.total ?? null);
              const present = totals.filter((v): v is number => v !== null);
              const best = present.length >= 2 ? Math.max(...present) : null;
              const tied = present.length >= 2 && present.every((v) => v === best);
              return (
                <tr>
                  <td className="sticky left-0 bg-base-100 z-10 font-medium text-base-content/70">
                    PhoneHub Score
                  </td>
                  {selectedProducts.map((p, i) => {
                    const s = allScores[p.id];
                    const isWinner = !tied && best !== null && totals[i] === best;
                    return (
                      <td
                        key={p.id}
                        className={`text-center ${isWinner ? 'bg-success/10' : ''}`}
                      >
                        {s ? (
                          <div className="flex flex-col items-center gap-1">
                            <ScoreBadge score={s} size="compact" />
                            {isWinner && <span className="text-success text-xs font-semibold">✓ Best</span>}
                          </div>
                        ) : (
                          <span className="text-base-content/40 text-sm">N/A</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })()}
            {(() => {
              const prices = selectedProducts.map((p) => lowestPrice(p));
              const valid = prices.filter((n) => n > 0);
              const best = valid.length >= 2 ? Math.min(...valid) : null;
              const tied = valid.length >= 2 && valid.every((v) => v === best);
              return (
                <tr>
                  <td className="sticky left-0 bg-base-100 z-10 font-medium text-base-content/70">
                    Lowest Price
                  </td>
                  {selectedProducts.map((p, i) => {
                    const isWinner = !tied && best !== null && prices[i] === best;
                    return (
                      <td
                        key={p.id}
                        className={`text-center font-semibold ${isWinner ? 'bg-success/10 text-success' : ''}`}
                      >
                        {formatPrice(prices[i])}
                        {isWinner && <span className="ml-1">✓</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })()}
            <tr>
              <td className="sticky left-0 bg-base-100 z-10 font-medium text-base-content/70">
                Rating
              </td>
              {selectedProducts.map((p) => (
                <td key={p.id} className="text-center">
                  <span className="text-warning">★</span> {p.rating}
                  <span className="text-base-content/50 text-sm ml-1">({p.reviewCount})</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 bg-base-100 z-10 font-medium text-base-content/70">
                Released
              </td>
              {selectedProducts.map((p) => (
                <td key={p.id} className="text-center text-sm">
                  {formatDate(p.releaseDate)}
                </td>
              ))}
            </tr>
            {/* Score breakdown rows */}
            {(() => {
              const hasAnyScore = selectedProducts.some(p => allScores[p.id]);
              if (!hasAnyScore) return null;
              const categories: { label: string; key: keyof PhoneHubScore }[] = [
                { label: '📊 Display', key: 'display' },
                { label: '📷 Camera', key: 'camera' },
                { label: '⚡ Performance', key: 'performance' },
                { label: '🔋 Battery', key: 'battery' },
                { label: '💰 Value', key: 'value' },
                { label: '🏗 Build', key: 'build' },
              ];
              return categories.map(({ label, key }) => {
                const vals = selectedProducts.map((p) => allScores[p.id]?.[key] ?? null);
                const present = vals.filter((v): v is number => v !== null);
                const best = present.length >= 2 ? Math.max(...present) : null;
                const tied = present.length >= 2 && present.every((v) => v === best);
                return (
                  <tr key={key}>
                    <td className="sticky left-0 bg-base-100 z-10 font-medium text-base-content/70 text-sm">
                      {label}
                    </td>
                    {selectedProducts.map((p, i) => {
                      const val = vals[i];
                      const isWinner = !tied && best !== null && val === best;
                      const color = val == null ? undefined
                        : scoreColor(val);
                      return (
                        <td
                          key={p.id}
                          className={`text-center text-sm ${isWinner ? 'bg-success/10' : ''}`}
                        >
                          {val != null ? (
                            <span className="font-semibold" style={{ color }}>
                              {val}/100{isWinner && <span className="text-success ml-1">✓</span>}
                            </span>
                          ) : (
                            <span className="text-base-content/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })()}
          </tbody>

          {/* ---- Spec sections ---- */}
          {sortedSections.map((section) => {
            const keys = [...specSections[section]];
            return (
              <tbody key={section}>
                {/* Section header */}
                <tr>
                  <th
                    colSpan={colCount}
                    className="bg-base-200 font-bold text-lg"
                  >
                    {section}
                  </th>
                </tr>
                {/* Detail rows */}
                {keys.map((key) => {
                  const vals = selectedProducts.map((p) => {
                    const s = allSpecs[p.id];
                    return (s && s[section] && s[section][key]) || '—';
                  });
                  const verdict = getRowVerdict(vals, section, key);
                  if (diffsOnly && verdict.allSame) return null;
                  return (
                    <tr key={key} className={verdict.allSame ? 'opacity-60' : ''}>
                      <td className="sticky left-0 bg-base-100 z-10 font-medium text-base-content/70 text-sm">
                        {key}
                      </td>
                      {selectedProducts.map((p, i) => {
                        const isWinner = verdict.winners.includes(i);
                        const differs = !verdict.allSame;
                        return (
                          <td
                            key={p.id}
                            className={`text-center text-sm ${
                              isWinner
                                ? 'bg-success/10 font-semibold'
                                : differs && verdict.comparable
                                  ? ''
                                  : differs
                                    ? 'bg-primary/5'
                                    : ''
                            }`}
                          >
                            {vals[i]}
                            {isWinner && (
                              <span className="text-success ml-1" title="Best in this row">✓</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>

      <p className="text-base-content/50 text-sm mt-3">
        Green cells with a ✓ mark the winning value in comparable rows. Identical rows are dimmed
        — use the toggle above to show differences only.
      </p>
    </div>
  );
}
