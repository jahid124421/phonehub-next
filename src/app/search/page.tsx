import type { Metadata } from "next";
import { getAllProducts, getAllBrands, getScoreForProduct } from "@/lib/data";
import { SITE_URL } from "@/lib/config";
import AnswerBox from "@/components/AnswerBox";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description: "Browse and filter all products by brand, price and rating.",
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PhoneHub Search' }],
  },
};

export default function SearchPage() {
  const allProducts = getAllProducts();
  const brands = getAllBrands();

  // Extract unique categories from products
  const categories = Array.from(new Set(allProducts.map((p) => p.category || "phone")));

  // Only pass first page of results (sorted by popularity) to reduce initial payload.
  // Scores attached server-side so PhoneCard never bundles @/lib/data client-side.
  const initialResults = [...allProducts]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 20)
    .map((p) => ({ ...p, score: getScoreForProduct(p.id) }));

  // Pre-compute brand product counts server-side
  const brandProductCounts: Record<string, number> = {};
  for (const p of allProducts) {
    brandProductCounts[p.brand] = (brandProductCounts[p.brand] || 0) + 1;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <AnswerBox />
      </div>
      <SearchClient
        initialResults={initialResults}
        initialBrands={brands}
        categories={categories}
        totalProducts={allProducts.length}
        brandProductCounts={brandProductCounts}
      />
    </>
  );
}
