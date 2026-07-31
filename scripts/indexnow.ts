#!/usr/bin/env tsx
/**
 * PhoneHub — IndexNow auto-submit (SEO automation)
 *
 * Pings IndexNow (Bing, Yandex, Seznam) with all site URLs so new/updated
 * pages get discovered fast. Reads URLs from sitemap.xml (generated during
 * build) or falls back to generating them from the product data.
 *
 * Usage:  npm run indexnow
 */

import * as fs from "fs";
import * as path from "path";

const INDEXNOW_KEY = "8f4c2a1e9b7d6350f1a2c3b4d5e6f708";
const INDEXNOW_API = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_BATCH = 10_000;

// Resolve site URL from env or config
function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  if (envUrl && !envUrl.includes("your-domain")) return envUrl.replace(/\/$/, "");

  // Fallback: try reading from .env file
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/NEXT_PUBLIC_SITE_URL\s*=\s*(.+)/);
    if (match) {
      const url = match[1].trim().replace(/['"]/g, "");
      if (url && !url.includes("your-domain")) return url.replace(/\/$/, "");
    }
  }

  return "";
}

// Read URLs from sitemap.xml
function readSitemapUrls(siteUrl: string): string[] {
  const sitemapPath = path.resolve(__dirname, "../public/sitemap.xml");
  if (!fs.existsSync(sitemapPath)) return [];

  const content = fs.readFileSync(sitemapPath, "utf-8");
  const matches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map((m) => m.replace(/<\/?loc>/g, ""));
}

// Generate URLs from product data as fallback
function generateUrlsFromData(siteUrl: string): string[] {
  const urls: string[] = [siteUrl]; // homepage

  // Static pages
  const staticPages = [
    "/brands", "/compare", "/news", "/search", "/about",
    "/contact", "/benchmarks", "/tools",
  ];
  urls.push(...staticPages.map((p) => `${siteUrl}${p}`));

  // Product pages
  try {
    const productsPath = path.resolve(__dirname, "../src/data/products.json");
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
      for (const p of products) {
        if (p.id) urls.push(`${siteUrl}/phone/${p.id}`);
      }
    }
  } catch {
    // ignore — products might not exist
  }

  // Monitor pages
  try {
    const monitorsPath = path.resolve(__dirname, "../src/data/monitors.json");
    if (fs.existsSync(monitorsPath)) {
      const monitors = JSON.parse(fs.readFileSync(monitorsPath, "utf-8"));
      for (const m of monitors) {
        if (m.id) urls.push(`${siteUrl}/phone/${m.id}`);
      }
    }
  } catch {
    // ignore
  }

  // Router pages
  try {
    const routersPath = path.resolve(__dirname, "../src/data/routers.json");
    if (fs.existsSync(routersPath)) {
      const routers = JSON.parse(fs.readFileSync(routersPath, "utf-8"));
      for (const r of routers) {
        if (r.id) urls.push(`${siteUrl}/phone/${r.id}`);
      }
    }
  } catch {
    // ignore
  }

  return urls;
}

async function submitToIndexNow(
  host: string,
  siteUrl: string,
  urls: string[]
): Promise<void> {
  // Submit in batches of MAX_URLS_PER_BATCH
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_BATCH) {
    const batch = urls.slice(i, i + MAX_URLS_PER_BATCH);
    const batchLabel =
      urls.length > MAX_URLS_PER_BATCH
        ? `batch ${Math.floor(i / MAX_URLS_PER_BATCH) + 1}`
        : "all";

    const payload = {
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
      urlList: batch,
    };

    try {
      const response = await fetch(INDEXNOW_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "User-Agent": "PhoneHubBot/1.0",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 202) {
        console.log(
          `[indexnow] submitted ${batch.length} urls (${batchLabel}) -> HTTP ${response.status}`
        );
      } else {
        const text = await response.text().catch(() => "");
        console.log(
          `[indexnow] ${batch.length} urls (${batchLabel}) -> HTTP ${response.status} ${text.slice(0, 200)}`
        );
      }
    } catch (err: any) {
      console.log(`[indexnow] skipped (${batchLabel}): ${err.message}`);
    }
  }
}

async function main() {
  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    console.log("[indexnow] site_url not set; skipping");
    return;
  }

  const host = siteUrl.replace(/^https?:\/\//, "").split("/")[0];

  // Try sitemap first, fall back to generated URLs
  let urls = readSitemapUrls(siteUrl);
  if (urls.length === 0) {
    console.log("[indexnow] no sitemap found, generating URLs from data...");
    urls = generateUrlsFromData(siteUrl);
  }

  if (urls.length === 0) {
    console.log("[indexnow] no urls to submit; skipping");
    return;
  }

  console.log(`[indexnow] site=${siteUrl} host=${host} urls=${urls.length}`);
  await submitToIndexNow(host, siteUrl, urls);
}

main().catch((err) => {
  console.error("[indexnow] fatal:", err);
  process.exit(1);
});
