'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/lib/data';
import { formatPrice, formatDate } from '@/lib/formatters';
import Breadcrumb from '@/components/Breadcrumb';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SpecsMap = Record<string, Record<string, Record<string, string>>>;

interface CompareClientProps {
  allSpecs: SpecsMap;
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

function lowestPrice(p: Product): number {
  if (p.prices && p.prices.length) {
    const valid = p.prices
      .map((pr) => pr.price)
      .filter((v): v is number => v !== null && v > 0);
    if (valid.length) return Math.min(...valid);
  }
  return p.basePrice ?? 0;
}

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

export default function CompareClient({ allSpecs }: CompareClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

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
            <tr>
              <td className="sticky left-0 bg-base-100 z-10 font-medium text-base-content/70">
                Lowest Price
              </td>
              {selectedProducts.map((p) => {
                const price = lowestPrice(p);
                return (
                  <td key={p.id} className="text-center font-semibold">
                    {formatPrice(price)}
                  </td>
                );
              })}
            </tr>
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
                  const allSame = vals.every((v) => v === vals[0]);
                  return (
                    <tr key={key}>
                      <td className="sticky left-0 bg-base-100 z-10 font-medium text-base-content/70 text-sm">
                        {key}
                      </td>
                      {selectedProducts.map((p, i) => (
                        <td
                          key={p.id}
                          className={`text-center text-sm ${!allSame ? 'bg-primary/5' : ''}`}
                        >
                          {vals[i]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>

      <p className="text-base-content/50 text-sm mt-3">
        Highlighted cells indicate where the devices differ.
      </p>
    </div>
  );
}
