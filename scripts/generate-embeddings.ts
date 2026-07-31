/**
 * Batch embedding generation script for PhoneHub products.
 *
 * Reads all products from data JSON files, generates text representations,
 * calls the Hugging Face Inference API for embeddings, and writes the
 * results to src/data/embeddings-cache.json as a fallback cache.
 *
 * Usage:  npx tsx scripts/generate-embeddings.ts
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { generateEmbedding } from '../src/lib/embeddings';

// Resolve data paths relative to project root
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUTPUT_PATH = path.join(DATA_DIR, 'embeddings-cache.json');

interface ProductStub {
  id: string;
  brand: string;
  name: string;
  category: string;
  basePrice: number;
  rating: number;
  quickSpecs?: Record<string, string>;
}

function loadProducts(): ProductStub[] {
  const files = ['products.json', 'monitors.json', 'routers.json'];
  const all: ProductStub[] = [];
  for (const file of files) {
    const fp = path.join(DATA_DIR, file);
    if (fs.existsSync(fp)) {
      const data = JSON.parse(fs.readFileSync(fp, 'utf-8')) as ProductStub[];
      all.push(...data);
    }
  }
  return all;
}

function productToText(p: ProductStub): string {
  const specs = p.quickSpecs || {};
  const parts = [`${p.brand} ${p.name}`, p.category];
  if (specs.camera) parts.push(`camera: ${specs.camera}`);
  if (specs.battery) parts.push(`battery: ${specs.battery}`);
  if (specs.display) parts.push(`display: ${specs.display}`);
  if (specs.ram) parts.push(`ram: ${specs.ram}`);
  if (specs.storage) parts.push(`storage: ${specs.storage}`);
  if (p.basePrice > 0) parts.push(`price: $${p.basePrice}`);
  if (p.rating > 0) parts.push(`rating: ${p.rating}`);
  return parts.join(', ');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const products = loadProducts();
  console.log(`Loaded ${products.length} products`);

  // Load existing cache to avoid re-embedding
  let cache: Record<string, { text: string; embedding: number[] }> = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
      console.log(`Loaded existing cache with ${Object.keys(cache).length} entries`);
    } catch {
      cache = {};
    }
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    if (cache[product.id]) {
      skipped++;
      continue;
    }

    const text = productToText(product);
    const embedding = await generateEmbedding(text);

    if (embedding) {
      cache[product.id] = { text, embedding };
      processed++;
    } else {
      failed++;
    }

    // Rate-limit: 2 requests/sec → 500ms between requests
    await sleep(500);

    // Log progress every 20 products
    if ((processed + failed) % 20 === 0) {
      console.log(
        `Progress: ${processed} embedded, ${skipped} cached, ${failed} failed / ${products.length} total`
      );
    }
  }

  // Write cache to disk
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cache, null, 2), 'utf-8');

  console.log('\nDone!');
  console.log(`  Embedded: ${processed}`);
  console.log(`  Skipped (cached): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
