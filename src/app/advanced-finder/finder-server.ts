// Server-only helpers for the Advanced Finder: facet option building and the
// actual filter/sort execution on top of filterProducts() from "@/lib/data".

import {
  filterProducts,
  getPhoneProducts,
  getScoreForProduct,
  type FilterInput,
  type FilterSpecs,
  type Product,
} from "@/lib/data";
import type { FacetOptions, FinderState, RangeBounds } from "./finder-shared";
import type { CardProduct } from "@/components/PhoneCard";

type PhoneWithSpecs = Product & { filterSpecs: FilterSpecs };

function bounds(
  values: number[],
  fallback: RangeBounds,
  round: (v: number, isMin: boolean) => number = (v) => v
): RangeBounds {
  if (!values.length) return fallback;
  return {
    min: round(Math.min(...values), true),
    max: round(Math.max(...values), false),
  };
}

const roundTo = (step: number) => (v: number, isMin: boolean) =>
  isMin ? Math.floor(v / step) * step : Math.ceil(v / step) * step;

export function buildFacetOptions(): FacetOptions {
  const phones = getPhoneProducts();

  const brands = [...new Set(phones.map((p) => p.brand))].sort();
  const chipsetFamilies = [
    ...new Set(
      phones
        .map((p) => p.filterSpecs.chipsetFamily)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    ),
  ].sort();

  const numbers = (pick: (p: PhoneWithSpecs) => number | null) =>
    phones.map(pick).filter((v): v is number => typeof v === "number" && v > 0);

  return {
    brands,
    chipsetFamilies,
    price: bounds(
      phones.map((p) => p.basePrice).filter((v) => v > 0),
      { min: 0, max: 5000 },
      roundTo(10)
    ),
    ram: bounds(phones.flatMap((p) => p.filterSpecs.ram), { min: 1, max: 24 }),
    storage: bounds(phones.flatMap((p) => p.filterSpecs.storage), { min: 8, max: 1024 }),
    battery: bounds(numbers((p) => p.filterSpecs.batteryCapacity), { min: 1000, max: 10000 }, roundTo(100)),
    screen: bounds(numbers((p) => p.filterSpecs.displaySize), { min: 3, max: 8 }, roundTo(0.1)),
    year: bounds(numbers((p) => p.filterSpecs.launchYear), { min: 2018, max: new Date().getFullYear() }),
    totalProducts: phones.length,
  };
}

function rangeObj(min: number | null, max: number | null): { min?: number; max?: number } {
  const o: { min?: number; max?: number } = {};
  if (min != null) o.min = min;
  if (max != null) o.max = max;
  return o;
}

/** Variant-array range check (ram / storage are number[] on filterSpecs). */
function variantInRange(values: number[], min: number | null, max: number | null): boolean {
  return values.some(
    (v) => (min == null || v >= min) && (max == null || v <= max)
  );
}

function releaseTime(p: Product): number {
  const t = Date.parse(p.releaseDate || "");
  if (Number.isFinite(t)) return t;
  const year = parseInt((p.releaseDate || "").slice(0, 4), 10);
  return Number.isFinite(year) ? new Date(year, 0, 1).getTime() : 0;
}

function sortResults(results: PhoneWithSpecs[], sort: FinderState["sort"]): PhoneWithSpecs[] {
  const sorted = [...results];
  switch (sort) {
    case "price_asc":
      // Phones without a known price (0) sink to the bottom
      return sorted.sort(
        (a, b) => (a.basePrice || Infinity) - (b.basePrice || Infinity)
      );
    case "price_desc":
      return sorted.sort((a, b) => b.basePrice - a.basePrice);
    case "newest":
      return sorted.sort((a, b) => releaseTime(b) - releaseTime(a));
    case "score":
      return sorted.sort(
        (a, b) =>
          (getScoreForProduct(b.id)?.total ?? -1) -
          (getScoreForProduct(a.id)?.total ?? -1)
      );
    case "popularity":
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity);
  }
}

/** Strip heavy fields + filterSpecs — only what PhoneCard needs goes over the wire. */
function toCardProduct(p: PhoneWithSpecs): CardProduct {
  return {
    id: p.id,
    brand: p.brand,
    name: p.name,
    category: p.category,
    image: p.image,
    fallbackImg: p.fallbackImg,
    releaseDate: p.releaseDate,
    basePrice: p.basePrice,
    popularity: p.popularity,
    rating: p.rating,
    reviewCount: p.reviewCount,
    review: "",
    quickSpecs: {},
    prices: [],
    pros: [],
    cons: [],
    // PhoneCard takes the score as a prop so it never imports @/lib/data
    // into the client bundle.
    score: getScoreForProduct(p.id),
  };
}

export function runFinder(
  state: FinderState,
  limit = 60
): { results: CardProduct[]; total: number } {
  const filters: FilterInput = {};

  if (state.brands.length) filters.brand = state.brands;
  if (state.batteryMin != null || state.batteryMax != null) {
    filters.batteryCapacity = rangeObj(state.batteryMin, state.batteryMax);
  }
  if (state.screenMin != null || state.screenMax != null) {
    filters.displaySize = rangeObj(state.screenMin, state.screenMax);
  }
  if (state.yearMin != null || state.yearMax != null) {
    filters.launchYear = rangeObj(state.yearMin, state.yearMax);
  }
  if (state.has5G) filters.has5G = true;
  if (state.nfc) filters.nfc = true;
  if (state.wirelessCharging) filters.wirelessCharging = true;
  if (state.esim) filters.hasESIM = true;
  if (state.ipRating) filters.ipRating = true; // boolean-on-string: any IP rating
  if (state.chipsetFamily) filters.chipsetFamily = state.chipsetFamily;

  let results = filterProducts(filters);

  // Price: filter on basePrice (0 = unknown → excluded when a price range is set)
  if (state.priceMin != null || state.priceMax != null) {
    results = results.filter(
      (p) =>
        p.basePrice > 0 &&
        (state.priceMin == null || p.basePrice >= state.priceMin) &&
        (state.priceMax == null || p.basePrice <= state.priceMax)
    );
  }

  // RAM / storage: engine only supports ">=", so range-filter variants here
  if (state.ramMin != null || state.ramMax != null) {
    results = results.filter((p) =>
      variantInRange(p.filterSpecs.ram, state.ramMin, state.ramMax)
    );
  }
  if (state.storageMin != null || state.storageMax != null) {
    results = results.filter((p) =>
      variantInRange(p.filterSpecs.storage, state.storageMin, state.storageMax)
    );
  }

  const sorted = sortResults(results, state.sort);
  return {
    results: sorted.slice(0, Math.max(1, limit)).map(toCardProduct),
    total: sorted.length,
  };
}
