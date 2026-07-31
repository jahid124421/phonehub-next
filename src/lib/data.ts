import products from '@/data/products.json';
import brands from '@/data/brands.json';
import news from '@/data/news.json';
import stores from '@/data/stores.json';
import specs from '@/data/specs.json';
import monitors from '@/data/monitors.json';
import routers from '@/data/routers.json';
import benchmarks from '@/data/benchmarks.json';
import contentData from '@/data/content.json';

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
