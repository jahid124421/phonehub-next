/**
 * Pre-compute PhoneHub Scores for every product.
 * Run:  npx tsx scripts/compute-scores.ts
 * Outputs: src/data/scores.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { calculateScore, type PhoneHubScore } from '../src/lib/score-calculator';

const DATA_DIR = resolve(__dirname, '..', 'src', 'data');

// ─── Load data ──────────────────────────────────────────────────────────────────

const products  = JSON.parse(readFileSync(resolve(DATA_DIR, 'products.json'),  'utf8')) as any[];
const monitors  = JSON.parse(readFileSync(resolve(DATA_DIR, 'monitors.json'),  'utf8')) as any[];
const routers   = JSON.parse(readFileSync(resolve(DATA_DIR, 'routers.json'),   'utf8')) as any[];
const specsData = JSON.parse(readFileSync(resolve(DATA_DIR, 'specs.json'),     'utf8')) as Record<string, Record<string, Record<string, string>>>;
const benchmarks = JSON.parse(readFileSync(resolve(DATA_DIR, 'benchmarks.json'), 'utf8')) as Record<string, any>;

const allProducts = [...products, ...monitors, ...routers];

// ─── Compute category average prices ─────────────────────────────────────────────

const categoryPrices: Record<string, number[]> = {};
for (const p of allProducts) {
  const cat = p.category || 'other';
  if (!categoryPrices[cat]) categoryPrices[cat] = [];
  if (p.basePrice > 0) categoryPrices[cat].push(p.basePrice);
}
const categoryAvgPrice: Record<string, number> = {};
for (const [cat, prices] of Object.entries(categoryPrices)) {
  categoryAvgPrice[cat] = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 400;
}

console.log('Category average prices:', categoryAvgPrice);

// ─── Score every product ──────────────────────────────────────────────────────────

const scores: Record<string, PhoneHubScore> = {};
let computed = 0;
let skipped = 0;

for (const product of allProducts) {
  const id = product.id;
  if (!id) { skipped++; continue; }

  const productSpecs = specsData[id] || {};
  const benchmark = benchmarks[id] || null;
  const avgPrice = categoryAvgPrice[product.category || 'other'] ?? 400;

  const score = calculateScore(product, productSpecs, benchmark, avgPrice);
  scores[id] = score;
  computed++;
}

console.log(`\nComputed: ${computed}  Skipped: ${skipped}`);

// ─── Stats ────────────────────────────────────────────────────────────────────────

const allTotals = Object.values(scores).map(s => s.total).sort((a, b) => a - b);
const avg = Math.round(allTotals.reduce((a, b) => a + b, 0) / allTotals.length);
const min = allTotals[0];
const max = allTotals[allTotals.length - 1];
console.log(`Score stats  →  min: ${min}  avg: ${avg}  max: ${max}`);

// Show top 10
const top10 = Object.entries(scores)
  .sort(([, a], [, b]) => b.total - a.total)
  .slice(0, 10);
console.log('\nTop 10 products by PhoneHub Score:');
top10.forEach(([id, s], i) => {
  console.log(`  ${i + 1}. ${id}: ${s.total}`);
});

// ─── Write output ─────────────────────────────────────────────────────────────────

const outputPath = resolve(DATA_DIR, 'scores.json');
writeFileSync(outputPath, JSON.stringify(scores, null, 2), 'utf8');
console.log(`\nWrote scores to: ${outputPath}`);
