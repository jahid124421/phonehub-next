import { NextResponse } from "next/server";
import products from "@/data/products.json";
import brands from "@/data/brands.json";
import news from "@/data/news.json";

/**
 * GET /api/health
 * Returns the current data health status.
 * Used by the DataHealthBadge component and external monitoring.
 */

export async function GET() {
  const prods = products as Array<{
    id: string;
    name: string;
    brand: string;
    image: string;
    basePrice: number;
    prices: Array<{ price: number | null }>;
  }>;
  const brandItems = brands as Array<{ id: string; name: string; logo: string }>;
  const newsItems = news as Array<{ id: string; date: string; title: string }>;

  // ── Price coverage ────────────────────────────────────────────────────
  const withPrice = prods.filter(
    (p) =>
      p.basePrice > 0 ||
      p.prices.some((pr) => pr.price !== null && pr.price > 0)
  );
  const priceCoveragePercent = prods.length
    ? Math.round((withPrice.length / prods.length) * 100)
    : 0;

  // ── Image coverage ────────────────────────────────────────────────────
  const withImage = prods.filter((p) => p.image && p.image.trim() !== "");
  const imageCoveragePercent = prods.length
    ? Math.round((withImage.length / prods.length) * 100)
    : 0;

  // ── News freshness ────────────────────────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const freshNews = newsItems.filter((n) => {
    const d = new Date(n.date);
    return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
  });
  const newsFreshnessPercent = newsItems.length
    ? Math.round((freshNews.length / newsItems.length) * 100)
    : 0;

  // ── Brands with logos ─────────────────────────────────────────────────
  const brandsWithLogos = brandItems.filter(
    (b) => b.logo && b.logo.trim() !== ""
  );
  const brandLogoPercent = brandItems.length
    ? Math.round((brandsWithLogos.length / brandItems.length) * 100)
    : 0;

  // ── Duplicate check ───────────────────────────────────────────────────
  const nameCounts = new Map<string, number>();
  prods.forEach((p) => {
    const key = `${p.brand}:${p.name}`.toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  });
  const duplicateCount = [...nameCounts.values()].filter((c) => c > 1).length;

  // ── Derive overall status ──────────────────────────────────────────────
  let status: "healthy" | "warning" | "critical" = "healthy";
  const warnings: string[] = [];

  if (prods.length === 0) {
    status = "critical";
    warnings.push("No products in database");
  }
  if (priceCoveragePercent < 30) {
    status = "critical";
    warnings.push(`Price coverage critically low: ${priceCoveragePercent}%`);
  } else if (priceCoveragePercent < 60) {
    if (status !== "critical") status = "warning";
    warnings.push(`Price coverage below target: ${priceCoveragePercent}%`);
  }
  if (imageCoveragePercent < 50) {
    if (status !== "critical") status = "warning";
    warnings.push(`Image coverage low: ${imageCoveragePercent}%`);
  }
  if (newsFreshnessPercent < 30) {
    if (status !== "critical") status = "warning";
    warnings.push(`Most news is stale: ${newsFreshnessPercent}% fresh`);
  }
  if (duplicateCount > 10) {
    if (status !== "critical") status = "warning";
    warnings.push(`${duplicateCount} duplicate product entries`);
  }

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    summary: {
      productCount: prods.length,
      brandCount: brandItems.length,
      newsCount: newsItems.length,
    },
    metrics: {
      priceCoveragePercent,
      imageCoveragePercent,
      newsFreshnessPercent,
      brandLogoPercent,
      duplicateProductNames: duplicateCount,
      freshNewsCount: freshNews.length,
      staleNewsCount: newsItems.length - freshNews.length,
      productsWithPrice: withPrice.length,
      productsWithImage: withImage.length,
    },
    warnings,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
