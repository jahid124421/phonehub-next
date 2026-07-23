import products from '@/data/products.json';
import brands from '@/data/brands.json';
import news from '@/data/news.json';
import stores from '@/data/stores.json';
import specs from '@/data/specs.json';

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

// Data access functions
export function getAllProducts(): Product[] {
  return products as Product[];
}

export function getAllBrands(): Brand[] {
  return brands as Brand[];
}

export function getAllNews(): NewsItem[] {
  return news as NewsItem[];
}

export function getStores(): string[] {
  return stores as string[];
}

export function getProductById(id: string): Product | undefined {
  return (products as Product[]).find((p) => p.id === id);
}

export function getProductsByBrand(brandId: string): Product[] {
  return (products as Product[]).filter((p) => p.brand === brandId);
}

export function getProductsByCategory(category: string): Product[] {
  return (products as Product[]).filter((p) => p.category === category);
}

export function getSpecsForProduct(
  productId: string
): Record<string, Record<string, string>> | undefined {
  const specsData = specs as Record<string, Record<string, Record<string, string>>>;
  return specsData[productId];
}
