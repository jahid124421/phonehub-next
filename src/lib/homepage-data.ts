import { getAllProducts, type Product } from "./data";

// Pre-compute sorted arrays at module load time
const allProducts = getAllProducts();

export const trendingProducts: Product[] = [...allProducts]
  .sort((a, b) => b.rating * b.popularity - a.rating * a.popularity)
  .slice(0, 8);

export const popularProducts: Product[] = [...allProducts]
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 8);

export const latestProducts: Product[] = [...allProducts]
  .filter((p) => p.releaseDate)
  .sort(
    (a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  )
  .slice(0, 8);

// Build brand product counts
export const brandProductCount: Record<string, number> = {};
for (const p of allProducts) {
  brandProductCount[p.brand] = (brandProductCount[p.brand] || 0) + 1;
}
