// Script to fetch/update router data
// For now, reads from routers.json and validates data integrity
// Future: integrate with Amazon PA-API or other sources
import routers from '../src/data/routers.json';
import type { Product } from '../src/lib/data';

const REQUIRED_FIELDS: (keyof Product)[] = [
  'id', 'brand', 'name', 'category', 'image', 'fallbackImg',
  'releaseDate', 'basePrice', 'popularity', 'rating', 'reviewCount',
  'review', 'quickSpecs', 'prices', 'pros', 'cons',
];

console.log(`Validating ${routers.length} routers...`);

let errors = 0;
for (const r of routers as Product[]) {
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (r[field] === undefined || r[field] === null) {
      console.error(`  ✗ ${r.id}: missing field "${field}"`);
      errors++;
    }
  }
  // Check category
  if (r.category !== 'router') {
    console.error(`  ✗ ${r.id}: category should be "router", got "${r.category}"`);
    errors++;
  }
  // Check price range
  if (r.basePrice < 20 || r.basePrice > 1000) {
    console.warn(`  ⚠ ${r.id}: basePrice ${r.basePrice} outside expected range ($20-$1000)`);
  }
  // Check rating range
  if (r.rating < 1 || r.rating > 5) {
    console.error(`  ✗ ${r.id}: rating ${r.rating} outside valid range (1-5)`);
    errors++;
  }
}

if (errors === 0) {
  console.log(`✓ All ${routers.length} routers passed validation.`);
} else {
  console.error(`✗ ${errors} error(s) found in router data.`);
  process.exit(1);
}

console.log('Router data validation complete.');
