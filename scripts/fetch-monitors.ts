// Script to fetch/update monitor data
// For now, reads from monitors.json and validates data integrity
// Future: integrate with Amazon PA-API or other sources
import monitors from '../src/data/monitors.json';
import type { Product } from '../src/lib/data';

const REQUIRED_FIELDS: (keyof Product)[] = [
  'id', 'brand', 'name', 'category', 'image', 'fallbackImg',
  'releaseDate', 'basePrice', 'popularity', 'rating', 'reviewCount',
  'review', 'quickSpecs', 'prices', 'pros', 'cons',
];

console.log(`Validating ${monitors.length} monitors...`);

let errors = 0;
for (const m of monitors as Product[]) {
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (m[field] === undefined || m[field] === null) {
      console.error(`  ✗ ${m.id}: missing field "${field}"`);
      errors++;
    }
  }
  // Check category
  if (m.category !== 'monitor') {
    console.error(`  ✗ ${m.id}: category should be "monitor", got "${m.category}"`);
    errors++;
  }
  // Check price range
  if (m.basePrice < 100 || m.basePrice > 3000) {
    console.warn(`  ⚠ ${m.id}: basePrice ${m.basePrice} outside expected range ($100-$3000)`);
  }
  // Check rating range
  if (m.rating < 1 || m.rating > 5) {
    console.error(`  ✗ ${m.id}: rating ${m.rating} outside valid range (1-5)`);
    errors++;
  }
}

if (errors === 0) {
  console.log(`✓ All ${monitors.length} monitors passed validation.`);
} else {
  console.error(`✗ ${errors} error(s) found in monitor data.`);
  process.exit(1);
}

console.log('Monitor data validation complete.');
