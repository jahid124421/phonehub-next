#!/usr/bin/env tsx
/**
 * fetch-brand-logos.ts — Enriches brands.json with verified logo URLs.
 * Uses SimpleIcons CDN as primary source, Brandfetch as fallback.
 * Verifies each logo URL is reachable before writing.
 *
 * Usage: npm run fetch:logos
 */

import * as fs from "fs";
import * as path from "path";

const BRANDS_PATH = path.resolve(__dirname, "../src/data/brands.json");
const CONCURRENCY = 8; // max parallel HEAD requests
const TIMEOUT_MS  = 8000;

interface Brand {
  id: string;
  name: string;
  logo: string;
  color: string;
  category: string;
  sub_categories?: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// URL helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Convert a brand name/id into a SimpleIcons slug. */
function simpleIconsSlug(brand: Brand): string {
  // SimpleIcons uses lowercase, no spaces, no special chars
  const raw = brand.id
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || brand.name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function simpleIconsUrl(brand: Brand): string {
  return `https://cdn.simpleicons.org/${simpleIconsSlug(brand)}`;
}

/** Map of brand id → canonical domain for Brandfetch. */
const DOMAIN_OVERRIDES: Record<string, string> = {
  "apple":         "apple.com",
  "samsung":       "samsung.com",
  "google":        "google.com",
  "xiaomi":        "xiaomi.com",
  "oneplus":       "oneplus.com",
  "nothing":       "nothing.tech",
  "vivo":          "vivo.com",
  "realme":        "realme.com",
  "oppo":          "oppo.com",
  "motorola":      "motorola.com",
  "sony":          "sony.com",
  "nokia":         "nokia.com",
  "honor":         "honor.com",
  "asus":          "asus.com",
  "huawei":        "huawei.com",
  "lenovo":        "lenovo.com",
  "acer":          "acer.com",
  "msi":           "msi.com",
  "dell":          "dell.com",
  "hp":            "hp.com",
  "toshiba":       "toshiba.com",
  "ibm":           "ibm.com",
  "pine64":        "pine64.org",
  "compaq":        "compaq.com",
  "medion":        "medion.com",
  "tp-link":       "tplink.com",
  "netgear":       "netgear.com",
  "linksys":       "linksys.com",
  "eero":          "eero.com",
  "d-link":        "dlink.com",
  "benq":          "benq.com",
  "viewsonic":     "viewsonic.com",
  "philips":       "philips.com",
  "tata":          "tata.com",
  "suzuki":        "suzuki.com",
  "jeep":          "jeep.com",
  "buick":         "buick.com",
  "alcatel":       "alcatel.com",
  "infiniti":      "infiniti.com",
  "mclaren":       "mclaren.com",
  "sharp-s":       "sharp.com",
};

function brandfetchUrl(brand: Brand): string | null {
  const domain = DOMAIN_OVERRIDES[brand.id] || `${brand.id}.com`;
  return `https://cdn.brandfetch.io/${domain}/w/400/h/400`;
}

// ──────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ──────────────────────────────────────────────────────────────────────────────

async function isReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    return res.ok || res.status === 301 || res.status === 302;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Concurrent pool runner
// ──────────────────────────────────────────────────────────────────────────────

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function processBrand(brand: Brand): Promise<{ brand: Brand; status: "ok" | "updated" | "failed"; newUrl?: string }> {
  // 1. If existing logo is already set, verify it
  if (brand.logo && brand.logo.trim() !== "") {
    const ok = await isReachable(brand.logo);
    if (ok) return { brand, status: "ok" };
    // Existing logo is broken — try to replace
  }

  // 2. Try SimpleIcons
  const siUrl = simpleIconsUrl(brand);
  if (await isReachable(siUrl)) {
    const updated = { ...brand, logo: siUrl };
    return { brand: updated, status: "updated", newUrl: siUrl };
  }

  // 3. Try Brandfetch
  const bfUrl = brandfetchUrl(brand);
  if (bfUrl && (await isReachable(bfUrl))) {
    const updated = { ...brand, logo: bfUrl };
    return { brand: updated, status: "updated", newUrl: bfUrl };
  }

  return { brand, status: "failed" };
}

async function main() {
  console.log("🖼️  PhoneHub Brand Logo Fetcher");
  console.log("");

  // Read brands.json
  let brands: Brand[];
  try {
    brands = JSON.parse(fs.readFileSync(BRANDS_PATH, "utf-8"));
  } catch (err) {
    console.error(`❌ Could not read ${BRANDS_PATH}:`, err);
    process.exit(1);
  }

  console.log(`📖 Loaded ${brands.length} brands`);
  console.log(`⏳ Verifying/enriching logos (concurrency: ${CONCURRENCY})...`);
  console.log("");

  const results = await runPool(brands, CONCURRENCY, processBrand);

  // Build updated brands array (preserving order)
  const updatedBrands: Brand[] = results.map((r) => r.brand);

  // Stats
  let okCount = 0, updatedCount = 0, failedCount = 0;
  const failedList: string[] = [];
  const updatedList: { name: string; url: string }[] = [];

  for (const r of results) {
    if (r.status === "ok")       okCount++;
    if (r.status === "updated") { updatedCount++; updatedList.push({ name: r.brand.name, url: r.newUrl! }); }
    if (r.status === "failed")  { failedCount++;  failedList.push(r.brand.name); }
  }

  // Write back
  fs.writeFileSync(BRANDS_PATH, JSON.stringify(updatedBrands, null, 2), "utf-8");

  console.log("");
  console.log("📊 Logo Health Report");
  console.log(`   ✅ Verified OK:   ${okCount}`);
  console.log(`   🔄 Updated:       ${updatedCount}`);
  console.log(`   ❌ Failed:        ${failedCount}`);
  console.log(`   Total:            ${brands.length}`);

  if (updatedList.length > 0) {
    console.log("");
    console.log("🔄 Newly updated logos:");
    updatedList.slice(0, 20).forEach(({ name, url }) => {
      console.log(`   ${name}: ${url}`);
    });
    if (updatedList.length > 20) console.log(`   ...and ${updatedList.length - 20} more`);
  }

  if (failedList.length > 0) {
    console.log("");
    console.log(`❌ Failed to find logo (${failedList.length}):`);
    failedList.slice(0, 20).forEach((n) => console.log(`   - ${n}`));
    if (failedList.length > 20) console.log(`   ...and ${failedList.length - 20} more`);
  }

  console.log("");
  console.log(`✅ Saved to ${BRANDS_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
