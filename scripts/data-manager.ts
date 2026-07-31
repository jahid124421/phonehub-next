#!/usr/bin/env tsx
/**
 * data-manager.ts — Master data orchestrator for PhoneHub.
 *
 * Runs:
 *   1. fetch-news.ts     (refresh news)
 *   2. fetch-brand-logos.ts (verify/update logos)
 *   3. Schema validation  (products, monitors, routers, benchmarks)
 *   4. Data health report
 *
 * Usage: npm run data:refresh
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ──────────────────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve(__dirname, "../src/data");
const SCRIPTS_DIR = __dirname;

interface DataFile {
  name: string;
  path: string;
  required: boolean;
  isArray?: boolean;
  minItems?: number;
  requiredFields?: string[];
}

const DATA_FILES: DataFile[] = [
  {
    name: "products.json",
    path: path.join(DATA_DIR, "products.json"),
    required: true,
    isArray: true,
    minItems: 10,
    requiredFields: ["id", "brand", "name", "category", "image", "basePrice"],
  },
  {
    name: "news.json",
    path: path.join(DATA_DIR, "news.json"),
    required: true,
    isArray: true,
    minItems: 1,
    requiredFields: ["id", "title", "date", "url", "source"],
  },
  {
    name: "brands.json",
    path: path.join(DATA_DIR, "brands.json"),
    required: true,
    isArray: true,
    minItems: 5,
    requiredFields: ["id", "name", "logo", "category"],
  },
  {
    name: "monitors.json",
    path: path.join(DATA_DIR, "monitors.json"),
    required: false,
    isArray: true,
    minItems: 0,
    requiredFields: ["id", "brand", "name", "category", "basePrice"],
  },
  {
    name: "routers.json",
    path: path.join(DATA_DIR, "routers.json"),
    required: false,
    isArray: true,
    minItems: 0,
    requiredFields: ["id", "brand", "name", "category", "basePrice"],
  },
  {
    name: "benchmarks.json",
    path: path.join(DATA_DIR, "benchmarks.json"),
    required: false,
    isArray: false,
  },
  {
    name: "specs.json",
    path: path.join(DATA_DIR, "specs.json"),
    required: false,
    isArray: false,
  },
  {
    name: "stores.json",
    path: path.join(DATA_DIR, "stores.json"),
    required: false,
    isArray: true,
    minItems: 0,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function runScript(name: string, scriptPath: string): { ok: boolean; duration: number; output: string } {
  const start = Date.now();
  console.log(`\n⏳ Running ${name}...`);
  try {
    const output = execSync(`npx tsx "${scriptPath}"`, {
      cwd: path.resolve(SCRIPTS_DIR, ".."),
      encoding: "utf-8",
      timeout: 180_000,
      stdio: "pipe",
    });
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ ${name} completed in ${duration}s`);
    return { ok: true, duration: Number(duration), output };
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ ${name} failed after ${duration}s: ${msg.split("\n")[0]}`);
    return { ok: false, duration: Number(duration), output: msg };
  }
}

interface Issue {
  file: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

function validateFile(df: DataFile): { data: unknown; issues: Issue[] } {
  const issues: Issue[] = [];

  if (!fs.existsSync(df.path)) {
    if (df.required) {
      issues.push({ file: df.name, severity: "critical", message: "File not found (required)" });
    } else {
      issues.push({ file: df.name, severity: "info", message: "File not found (optional)" });
    }
    return { data: null, issues };
  }

  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(df.path, "utf-8"));
  } catch (err) {
    issues.push({ file: df.name, severity: "critical", message: `JSON parse error: ${String(err).split("\n")[0]}` });
    return { data: null, issues };
  }

  if (df.isArray && !Array.isArray(data)) {
    issues.push({ file: df.name, severity: "critical", message: "Expected array but got object" });
    return { data, issues };
  }

  if (df.isArray && Array.isArray(data)) {
    if (df.minItems !== undefined && data.length < df.minItems) {
      issues.push({
        file: df.name,
        severity: "warning",
        message: `Only ${data.length} items (minimum recommended: ${df.minItems})`,
      });
    }

    if (df.requiredFields && data.length > 0) {
      const first = data[0] as Record<string, unknown>;
      const missing = df.requiredFields.filter((f) => !(f in first));
      if (missing.length > 0) {
        issues.push({
          file: df.name,
          severity: "warning",
          message: `First item missing fields: ${missing.join(", ")}`,
        });
      }
      // Spot check: sample 10 random items
      const sample = data.length <= 10 ? data : Array.from({ length: 10 }, () =>
        data[Math.floor(Math.random() * data.length)]
      );
      let badCount = 0;
      for (const item of sample) {
        const rec = item as Record<string, unknown>;
        if (df.requiredFields!.some((f) => rec[f] === undefined || rec[f] === null || rec[f] === "")) {
          badCount++;
        }
      }
      if (badCount > 0) {
        issues.push({
          file: df.name,
          severity: "warning",
          message: `${badCount}/10 sampled items have missing required fields`,
        });
      }
    }
  }

  return { data, issues };
}

function checkNewsStaleness(data: unknown): Issue[] {
  if (!Array.isArray(data)) return [];
  const items = data as Array<{ date: string }>;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const stale = items.filter((n) => {
    const d = new Date(n.date);
    return isNaN(d.getTime()) || d < sevenDaysAgo;
  });
  if (stale.length > items.length * 0.5) {
    return [{
      file: "news.json",
      severity: "warning",
      message: `${stale.length}/${items.length} articles are older than 7 days`,
    }];
  }
  return [];
}

function checkBenchmarkCoverage(products: unknown, benchmarks: unknown): Issue[] {
  if (!Array.isArray(products) || typeof benchmarks !== "object" || benchmarks === null) return [];
  const benchKeys = new Set(Object.keys(benchmarks as Record<string, unknown>));
  const prodIds = (products as Array<{ id: string }>).map((p) => p.id);
  const covered = prodIds.filter((id) => benchKeys.has(id)).length;
  const pct = prodIds.length > 0 ? Math.round((covered / prodIds.length) * 100) : 0;
  if (pct < 20) {
    return [{
      file: "benchmarks.json",
      severity: "info",
      message: `Benchmark coverage is ${pct}% (${covered}/${prodIds.length} products)`,
    }];
  }
  return [];
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  📊 PhoneHub Data Manager — Daily Refresh");
  console.log(`  ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════════════════");

  // Step 1: Fetch news
  const newsResult = runScript("fetch-news", path.join(SCRIPTS_DIR, "fetch-news.ts"));

  // Step 2: Fetch brand logos
  const logoResult = runScript("fetch-brand-logos", path.join(SCRIPTS_DIR, "fetch-brand-logos.ts"));

  // Step 3: Validate all data files
  console.log("\n📋 Validating data files...\n");
  const allIssues: Issue[] = [];
  let productsData: unknown = null;
  let benchmarksData: unknown = null;

  for (const df of DATA_FILES) {
    const { data, issues } = validateFile(df);
    allIssues.push(...issues);
    if (df.name === "products.json") productsData = data;
    if (df.name === "benchmarks.json") benchmarksData = data;
    issues.forEach((i) => {
      const icon = i.severity === "critical" ? "🔴" : i.severity === "warning" ? "🟡" : "ℹ️ ";
      console.log(`  ${icon} [${i.file}] ${i.message}`);
    });
  }

  // News staleness check
  try {
    const newsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "news.json"), "utf-8"));
    allIssues.push(...checkNewsStaleness(newsData));
  } catch {}

  // Benchmark coverage
  allIssues.push(...checkBenchmarkCoverage(productsData, benchmarksData));

  // Step 4: Health report
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  const criticalCount = allIssues.filter((i) => i.severity === "critical").length;
  const warningCount  = allIssues.filter((i) => i.severity === "warning").length;
  const status = criticalCount > 0 ? "🔴 CRITICAL" : warningCount > 0 ? "🟡 WARNING" : "🟢 HEALTHY";

  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  📊 DATA HEALTH REPORT");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Status:        ${status}`);
  console.log(`  Duration:      ${totalDuration}s`);
  console.log(`  News fetch:    ${newsResult.ok ? "✅ OK" : "❌ FAILED"} (${newsResult.duration}s)`);
  console.log(`  Logo verify:   ${logoResult.ok ? "✅ OK" : "❌ FAILED"} (${logoResult.duration}s)`);
  console.log(`  Critical:      ${criticalCount}`);
  console.log(`  Warnings:      ${warningCount}`);
  console.log(`  Total issues:  ${allIssues.length}`);

  // File sizes
  console.log("");
  console.log("  Data file sizes:");
  for (const df of DATA_FILES) {
    if (fs.existsSync(df.path)) {
      const stat = fs.statSync(df.path);
      const kb = (stat.size / 1024).toFixed(1);
      console.log(`    ${df.name.padEnd(20)} ${kb} KB`);
    } else {
      console.log(`    ${df.name.padEnd(20)} (missing)`);
    }
  }

  console.log("");
  console.log("═══════════════════════════════════════════════════════════");

  if (criticalCount > 0) {
    console.log("\n⚠️  Critical issues detected — please investigate!");
    allIssues
      .filter((i) => i.severity === "critical")
      .forEach((i) => console.log(`  🔴 [${i.file}] ${i.message}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
