import products from '@/data/products.json';
import brands from '@/data/brands.json';
import news from '@/data/news.json';
import stores from '@/data/stores.json';
import specs from '@/data/specs.json';
import monitors from '@/data/monitors.json';
import routers from '@/data/routers.json';
import benchmarks from '@/data/benchmarks.json';
import contentData from '@/data/content.json';
import scoresData from '@/data/scores.json';
import upcomingDevices from '@/data/upcoming.json';
import guidesData from '@/data/guides.json';
import type { PhoneHubScore } from '@/lib/score-calculator';

// Type definitions
export interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  image: string;
  fallbackImg: string;
  releaseDate: string;
  basePrice: number;
  popularity: number;
  rating: number;
  reviewCount: number;
  review: string;
  quickSpecs: Record<string, string>;
  prices: Array<{ store: string; price: number | null; url: string }>;
  pros: string[];
  cons: string[];
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  color: string;
  category: string;
  sub_categories?: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  tag: string;
  url: string;
  source: string;
  image: string;
}

export interface Store {
  name: string;
}

// ── Pre-computed indexes (built once at module load) ────────────────────────
const allProductsList: Product[] = [
  ...(products as Product[]),
  ...(monitors as Product[]),
  ...(routers as Product[]),
];

const productById = new Map<string, Product>(
  allProductsList.map((p) => [p.id, p])
);
const productsByBrandMap = new Map<string, Product[]>();
const productsByCategoryMap = new Map<string, Product[]>();

for (const product of allProductsList) {
  // Brand index
  if (!productsByBrandMap.has(product.brand)) {
    productsByBrandMap.set(product.brand, []);
  }
  productsByBrandMap.get(product.brand)!.push(product);

  // Category index
  if (!productsByCategoryMap.has(product.category)) {
    productsByCategoryMap.set(product.category, []);
  }
  productsByCategoryMap.get(product.category)!.push(product);
}

// Data access functions
export function getAllProducts(): Product[] {
  return allProductsList;
}

export function getAllBrands(): Brand[] {
  return brands as Brand[];
}

export function getAllNews(): NewsItem[] {
  const allNews = news as NewsItem[];
  // Return ALL news sorted by date (newest first) — no date filter
  return [...allNews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getStores(): string[] {
  return stores as string[];
}

export function getProductById(id: string): Product | undefined {
  return productById.get(id);
}

export function getProductsByIds(ids: string[]): Product[] {
  return ids
    .map((id) => productById.get(id))
    .filter((p): p is Product => !!p);
}

export function getProductsByBrand(brandId: string): Product[] {
  return productsByBrandMap.get(brandId) || [];
}

export function getProductsByCategory(category: string): Product[] {
  return productsByCategoryMap.get(category) || [];
}

export function getSpecsForProduct(
  productId: string
): Record<string, Record<string, string>> | undefined {
  const specsData = specs as Record<string, Record<string, Record<string, string>>>;
  return specsData[productId];
}

export function getMonitors(): Product[] {
  return monitors as Product[];
}

export function getRouters(): Product[] {
  return routers as Product[];
}

export function getBenchmarksForProduct(productId: string): BenchmarkData | null {
  const data = benchmarks as Record<string, BenchmarkData>;
  return data[productId] || null;
}

export function getTopBenchmarkProducts(limit = 50, sortBy = 'antutu.total'): BenchmarkEntry[] {
  return Object.entries(benchmarks)
    .map(([id, scores]) => ({ id, ...(scores as BenchmarkData) }))
    .sort((a, b) => {
      const getVal = (obj: any, path: string) => path.split('.').reduce((o, k) => o?.[k], obj);
      return (getVal(b, sortBy) || 0) - (getVal(a, sortBy) || 0);
    })
    .slice(0, limit);
}

export function getAllBenchmarks(): Record<string, BenchmarkData> {
  return benchmarks as Record<string, BenchmarkData>;
}

export interface GeekbenchScores {
  single: number;
  multi: number;
}

export interface AntutuScores {
  total: number;
  cpu: number;
  gpu: number;
  mem: number;
  ux: number;
}

export interface BenchmarkData {
  geekbench: GeekbenchScores;
  antutu: AntutuScores;
}

export interface BenchmarkEntry extends BenchmarkData {
  id: string;
}

// ── AI Content helpers ───────────────────────────────────────────────────────
export interface AIContent {
  review: string;
  pros: string[];
  cons: string[];
  rating: number;
  popularity: number;
}

export function getAIContentForProduct(productId: string): AIContent | null {
  return (contentData as Record<string, AIContent>)[productId] || null;
}

export function getAllAIContent(): Record<string, AIContent> {
  return contentData as Record<string, AIContent>;
}

// ── Filter / Finder helpers ─────────────────────────────────────────────────

export interface FilterSpecs {
  displayTechnology: string | null;
  refreshRate: number | null;
  displaySize: number | null;
  displayResolution: string | null;
  hdr: boolean;
  brightnessNits: number | null;
  mainCameraMP: number | null;
  cameraCount: number | null;
  ois: boolean;
  ultrawide: boolean;
  telephoto: boolean;
  videoResolution: string | null;
  flash: string | null;
  selfieType: string | null;
  batteryCapacity: number | null;
  chargingWatt: number | null;
  wirelessCharging: boolean;
  removableBattery: boolean;
  batteryType: string | null;
  chipset: string | null;
  chipsetFamily: string | null;
  ram: number[];
  storage: number[];
  cpuCores: number | null;
  gpu: string | null;
  ipRating: string | null;
  bodyMaterial: string | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  has5G: boolean;
  wifiStandard: string | null;
  nfc: boolean;
  bluetooth: number | null;
  usbType: string | null;
  has35mmJack: boolean;
  simType: string | null;
  simCount: number | null;
  hasESIM: boolean;
  fingerprintLocation: string | null;
  os: string | null;
  osFamily: string | null;
  formFactor: string | null;
  colors: string[];
  launchYear: number | null;
  price: number | null;
}

export function getFilterSpecsForProduct(productId: string): FilterSpecs | null {
  const product = productById.get(productId);
  return (product as any)?.filterSpecs ?? null;
}

/** Get all phones with filterSpecs (category === "phone") */
export function getPhoneProducts(): (Product & { filterSpecs: FilterSpecs })[] {
  return (products as any[]).filter(
    (p) => p.category === "phone" && p.filterSpecs
  );
}

export interface FilterInput {
  [field: string]: unknown;
}

/**
 * Filter phone products by filterSpecs values.
 * Supports:
 *   - boolean: must match exactly
 *   - string: must match exactly
 *   - string[]: value must be in array (multiselect OR)
 *   - number: must match (for select)
 *   - { min?: number, max?: number }: range filter
 *   - number[]: value array must intersect with filter array (for RAM/storage)
 */
export function filterProducts(filters: FilterInput): (Product & { filterSpecs: FilterSpecs })[] {
  const allPhones = getPhoneProducts();
  if (!filters || Object.keys(filters).length === 0) return allPhones;

  return allPhones.filter((product) => {
    const fs = product.filterSpecs;
    for (const [field, filterValue] of Object.entries(filters)) {
      if (filterValue === undefined || filterValue === null || filterValue === "") continue;

      // Special: brand filter
      if (field === "brand") {
        const brands = Array.isArray(filterValue) ? filterValue : [filterValue];
        if (!brands.includes(product.brand)) return false;
        continue;
      }

      const val = (fs as any)[field];
      if (val === undefined || val === null) continue; // graceful degradation

      // Range filter { min, max }
      if (typeof filterValue === "object" && filterValue !== null && !Array.isArray(filterValue)) {
        const { min, max } = filterValue as { min?: number; max?: number };
        const numVal = typeof val === "number" ? val : null;
        if (numVal === null) continue;
        if (min !== undefined && numVal < min) return false;
        if (max !== undefined && numVal > max) return false;
        continue;
      }

      // Boolean toggle
      if (typeof filterValue === "boolean") {
        if (typeof val === "boolean" && val !== filterValue) return false;
        // Toggle on non-null string (e.g. ipRating, gpu)
        if (typeof val === "string" && filterValue === true && !val) return false;
        if (typeof val === "number" && filterValue === true && val === 0) return false;
        continue;
      }

      // Array filter (multiselect — OR logic)
      if (Array.isArray(filterValue)) {
        if (Array.isArray(val)) {
          // Array-valued field (e.g. ram, storage) — intersection
          const hasIntersection = (filterValue as number[]).some((v) =>
            (val as number[]).some((sv) => sv >= v)
          );
          if (!hasIntersection) return false;
        } else {
          if (!(filterValue as (string | number)[]).includes(val as string | number)) return false;
        }
        continue;
      }

      // Single value match (string or number)
      if (typeof val === "number" && typeof filterValue === "number") {
        // For refresh rate / camera count selects: use >= for certain fields
        if (field === "refreshRate" || field === "cameraCount" || field === "cpuCores") {
          if (val < filterValue) return false;
        } else if (field === "bluetooth") {
          if (val < filterValue) return false;
        } else {
          if (val !== filterValue) return false;
        }
        continue;
      }

      if (String(val) !== String(filterValue)) return false;
    }
    return true;
  });
}

// ── PhoneHub Score ────────────────────────────────────────────────────────────────
export function getScoreForProduct(productId: string): PhoneHubScore | null {
  return (scoresData as Record<string, PhoneHubScore>)[productId] || null;
}

export function getAllScores(): Record<string, PhoneHubScore> {
  return scoresData as Record<string, PhoneHubScore>;
}

// ── Upcoming Devices ─────────────────────────────────────────────────────────────
export interface UpcomingDevice {
  id: string;
  name: string;
  brand: string;
  category: string;
  expectedLaunch: string;
  status: "confirmed" | "leaked" | "rumored";
  expectedPrice: string;
  expectedSpecs: {
    display?: string;
    chipset?: string;
    camera?: string;
    battery?: string;
    os?: string;
  };
  confidence: "high" | "medium" | "low";
}

export function getUpcomingDevices(): UpcomingDevice[] {
  return upcomingDevices as UpcomingDevice[];
}

// ── Rumor Tracker ────────────────────────────────────────────────────────────
const RUMOR_KEYWORDS = [
  "rumor",
  "rumour",
  "leak",
  "leaked",
  "renders",
  "allegedly",
  "reportedly",
  "tipped",
  "expected to",
  "upcoming",
  "spotted",
  "certification",
  "teased",
  "confirmed to",
];

export function getRumorNews(limit = 12): NewsItem[] {
  return getAllNews()
    .filter((item) => {
      const haystack = `${item.title} ${item.excerpt}`.toLowerCase();
      return RUMOR_KEYWORDS.some((kw) => haystack.includes(kw));
    })
    .slice(0, limit);
}

// ── Buying Guides ────────────────────────────────────────────────────────────────
export interface BuyingGuide {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  products: string[];
  reasoning: Record<string, string>;
}

export interface GuidesData {
  guides: BuyingGuide[];
}

export function getBuyingGuides(): BuyingGuide[] {
  return (guidesData as unknown as GuidesData).guides;
}

export function getGuideById(id: string): BuyingGuide | undefined {
  return (guidesData as unknown as GuidesData).guides.find((g) => g.id === id);
}
