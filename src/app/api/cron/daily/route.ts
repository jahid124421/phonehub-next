import { NextResponse } from "next/server";
import products from "@/data/products.json";
import brands from "@/data/brands.json";
import news from "@/data/news.json";

/**
 * Daily cron handler — runs at 06:00 UTC via Vercel cron.
 * Checks data freshness, validates quality, and logs a health report.
 */

interface Issue {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  count?: number;
}

interface HealthReport {
  timestamp: string;
  status: "healthy" | "warning" | "critical";
  summary: {
    totalProducts: number;
    totalBrands: number;
    totalNews: number;
  };
  issues: Issue[];
  metrics: {
    priceCoveragePercent: number;
    imageCoveragePercent: number;
    staleNewsCount: number;
    brandsMissingLogos: number;
    duplicateProductNames: number;
    zeroPriceProducts: number;
  };
}

function checkProducts(): Issue[] {
  const issues: Issue[] = [];
  const prods = products as Array<{
    id: string;
    name: string;
    brand: string;
    image: string;
    basePrice: number;
    prices: Array<{ price: number | null }>;
  }>;

  // Zero or missing base prices
  const zeroPrice = prods.filter(
    (p) => !p.basePrice || p.basePrice === 0
  );
  if (zeroPrice.length > 0) {
    issues.push({
      type: "missing_prices",
      severity: zeroPrice.length > prods.length * 0.5 ? "warning" : "info",
      message: `${zeroPrice.length} products have zero/missing base price`,
      count: zeroPrice.length,
    });
  }

  // Missing images
  const noImage = prods.filter(
    (p) => !p.image || p.image.trim() === ""
  );
  if (noImage.length > 0) {
    issues.push({
      type: "missing_images",
      severity: noImage.length > 50 ? "warning" : "info",
      message: `${noImage.length} products have no image URL`,
      count: noImage.length,
    });
  }

  // Duplicate product names
  const nameCounts = new Map<string, number>();
  prods.forEach((p) => {
    const key = `${p.brand}:${p.name}`.toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  });
  const duplicates = [...nameCounts.entries()].filter(([, c]) => c > 1);
  if (duplicates.length > 0) {
    issues.push({
      type: "duplicate_products",
      severity: "warning",
      message: `${duplicates.length} duplicate product names found`,
      count: duplicates.length,
    });
  }

  return issues;
}

function checkNews(): Issue[] {
  const issues: Issue[] = [];
  const newsItems = news as Array<{ id: string; date: string; title: string }>;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stale = newsItems.filter((n) => {
    const d = new Date(n.date);
    return isNaN(d.getTime()) || d < thirtyDaysAgo;
  });

  if (stale.length > 0) {
    issues.push({
      type: "stale_news",
      severity: stale.length > newsItems.length * 0.5 ? "warning" : "info",
      message: `${stale.length} of ${newsItems.length} news articles are older than 30 days`,
      count: stale.length,
    });
  }

  if (newsItems.length === 0) {
    issues.push({
      type: "no_news",
      severity: "critical",
      message: "No news articles found in data",
    });
  }

  return issues;
}

function checkBrands(): Issue[] {
  const issues: Issue[] = [];
  const brandItems = brands as Array<{ id: string; name: string; logo: string }>;

  const noLogo = brandItems.filter(
    (b) => !b.logo || b.logo.trim() === ""
  );
  if (noLogo.length > 0) {
    issues.push({
      type: "brands_missing_logos",
      severity: "info",
      message: `${noLogo.length} brands have no logo URL`,
      count: noLogo.length,
    });
  }

  return issues;
}

function computeMetrics() {
  const prods = products as Array<{
    image: string;
    basePrice: number;
    prices: Array<{ price: number | null }>;
  }>;
  const brandItems = brands as Array<{ logo: string }>;
  const newsItems = news as Array<{ date: string }>;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const withPrice = prods.filter(
    (p) => p.basePrice > 0 || p.prices.some((pr) => pr.price !== null && pr.price > 0)
  );
  const withImage = prods.filter((p) => p.image && p.image.trim() !== "");
  const staleNews = newsItems.filter((n) => {
    const d = new Date(n.date);
    return isNaN(d.getTime()) || d < thirtyDaysAgo;
  });
  const noLogoBrands = brandItems.filter((b) => !b.logo || b.logo.trim() === "");

  const nameCounts = new Map<string, number>();
  (products as Array<{ brand: string; name: string }>).forEach((p) => {
    const key = `${p.brand}:${p.name}`.toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  });
  const dupes = [...nameCounts.values()].filter((c) => c > 1).length;

  const zeroPrice = prods.filter((p) => !p.basePrice || p.basePrice === 0).length;

  return {
    priceCoveragePercent: prods.length
      ? Math.round((withPrice.length / prods.length) * 100)
      : 0,
    imageCoveragePercent: prods.length
      ? Math.round((withImage.length / prods.length) * 100)
      : 0,
    staleNewsCount: staleNews.length,
    brandsMissingLogos: noLogoBrands.length,
    duplicateProductNames: dupes,
    zeroPriceProducts: zeroPrice,
  };
}

function deriveStatus(issues: Issue[]): "healthy" | "warning" | "critical" {
  if (issues.some((i) => i.severity === "critical")) return "critical";
  if (issues.filter((i) => i.severity === "warning").length >= 2) return "warning";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  return "healthy";
}

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets this header for cron invocations)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow without auth in development
    if (process.env.NODE_ENV === "production" && !authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const productIssues = checkProducts();
  const newsIssues = checkNews();
  const brandIssues = checkBrands();
  const allIssues = [...productIssues, ...newsIssues, ...brandIssues];
  const metrics = computeMetrics();

  const prods = products as unknown[];
  const brandItems = brands as unknown[];
  const newsItems = news as unknown[];

  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    status: deriveStatus(allIssues),
    summary: {
      totalProducts: prods.length,
      totalBrands: brandItems.length,
      totalNews: newsItems.length,
    },
    issues: allIssues,
    metrics,
  };

  // Log report to Vercel function logs
  console.log("[DailyCron] Health Report:", JSON.stringify(report, null, 2));

  // Log individual issues for easy scanning
  allIssues.forEach((issue) => {
    const prefix = issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "ℹ️";
    console.log(`[DailyCron] ${prefix} ${issue.type}: ${issue.message}`);
  });

  // Data refresh trigger logic
  if (report.status === "critical" || metrics.priceCoveragePercent < 20) {
    console.log("[DailyCron] ⚠️  Data quality below threshold — manual refresh recommended");
    console.log("[DailyCron] Run the GitHub Actions workflow to regenerate data");
  }

  return NextResponse.json(report);
}
