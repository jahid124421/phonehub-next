// Shared (client + server) types and querystring codec for the Advanced Finder.
// IMPORTANT: this module must stay free of "@/lib/data" imports so it can be
// safely bundled into the client without pulling in the product JSON.

export type SortKey = "popularity" | "price_asc" | "price_desc" | "newest" | "score";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popularity", label: "Most popular" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "newest", label: "Newest first" },
  { key: "score", label: "PhoneHub score" },
];

export interface RangeBounds {
  min: number;
  max: number;
}

export interface FinderState {
  brands: string[];
  priceMin: number | null;
  priceMax: number | null;
  ramMin: number | null;
  ramMax: number | null;
  storageMin: number | null;
  storageMax: number | null;
  batteryMin: number | null;
  batteryMax: number | null;
  screenMin: number | null;
  screenMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  has5G: boolean;
  nfc: boolean;
  wirelessCharging: boolean;
  ipRating: boolean;
  esim: boolean;
  chipsetFamily: string | null;
  sort: SortKey;
}

export const DEFAULT_FINDER_STATE: FinderState = {
  brands: [],
  priceMin: null,
  priceMax: null,
  ramMin: null,
  ramMax: null,
  storageMin: null,
  storageMax: null,
  batteryMin: null,
  batteryMax: null,
  screenMin: null,
  screenMax: null,
  yearMin: null,
  yearMax: null,
  has5G: false,
  nfc: false,
  wirelessCharging: false,
  ipRating: false,
  esim: false,
  chipsetFamily: null,
  sort: "popularity",
};

export interface FacetOptions {
  brands: string[];
  chipsetFamilies: string[];
  price: RangeBounds;
  ram: RangeBounds;
  storage: RangeBounds;
  battery: RangeBounds;
  screen: RangeBounds;
  year: RangeBounds;
  totalProducts: number;
}

type Getter = (key: string) => string | null;

function num(get: Getter, key: string): number | null {
  const raw = get(key);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function flag(get: Getter, key: string): boolean {
  return get(key) === "1";
}

/** Parse a querystring (via a getter) into a FinderState. */
export function parseFinderState(get: Getter): FinderState {
  const brands = (get("brands") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sortRaw = get("sort");
  const sort: SortKey = SORT_OPTIONS.some((o) => o.key === sortRaw)
    ? (sortRaw as SortKey)
    : "popularity";

  return {
    brands,
    priceMin: num(get, "pmin"),
    priceMax: num(get, "pmax"),
    ramMin: num(get, "ramin"),
    ramMax: num(get, "ramax"),
    storageMin: num(get, "stmin"),
    storageMax: num(get, "stmax"),
    batteryMin: num(get, "bmin"),
    batteryMax: num(get, "bmax"),
    screenMin: num(get, "scmin"),
    screenMax: num(get, "scmax"),
    yearMin: num(get, "ymin"),
    yearMax: num(get, "ymax"),
    has5G: flag(get, "g5"),
    nfc: flag(get, "nfc"),
    wirelessCharging: flag(get, "wlc"),
    ipRating: flag(get, "ip"),
    esim: flag(get, "esim"),
    chipsetFamily: get("chip") || null,
    sort,
  };
}

/** Encode a FinderState into a compact, shareable querystring ("" when default). */
export function encodeFinderState(s: FinderState): string {
  const p = new URLSearchParams();
  const setN = (k: string, v: number | null) => {
    if (v != null) p.set(k, String(v));
  };

  if (s.brands.length) p.set("brands", s.brands.join(","));
  setN("pmin", s.priceMin);
  setN("pmax", s.priceMax);
  setN("ramin", s.ramMin);
  setN("ramax", s.ramMax);
  setN("stmin", s.storageMin);
  setN("stmax", s.storageMax);
  setN("bmin", s.batteryMin);
  setN("bmax", s.batteryMax);
  setN("scmin", s.screenMin);
  setN("scmax", s.screenMax);
  setN("ymin", s.yearMin);
  setN("ymax", s.yearMax);
  if (s.has5G) p.set("g5", "1");
  if (s.nfc) p.set("nfc", "1");
  if (s.wirelessCharging) p.set("wlc", "1");
  if (s.ipRating) p.set("ip", "1");
  if (s.esim) p.set("esim", "1");
  if (s.chipsetFamily) p.set("chip", s.chipsetFamily);
  if (s.sort !== "popularity") p.set("sort", s.sort);

  return p.toString();
}

/** Number of active filter facets (sort is not counted). */
export function countActiveFilters(s: FinderState): number {
  let n = 0;
  if (s.brands.length) n++;
  if (s.priceMin != null || s.priceMax != null) n++;
  if (s.ramMin != null || s.ramMax != null) n++;
  if (s.storageMin != null || s.storageMax != null) n++;
  if (s.batteryMin != null || s.batteryMax != null) n++;
  if (s.screenMin != null || s.screenMax != null) n++;
  if (s.yearMin != null || s.yearMax != null) n++;
  if (s.has5G) n++;
  if (s.nfc) n++;
  if (s.wirelessCharging) n++;
  if (s.ipRating) n++;
  if (s.esim) n++;
  if (s.chipsetFamily) n++;
  return n;
}
