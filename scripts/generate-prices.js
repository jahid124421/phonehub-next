const fs = require('fs');
const path = require('path');

// Seeded random for reproducibility (optional - comment out for true randomness)
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}
// Use Math.random() for true randomness, or seededRandom for reproducible results
const rand = seededRandom;

// --- Category base price ranges ---
const CATEGORY_RANGES = {
  phone:      { min: 49,    max: 1599  },
  laptop:     { min: 299,   max: 3499  },
  tablet:     { min: 99,    max: 1299  },
  smartwatch: { min: 49,    max: 799   },
  camera:     { min: 99,    max: 4999  },
  tv:         { min: 199,   max: 4999  },
  auto:       { min: 15000, max: 350000 },
};

// --- Brand tier multipliers ---
const PREMIUM_BRANDS = new Set([
  'apple', 'samsung', 'google', 'sony', 'microsoft', 'lg', 'dell', 'hp',
  'lenovo',  // ThinkPad line covered by keyword
  'bmw', 'mercedes-benz', 'mercedes', 'ferrari', 'porsche', 'lamborghini',
  'rolls-royce', 'bugatti', 'bentley', 'aston-martin', 'mclaren', 'pagani',
  'koenigsegg', 'maserati', 'lexus', 'audi', 'tesla', 'cadillac', 'lincoln',
  'jaguar', 'land-rover', 'volvo', 'genesis', 'alfa-romeo',
]);

const BUDGET_BRANDS = new Set([
  'tecno', 'infinix', 'itel', 'lava', 'micromax', 'zte', 'tcl', 'alcatel',
  'gionee', 'coolpad', 'panasonic', 'sharp', 'blu', 'doogee', 'ulefone',
  'blackview', 'cubot', 'uhans', 'agm', 'ulefone',
]);

// Auto-specific premium/budget
const AUTO_PREMIUM = new Set([
  'ferrari', 'lamborghini', 'porsche', 'bugatti', 'rolls-royce', 'bentley',
  'mclaren', 'pagani', 'koenigsegg', 'maserati', 'aston-martin',
  'mercedes-benz', 'mercedes', 'bmw', 'audi', 'lexus', 'tesla',
  'jaguar', 'land-rover', 'genesis', 'cadillac', 'lincoln', 'volvo',
]);

const AUTO_BUDGET = new Set([
  'lada', 'avtovaz', 'dacia', 'proton', 'reliant', 'tata', 'mahindra',
  'suzuki', 'daihatsu', 'lada', 'wanderer', 'tatra', 'skoda',
]);

function getBrandTierMultiplier(brand, category) {
  const b = brand.toLowerCase();
  if (category === 'auto') {
    if (AUTO_PREMIUM.has(b)) return 1.5 + rand() * 0.5;   // 1.5x–2.0x
    if (AUTO_BUDGET.has(b))  return 0.4 + rand() * 0.3;   // 0.4x–0.7x
    return 0.8 + rand() * 0.4; // 0.8x–1.2x mid-range
  }
  if (PREMIUM_BRANDS.has(b))  return 1.5 + rand() * 0.5;
  if (BUDGET_BRANDS.has(b))   return 0.4 + rand() * 0.3;
  return 0.8 + rand() * 0.4; // mid-range default
}

// Returns a position (0-1) within the range based on brand tier
function getBrandPosition(brand, category) {
  const b = brand.toLowerCase();
  if (category === 'auto') {
    if (AUTO_PREMIUM.has(b)) return 0.65 + rand() * 0.35;  // top 35% of range
    if (AUTO_BUDGET.has(b))  return rand() * 0.3;            // bottom 30%
    return 0.2 + rand() * 0.5;                               // 20-70%
  }
  if (PREMIUM_BRANDS.has(b))  return 0.6 + rand() * 0.4;   // top 40%
  if (BUDGET_BRANDS.has(b))   return rand() * 0.35;         // bottom 35%
  return 0.25 + rand() * 0.5;                                // 25-75%
}

// --- Keyword modifiers ---
function getKeywordMultiplier(name) {
  const n = name.toLowerCase();
  let mult = 1.0;

  // Flagship detection: latest numbered series
  // Match patterns like "15", "14", "S24", "S25", etc. in product names
  const flagshipMatch = n.match(/(?:^|\s|-)(s?\s*(2[0-9]|1[4-9]))(?:\s|$|[-+])/i)
    || n.match(/(?:iphone|galaxy|pixel|mate|nova)\s*(1[4-9]|[2-9][0-9])/i);
  if (flagshipMatch) {
    mult *= 1.2; // +20%
  }

  // Premium keywords
  if (/\b(pro\s*max|pro\+|ultra)\b/i.test(n)) {
    mult *= 1.3 + rand() * 0.3; // +30-60%
  } else if (/\bpro\b/i.test(n)) {
    mult *= 1.3; // +30%
  }

  if (/\b(plus|max|xl)\b/i.test(n) && !/\bpro\s*max\b/i.test(n)) {
    mult *= 1.15 + rand() * 0.1; // +15-25%
  }

  // Budget keywords
  if (/\b(lite|mini|go|core)\b/i.test(n)) {
    mult *= 0.7 + rand() * 0.1; // -20-30%
  }

  // A-series (budget phones like Samsung A series)
  if (/\ba\s*\d{2}/i.test(n) || /\ba-series/i.test(n)) {
    mult *= 0.75; // -25%
  }

  // 5G
  if (/\b5g\b/i.test(n)) {
    mult *= 1.1; // +10%
  }

  return mult;
}

// --- Random variation ---
function applyVariation(price) {
  const variation = 0.9 + rand() * 0.2; // ±10%
  return Math.round(price * variation);
}

// --- Round to nice price ---
function nicePrice(price) {
  if (price >= 1000)  return Math.round(price / 10) * 10 - 1;   // e.g. 1299, 1499
  if (price >= 100)   return Math.round(price / 5) * 5 - 0.01;  // e.g. 299.99 → round to 300
  return Math.round(price);
}

// --- Main ---
function main() {
  const filePath = path.resolve(__dirname, '../src/data/products.json');
  console.log(`Reading ${filePath}...`);
  const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Found ${products.length} products`);

  let updated = 0;
  const categoryStats = {};

  for (const product of products) {
    const cat = product.category || 'phone';
    const range = CATEGORY_RANGES[cat] || CATEGORY_RANGES.phone;

    // 1. Position within category range based on brand tier
    const position = getBrandPosition(product.brand, cat);
    const rangeSpan = range.max - range.min;
    let price = range.min + (rangeSpan * position);

    // 4. Apply keyword multiplier from product name
    const keywordMult = getKeywordMultiplier(product.name);
    price *= keywordMult;

    // 5. Clamp again (keywords can push beyond range)
    // Allow 10% over max for ultra-premium keyword combos
    price = Math.max(range.min, Math.min(range.max * 1.1, price));

    // 6. Random variation
    price = applyVariation(price);

    // 7. Round to nice price
    product.basePrice = Math.max(1, nicePrice(price));

    updated++;

    // Track stats
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, min: Infinity, max: 0, total: 0 };
    }
    categoryStats[cat].count++;
    categoryStats[cat].min = Math.min(categoryStats[cat].min, product.basePrice);
    categoryStats[cat].max = Math.max(categoryStats[cat].max, product.basePrice);
    categoryStats[cat].total += product.basePrice;
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
  console.log(`\n✅ Updated ${updated} products with realistic prices!\n`);

  // Print stats
  console.log('Price statistics by category:');
  console.log('─'.repeat(60));
  for (const [cat, stats] of Object.entries(categoryStats)) {
    const avg = Math.round(stats.total / stats.count);
    console.log(`  ${cat.padEnd(12)} │ count: ${String(stats.count).padStart(5)} │ min: $${String(stats.min).padStart(8)} │ max: $${String(stats.max).padStart(8)} │ avg: $${String(avg).padStart(8)}`);
  }
  console.log('─'.repeat(60));

  // Print samples
  console.log('\nSample prices:');
  const sampleCats = ['phone', 'laptop', 'tablet', 'smartwatch', 'camera', 'tv', 'auto'];
  for (const cat of sampleCats) {
    const items = products.filter(p => p.category === cat).slice(0, 5);
    if (items.length) {
      console.log(`\n  [${cat}]`);
      items.forEach(p => console.log(`    ${p.name.padEnd(40)} $${p.basePrice.toLocaleString()}`));
    }
  }
}

main();
