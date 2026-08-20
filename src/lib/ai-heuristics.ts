import { getAllProducts, type Product } from '@/lib/data';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FinderFilters {
  maxPrice?: number;
  minRating?: number;
  category?: string;
  features?: string[]; // e.g. ['camera', 'battery', 'performance']
}

export interface ScoredProduct extends Product {
  relevanceScore: number;
  matchReasons: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  phone: ['phone', 'smartphone', 'mobile', 'cellphone', 'cell phone', 'handset'],
  laptop: ['laptop', 'notebook', 'ultrabook', 'macbook', 'chromebook'],
  tablet: ['tablet', 'ipad', 'tab'],
  smartwatch: ['watch', 'smartwatch', 'wearable', 'fitness tracker'],
  tv: ['tv', 'television', 'smart tv', 'oled', 'qled'],
  camera: ['camera', 'dslr', 'mirrorless', 'cam'],
  monitor: ['monitor', 'display', 'screen'],
  router: ['router', 'wifi', 'mesh', 'access point'],
  auto: ['car', 'auto', 'vehicle', 'suv', 'sedan', 'truck', 'bike', 'scooter'],
};

const FEATURE_KEYWORDS: Record<string, { keys: string[]; specKeys: string[]; reason: string }> = {
  camera: {
    keys: ['camera', 'photo', 'photography', 'mp', 'megapixel', 'zoom', 'lens', 'video', '4k video', 'selfie'],
    specKeys: ['camera', 'mainCamera', 'selfieCamera'],
    reason: 'Strong camera specs',
  },
  battery: {
    keys: ['battery', 'battery life', 'mah', 'charging', 'fast charge', 'wireless charge', 'all day'],
    specKeys: ['battery'],
    reason: 'Large battery capacity',
  },
  performance: {
    keys: ['gaming', 'performance', 'speed', 'ram', 'processor', 'chipset', 'cpu', 'gpu', 'antutu', 'benchmark'],
    specKeys: ['ram', 'chipset', 'processor'],
    reason: 'High performance hardware',
  },
  display: {
    keys: ['display', 'screen', 'amoled', 'oled', 'lcd', 'refresh rate', 'hz', 'resolution', 'brightness', 'hdr'],
    specKeys: ['display', 'screen'],
    reason: 'Premium display quality',
  },
  design: {
    keys: ['design', 'build', 'premium', 'glass', 'metal', 'aluminum', 'titanium', 'thin', 'light', 'lightweight', 'ip68', 'waterproof'],
    specKeys: ['body', 'dimensions', 'weight'],
    reason: 'Premium build quality',
  },
  value: {
    keys: ['value', 'budget', 'cheap', 'affordable', 'bang for buck', 'price', 'cost'],
    specKeys: [],
    reason: 'Great value for money',
  },
  storage: {
    keys: ['storage', 'gb', 'tb', '128gb', '256gb', '512gb', '1tb', 'memory'],
    specKeys: ['storage', 'memory'],
    reason: 'Ample storage space',
  },
};

function normalizeCategory(cat: string): string {
  const lower = cat.toLowerCase();
  for (const [canonical, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (synonyms.includes(lower) || lower === canonical) return canonical;
  }
  return lower;
}

function extractPriceRange(query: string): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {};

  // "$200 to $500", "$200-$500", "$200 and $500"
  const rangeMatch = query.match(/\$?(\d{2,6})\s*(?:to|and|-)\s*\$?(\d{2,6})/i);
  if (rangeMatch) {
    result.min = parseInt(rangeMatch[1]);
    result.max = parseInt(rangeMatch[2]);
    return result;
  }

  // "under $500", "below $500", "less than $500"
  const underMatch = query.match(/(?:under|below|less than|up to|around)\s*\$?(\d{2,6})/i);
  if (underMatch) {
    result.max = parseInt(underMatch[1]);
    return result;
  }

  // "above $500", "over $500", "more than $500"
  const aboveMatch = query.match(/(?:above|over|more than|at least)\s*\$?(\d{2,6})/i);
  if (aboveMatch) {
    result.min = parseInt(aboveMatch[1]);
    return result;
  }

  // "budget $500", "budget of $500"
  const budgetMatch = query.match(/budget\s*(?:of\s*)?\$?(\d{2,6})/i);
  if (budgetMatch) {
    result.max = parseInt(budgetMatch[1]);
    return result;
  }

  return result;
}

export function smartSearch(query: string, filters?: FinderFilters): ScoredProduct[] {
  const products = getAllProducts();
  const queryLower = query.toLowerCase().trim();

  if (!queryLower && !filters) return [];

  // Tokenize: split on spaces, keep meaningful terms
  const terms = queryLower
    .split(/[\s,]+/)
    .map((t) => t.replace(/[^a-z0-9$]/g, ''))
    .filter((t) => t.length > 1);

  // Detect category from query
  let detectedCategory: string | null = null;
  for (const [canonical, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const syn of synonyms) {
      if (queryLower.includes(syn)) {
        detectedCategory = canonical;
        break;
      }
    }
    if (detectedCategory) break;
  }

  // Detect price from query
  const queryPrice = extractPriceRange(queryLower);

  // Detect feature intents
  const activeFeatures: string[] = [];
  for (const [feature, config] of Object.entries(FEATURE_KEYWORDS)) {
    if (config.keys.some((k) => queryLower.includes(k))) {
      activeFeatures.push(feature);
    }
  }

  // Merge with filter features
  const allFeatures = [
    ...new Set([...activeFeatures, ...(filters?.features || [])]),
  ];

  // Score each product
  const scored: ScoredProduct[] = products
    .map((product) => {
      let score = 0;
      const matchReasons: string[] = [];
      const nameLower = product.name.toLowerCase();
      const brandLower = product.brand.toLowerCase();
      const catLower = (product.category || '').toLowerCase();

      // ── Name / brand match ──
      for (const term of terms) {
        if (nameLower.includes(term)) {
          score += 12;
          if (!matchReasons.includes(`Name matches "${term}"`)) {
            matchReasons.push(`Name matches "${term}"`);
          }
        }
        if (brandLower.includes(term)) {
          score += 10;
          if (!matchReasons.includes(`Brand matches "${term}"`)) {
            matchReasons.push(`Brand matches "${term}"`);
          }
        }
      }

      // ── Category match ──
      const targetCat = filters?.category
        ? normalizeCategory(filters.category)
        : detectedCategory;
      if (targetCat) {
        const prodCat = normalizeCategory(catLower);
        if (prodCat === targetCat) {
          score += 20;
          matchReasons.push(`Matches category "${targetCat}"`);
        } else {
          score -= 30; // strong penalty for wrong category
        }
      }

      // ── Feature keyword scoring ──
      for (const feature of allFeatures) {
        const config = FEATURE_KEYWORDS[feature];
        if (!config) continue;

        // Check if product has relevant specs
        const specs = product.quickSpecs || {};
        const hasRelevantSpec = config.specKeys.some(
          (k) => specs[k] && specs[k].length > 0
        );

        if (hasRelevantSpec) {
          score += 8;
          if (!matchReasons.includes(config.reason)) {
            matchReasons.push(config.reason);
          }
        }

        // Special: value feature rewards low price + high rating
        if (feature === 'value' && product.basePrice > 0) {
          const valueScore = (product.rating / 5) * (1000 / Math.max(product.basePrice, 100));
          score += Math.min(valueScore * 5, 15);
          if (valueScore > 1) matchReasons.push('Excellent value for money');
        }
      }

      // ── Spec value extraction & matching ──
      const specs = product.quickSpecs || {};

      // Camera MP matching
      if (queryLower.match(/\d+\s*mp/)) {
        const mpTarget = parseInt(queryLower.match(/(\d+)\s*mp/)![1]);
        const camSpec = specs.camera || specs.mainCamera || '';
        const mpMatch = camSpec.match(/(\d+)\s*MP/i);
        if (mpMatch) {
          const mp = parseInt(mpMatch[1]);
          if (mp >= mpTarget) {
            score += 10;
            matchReasons.push(`${mp}MP camera meets requirement`);
          }
        }
      }

      // Battery mAh matching
      if (queryLower.match(/\d{3,5}\s*mah/i)) {
        const mahTarget = parseInt(queryLower.match(/(\d{3,5})\s*mah/i)![1]);
        const batSpec = specs.battery || '';
        const mahMatch = batSpec.match(/(\d{3,5})\s*mAh/i);
        if (mahMatch) {
          const mah = parseInt(mahMatch[1]);
          if (mah >= mahTarget) {
            score += 10;
            matchReasons.push(`${mah}mAh battery meets requirement`);
          }
        }
      }

      // RAM matching
      if (queryLower.match(/\d+\s*gb\s*(?:ram)?/i)) {
        const ramTarget = parseInt(queryLower.match(/(\d+)\s*gb/i)![1]);
        const ramSpec = specs.ram || specs.memory || '';
        const ramMatch = ramSpec.match(/(\d+)\s*GB/i);
        if (ramMatch) {
          const ram = parseInt(ramMatch[1]);
          if (ram >= ramTarget) {
            score += 8;
            matchReasons.push(`${ram}GB RAM meets requirement`);
          }
        }
      }

      // Display size matching
      if (queryLower.match(/\d+\.?\d*\s*(?:inch|"|in\b)/i)) {
        const sizeTarget = parseFloat(
          queryLower.match(/(\d+\.?\d*)\s*(?:inch|"|in\b)/i)![1]
        );
        const dispSpec = specs.display || specs.screen || '';
        const sizeMatch = dispSpec.match(/(\d+\.?\d*)\s*(?:inch|"|in\b)/i);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          if (size >= sizeTarget) {
            score += 8;
            matchReasons.push(`${size}" display meets requirement`);
          }
        }
      }

      // ── Price filter ──
      const maxPrice = filters?.maxPrice ?? queryPrice.max;
      const minPrice = queryPrice.min;
      if (maxPrice !== undefined && product.basePrice > 0) {
        if (product.basePrice <= maxPrice) {
          score += 5;
        } else {
          score -= 50; // hard penalty for over budget
        }
      }
      if (minPrice !== undefined && product.basePrice > 0) {
        if (product.basePrice < minPrice) score -= 20;
      }

      // ── Rating filter & boost ──
      const minRating = filters?.minRating ?? 0;
      if (product.rating < minRating) {
        score -= 50;
      }
      // Rating always gives a small boost
      score += product.rating * 2;

      // ── Popularity boost (small) ──
      score += (product.popularity / 100) * 3;

      // ── Brand name in query gets extra boost ──
      if (
        terms.some(
          (t) => t.length > 2 && brandLower.includes(t) && nameLower.includes(t)
        )
      ) {
        score += 5;
      }

      // Deduplicate match reasons, keep max 3
      const uniqueReasons = [...new Set(matchReasons)].slice(0, 3);

      return {
        ...product,
        relevanceScore: Math.round(score * 10) / 10,
        matchReasons: uniqueReasons.length > 0
          ? uniqueReasons
          : ['Matches your search criteria'],
      };
    })
    .filter((p) => {
      // Apply hard filters
      const maxPrice = filters?.maxPrice ?? queryPrice.max;
      if (maxPrice !== undefined && p.basePrice > 0 && p.basePrice > maxPrice) return false;
      if (filters?.minRating && p.rating < filters.minRating) return false;
      if (filters?.category) {
        const filterCat = normalizeCategory(filters.category);
        const prodCat = normalizeCategory(p.category || '');
        if (prodCat !== filterCat) return false;
      }
      return true;
    });

  // Sort by score descending, then by popularity as tiebreaker
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore || b.popularity - a.popularity);

  return scored.slice(0, 20);
}
