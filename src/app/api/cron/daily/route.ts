import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import Parser from "rss-parser";
import { isAuthorizedCronRequest } from "@/lib/security";
import { captureError } from "@/lib/monitoring";
import products from "@/data/products.json";
import brands from "@/data/brands.json";
import news from "@/data/news.json";
import monitors from "@/data/monitors.json";
import routers from "@/data/routers.json";
import benchmarks from "@/data/benchmarks.json";

/**
 * Daily cron handler — runs at 06:00 UTC via Vercel cron.
 * Fetches fresh RSS news, checks data freshness, validates quality,
 * and logs a health report.
 *
 * NOTE: Serverless cannot write files. For file-based news updates,
 * run `npm run data:refresh` via GitHub Actions or CI.
 * This endpoint returns fresh news in the response for edge caching.
 */

// ──────────────────────────────────────────────────────────────────────────────
// RSS Feed Fetching (inline for serverless)
// ──────────────────────────────────────────────────────────────────────────────

const RSS_SOURCES = [
  { name: "GSMArena",          url: "https://www.gsmarena.com/rss-news-reviews.php3" },
  { name: "Android Authority", url: "https://www.androidauthority.com/feed/" },
  { name: "XDA Developers",    url: "https://www.xda-developers.com/feed/" },
  { name: "TechRadar",         url: "https://www.techradar.com/rss" },
  { name: "The Verge",         url: "https://www.theverge.com/rss/index.xml" },
  { name: "CNET",              url: "https://www.cnet.com/rss/news/" },
  { name: "Tom's Hardware",    url: "https://www.tomshardware.com/feeds/all" },
  { name: "Ars Technica",      url: "https://feeds.arstechnica.com/arstechnica/index" },
  { name: "9to5Google",        url: "https://9to5google.com/feed/" },
  { name: "9to5Mac",           url: "https://9to5mac.com/feed/" },
];

const TECH_KW = /phone|laptop|tablet|monitor|router|smartphone|android|ios|samsung|apple|google|nvidia|intel|amd|qualcomm|camera|tv|tech|gadget|review|benchmark|launch|release|update|spec|price|deal|pixel|iphone|galaxy|macbook|gpu|cpu|snapdragon|ryzen|foldable|wearable|smartwatch|earbuds|speaker|ssd|wi-fi|wifi|bluetooth|5g|charging|battery/i;
const REJECT_KW = /politics|election|war|crime|sports|nba|nfl|movie|music|celebrity|weather|food|recipe|quordle|wordle|horoscope|zodiac|stock market|cryptocurrency crash/i;

interface FreshArticle {
  title: string;
  excerpt: string;
  date: string;
  url: string;
  source: string;
  tag: string;
}

function inferTagFromText(text: string): string {
  const t = text.toLowerCase();
  if (/phone|smartphone|iphone|galaxy|pixel|android|ios|mobile/.test(t)) return "mobiles";
  if (/laptop|notebook|macbook|thinkpad|chromebook/.test(t)) return "laptops";
  if (/monitor|display|oled/.test(t)) return "monitors";
  if (/router|wi-fi|wifi|mesh/.test(t)) return "routers";
  if (/tv|television|streaming/.test(t)) return "tvs";
  if (/car|ev |electric vehicle|tesla|automotive/.test(t)) return "auto";
  if (/headphone|earbuds|speaker|audio|gpu|cpu|gaming/.test(t)) return "electronics";
  return "tech";
}

async function fetchFreshNews(): Promise<FreshArticle[]> {
  const parser = new Parser({
    timeout: 12_000,
    headers: { "User-Agent": "PhoneHub-Cron/1.0", Accept: "application/rss+xml, application/xml, text/xml, */*" },
  });
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const allArticles: FreshArticle[] = [];

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const feed = await parser.parseURL(src.url);
      for (const item of feed.items) {
        if (!item.title) continue;
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        if (isNaN(pubDate.getTime()) || pubDate < cutoff) continue;
        const excerpt = (item.contentSnippet || item.title).replace(/<[^>]*>/g, "").slice(0, 200);
        const combined = `${item.title} ${excerpt}`;
        if (!TECH_KW.test(combined) || REJECT_KW.test(combined)) continue;
        allArticles.push({
          title: item.title,
          excerpt,
          date: pubDate.toISOString().split("T")[0],
          url: item.link || "",
          source: src.name.toLowerCase().replace(/\s+/g, ""),
          tag: inferTagFromText(combined),
        });
      }
    })
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) console.log(`[DailyCron] ⚠️  ${failed} RSS feeds failed to fetch`);

  // Sort newest first, cap at 100
  allArticles.sort((a, b) => b.date.localeCompare(a.date));
  return allArticles.slice(0, 100);
}

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
    totalMonitors: number;
    totalRouters: number;
  };
  issues: Issue[];
  metrics: {
    priceCoveragePercent: number;
    imageCoveragePercent: number;
    staleNewsCount: number;
    brandsMissingLogos: number;
    duplicateProductNames: number;
    zeroPriceProducts: number;
    monitorCount: number;
    routerCount: number;
    benchmarkCoveragePercent: number;
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

function checkMonitors(): Issue[] {
  const issues: Issue[] = [];
  const monitorItems = monitors as Array<{ id: string; name: string }>;

  if (monitorItems.length === 0) {
    issues.push({
      type: "no_monitors",
      severity: "warning",
      message: "No monitor data found",
    });
  } else {
    const missingName = monitorItems.filter((m) => !m.name || m.name.trim() === "");
    if (missingName.length > 0) {
      issues.push({
        type: "monitors_missing_names",
        severity: "info",
        message: `${missingName.length} monitors have missing names`,
        count: missingName.length,
      });
    }
  }

  return issues;
}

function checkRouters(): Issue[] {
  const issues: Issue[] = [];
  const routerItems = routers as Array<{ id: string; name: string }>;

  if (routerItems.length === 0) {
    issues.push({
      type: "no_routers",
      severity: "warning",
      message: "No router data found",
    });
  } else {
    const missingName = routerItems.filter((r) => !r.name || r.name.trim() === "");
    if (missingName.length > 0) {
      issues.push({
        type: "routers_missing_names",
        severity: "info",
        message: `${missingName.length} routers have missing names`,
        count: missingName.length,
      });
    }
  }

  return issues;
}

function checkBenchmarks(): Issue[] {
  const issues: Issue[] = [];
  const benchmarkData = benchmarks as Record<string, unknown>;
  const productIds = new Set((products as Array<{ id: string }>).map((p) => p.id));

  const benchmarkCount = Object.keys(benchmarkData).length;
  const productCount = productIds.size;

  if (benchmarkCount === 0) {
    issues.push({
      type: "no_benchmarks",
      severity: "warning",
      message: "No benchmark data found",
    });
  } else {
    const coveragePercent = productCount
      ? Math.round((benchmarkCount / productCount) * 100)
      : 0;
    if (coveragePercent < 10) {
      issues.push({
        type: "low_benchmark_coverage",
        severity: "info",
        message: `Benchmark coverage is only ${coveragePercent}% (${benchmarkCount}/${productCount} products)`,
        count: benchmarkCount,
      });
    }
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

  // Monitor and router counts
  const monitorItems = monitors as unknown[];
  const routerItems = routers as unknown[];

  // Benchmark coverage
  const benchmarkData = benchmarks as Record<string, unknown>;
  const benchmarkCount = Object.keys(benchmarkData).length;
  const benchmarkCoveragePercent = prods.length
    ? Math.round((benchmarkCount / prods.length) * 100)
    : 0;

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
    monitorCount: monitorItems.length,
    routerCount: routerItems.length,
    benchmarkCoveragePercent,
  };
}

function deriveStatus(issues: Issue[]): "healthy" | "warning" | "critical" {
  if (issues.some((i) => i.severity === "critical")) return "critical";
  if (issues.filter((i) => i.severity === "warning").length >= 2) return "warning";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  return "healthy";
}

export async function GET(request: Request) {
  // Verify cron secret with a timing-safe comparison (Vercel sets the
  // Authorization header for cron invocations). Fails closed in production.
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 1. Fetch fresh news from RSS feeds (runs in parallel with data checks)
  let freshNews: FreshArticle[] = [];
  try {
    freshNews = await fetchFreshNews();
    console.log(`[DailyCron] ✅ Fetched ${freshNews.length} fresh articles from RSS feeds`);
  } catch (err) {
    await captureError(err, { route: "/api/cron/daily", operation: "rss-fetch" });
  }

  // 2. Data quality checks
  const productIssues = checkProducts();
  const newsIssues = checkNews();
  const brandIssues = checkBrands();
  const monitorIssues = checkMonitors();
  const routerIssues = checkRouters();
  const benchmarkIssues = checkBenchmarks();
  const allIssues = [...productIssues, ...newsIssues, ...brandIssues, ...monitorIssues, ...routerIssues, ...benchmarkIssues];
  const metrics = computeMetrics();

  // Add fresh news info to issues if news is stale
  if (metrics.staleNewsCount > 10 && freshNews.length > 0) {
    allIssues.push({
      type: "fresh_news_available",
      severity: "info",
      message: `${freshNews.length} fresh articles fetched — run 'npm run data:refresh' to update news.json`,
      count: freshNews.length,
    });
  }

  const prods = products as unknown[];
  const brandItems = brands as unknown[];
  const newsItems = news as unknown[];
  const monitorItems = monitors as unknown[];
  const routerItems = routers as unknown[];

  const report: HealthReport & { freshNews?: FreshArticle[] } = {
    timestamp: new Date().toISOString(),
    status: deriveStatus(allIssues),
    summary: {
      totalProducts: prods.length,
      totalBrands: brandItems.length,
      totalNews: newsItems.length,
      totalMonitors: monitorItems.length,
      totalRouters: routerItems.length,
    },
    issues: allIssues,
    metrics,
    // Include fresh news in response for downstream consumers
    freshNews: freshNews.length > 0 ? freshNews.slice(0, 20) : undefined,
  };

  // Log report to Vercel function logs
  console.log("[DailyCron] Health Report:", JSON.stringify({ ...report, freshNews: undefined }, null, 2));

  // Log individual issues for easy scanning
  allIssues.forEach((issue) => {
    const prefix = issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "ℹ️";
    console.log(`[DailyCron] ${prefix} ${issue.type}: ${issue.message}`);
  });

  // Data refresh trigger logic
  if (report.status === "critical" || metrics.priceCoveragePercent < 20) {
    console.log("[DailyCron] ⚠️  Data quality below threshold — manual refresh recommended");
    console.log("[DailyCron] Run 'npm run data:refresh' locally or trigger GitHub Actions workflow");
  }

  // Revalidate pages after data checks to ensure fresh content
  try {
    revalidatePath('/');
    console.log("[DailyCron] ✅ Revalidated homepage");
    revalidatePath('/news');
    console.log("[DailyCron] ✅ Revalidated news page");
    revalidatePath('/brands');
    console.log("[DailyCron] ✅ Revalidated brands page");
    revalidateTag('products', 'max');
    console.log("[DailyCron] ✅ Revalidated products tag");
  } catch (err) {
    await captureError(err, { route: "/api/cron/daily", operation: "revalidate" });
  }

  return NextResponse.json(report);
}


