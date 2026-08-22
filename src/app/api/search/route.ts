import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureError } from '@/lib/monitoring';
import { getAllProducts, type Product as JsonProduct } from '@/lib/data';

interface SearchProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  image: string | null;
  fallbackImg: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  basePrice: number;
  popularity: number;
  rating: number;
  reviewCount: number;
  quickSpecs: Record<string, string>;
  pros: string[];
  cons: string[];
}

function sortProducts(products: JsonProduct[], sort: string): JsonProduct[] {
  const sorted = [...products];
  switch (sort) {
    case 'popularity':
      return sorted.sort((a, b) => b.popularity - a.popularity);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'price_asc':
      return sorted.sort((a, b) => a.basePrice - b.basePrice);
    case 'price_desc':
      return sorted.sort((a, b) => b.basePrice - a.basePrice);
    case 'release_year':
      return sorted.sort((a, b) => {
        const yearA = parseInt(a.releaseDate?.slice(0, 4) || '0', 10);
        const yearB = parseInt(b.releaseDate?.slice(0, 4) || '0', 10);
        return yearB - yearA;
      });
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity);
  }
}

// ─── JSON fallback: natural-language aware relevance search ─────────────────
// The old fallback did `name.includes(wholeQuery)`, so any multi-word query
// ("best camera phone") matched literally nothing. This version tokenizes the
// query, detects category/feature/price intent, scores every product, and
// keeps only results with real evidence of relevance.

const SEARCH_STOP_WORDS = new Set([
  'best', 'the', 'a', 'an', 'for', 'with', 'and', 'or', 'of', 'to', 'in',
  'on', 'is', 'are', 'what', 'which', 'whats', 'top', 'good', 'great',
  'cheap', 'budget', 'buy', 'me', 'my', 'i', 'want', 'need', 'get', 'vs',
  'under', 'below', 'less', 'than', 'up', 'around', 'max', 'maximum',
]);

const SEARCH_CATEGORY_SYNONYMS: Record<string, string[]> = {
  phone: ['phone', 'phones', 'smartphone', 'smartphones', 'mobile', 'mobiles', 'cellphone', 'cell', 'handset', 'iphone'],
  laptop: ['laptop', 'laptops', 'notebook', 'ultrabook', 'macbook', 'chromebook'],
  tablet: ['tablet', 'tablets', 'ipad', 'tab'],
  smartwatch: ['watch', 'smartwatch', 'wearable'],
  tv: ['tv', 'tvs', 'television', 'oled', 'qled'],
  camera: ['camera', 'cameras', 'dslr', 'mirrorless'],
  monitor: ['monitor', 'monitors', 'display', 'screen'],
  router: ['router', 'routers', 'wifi', 'mesh'],
  auto: ['car', 'cars', 'auto', 'vehicle', 'suv', 'sedan', 'truck', 'bike', 'scooter'],
};

// Feature intent → quickSpec keys that prove the product is relevant.
const SEARCH_FEATURE_SPECS: Record<string, { keys: string[]; specKeys: string[] }> = {
  camera: { keys: ['camera', 'photo', 'photography', 'mp', 'megapixel', 'zoom', 'selfie', 'vlog'], specKeys: ['camera', 'mainCamera', 'selfieCamera'] },
  battery: { keys: ['battery', 'mah', 'charging', 'charge', 'endurance'], specKeys: ['battery'] },
  performance: { keys: ['gaming', 'game', 'performance', 'speed', 'ram', 'processor', 'chipset', 'cpu', 'gpu', 'benchmark'], specKeys: ['ram', 'chipset', 'processor'] },
  display: { keys: ['display', 'screen', 'amoled', 'oled', 'refresh', 'hz', 'resolution', 'brightness', 'hdr'], specKeys: ['display', 'screen'] },
  storage: { keys: ['storage', 'gb', 'tb', 'memory'], specKeys: ['storage', 'memory'] },
};

/**
 * Detect the product category the user is asking about.
 * The object of the search is the head noun of the query — usually the LAST
 * category word before any connector ("with", "for", "and"). Category words
 * after a connector describe features, not the object:
 *   "best camera phone"         → phone  (last word of the noun phrase)
 *   "phone with the best camera" → phone  ("camera" is after "with")
 *   "best laptop for gaming"     → laptop
 */
function detectCategory(queryLower: string): string | null {
  const findLastMatch = (text: string): string | null => {
    let best: { cat: string; end: number } | null = null;
    for (const [cat, syns] of Object.entries(SEARCH_CATEGORY_SYNONYMS)) {
      for (const syn of syns) {
        let idx = text.indexOf(syn);
        while (idx !== -1) {
          const end = idx + syn.length;
          const before = idx === 0 ? ' ' : text[idx - 1];
          const after = end >= text.length ? ' ' : text[end];
          // Word boundaries only — "phone" must not match inside "iPhone".
          if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) {
            if (!best || end >= best.end) best = { cat, end };
          }
          idx = text.indexOf(syn, idx + 1);
        }
      }
    }
    return best ? best.cat : null;
  };

  const head = queryLower.split(/\s(?:with|for|and|that)\s/)[0];
  return findLastMatch(head) ?? findLastMatch(queryLower);
}

function extractMaxPrice(queryLower: string): number | null {
  const m = queryLower.match(/(?:under|below|less than|up to|around|max(?:imum)?|budget(?:\s*of)?)\s*\$?\s*(\d{2,6})/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

/**
 * Score every product against the query; return those with evidence of relevance.
 * `softBudget`: when the catalog has nothing within the stated budget, the
 * over-budget penalty shrinks so relevant-but-pricier items still surface
 * instead of a blank "0 results" page.
 */
function relevanceSearch(products: JsonProduct[], q: string, softBudget = false): JsonProduct[] {
  const queryLower = q.toLowerCase().trim();
  const category = detectCategory(queryLower);
  const maxPrice = extractMaxPrice(queryLower);

  const catSyns = category ? new Set(SEARCH_CATEGORY_SYNONYMS[category]) : null;
  const terms = queryLower
    .split(/[\s,]+/)
    .map((t) => t.replace(/[^a-z0-9.]/g, ''))
    .filter((t) => t.length > 1 && !SEARCH_STOP_WORDS.has(t))
    // The category word itself ("phone") carries no name-matching signal, and
    // the price digits ("800") are handled by the budget scorer.
    .filter((t) => !catSyns?.has(t))
    .filter((t) => !(maxPrice !== null && t === String(maxPrice)));
  const features = Object.entries(SEARCH_FEATURE_SPECS)
    .filter(([, cfg]) => cfg.keys.some((k) => queryLower.includes(k)))
    .map(([f]) => f);

  const scored = products.map((p) => {
    let score = 0;
    const name = p.name.toLowerCase();
    const brand = p.brand.toLowerCase();
    const specsText = Object.values(p.quickSpecs || {}).join(' ').toLowerCase();

    for (const term of terms) {
      if (name.includes(term)) score += 12;
      if (brand.includes(term)) score += 10;
      if (specsText.includes(term)) score += 6;
    }

    if (category) {
      score += (p.category || '').toLowerCase() === category ? 20 : -30;
    }

    const specs = p.quickSpecs || {};
    for (const f of features) {
      const cfg = SEARCH_FEATURE_SPECS[f];
      if (cfg.specKeys.some((k) => specs[k] && specs[k].length > 0)) score += 8;
    }

    // Numeric spec targets: "64MP", "5000mAh", "8GB", "6.7 inch"
    const mp = queryLower.match(/(\d+)\s*mp/);
    if (mp) {
      const camMatch = (specs.camera || specs.mainCamera || '').match(/(\d+)\s*MP/i);
      if (camMatch && parseInt(camMatch[1]) >= parseInt(mp[1])) score += 10;
    }
    const mah = queryLower.match(/(\d{3,5})\s*mah/i);
    if (mah) {
      const batMatch = (specs.battery || '').match(/(\d{3,5})\s*mAh/i);
      if (batMatch && parseInt(batMatch[1]) >= parseInt(mah[1])) score += 10;
    }
    const gb = queryLower.match(/(\d{1,4})\s*gb/i);
    if (gb) {
      const memText = `${specs.ram || ''} ${specs.memory || ''} ${specs.storage || ''}`;
      if (new RegExp(`${gb[1]}\s*GB`, 'i').test(memText)) score += 8;
    }

    if (maxPrice !== null && p.basePrice > 0) {
      if (p.basePrice <= maxPrice) {
        score += 8;
      } else if (softBudget) {
        // Mild penalty + proximity gradient, so the closest-to-budget
        // products rank first when nothing fits the budget.
        score -= 5 + Math.min(10, (p.basePrice - maxPrice) / 50);
      } else {
        score -= 50;
      }
    }

    // Baseline quality signal — keeps good products afloat, never enough
    // on its own to pass the relevance threshold.
    score += p.rating * 2 + (p.popularity / 100) * 3;

    return { p, score };
  });

  // Baseline max ≈ 13 (rating 10 + popularity 3). Require real evidence on
  // top. Soft-budget mode relaxes the bar — the user already told us the
  // category, and nothing in the catalog fits their budget.
  const threshold = softBudget ? 15 : 20;
  return scored
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score || b.p.popularity - a.p.popularity)
    .map((s) => s.p);
}

function jsonFallback(
  q: string,
  cat: string | null,
  brand: string | null,
  sort: string,
  page: number,
  limit: number,
  ids: string | null
) {
  let products = getAllProducts();

  // If specific IDs requested, filter to those
  if (ids) {
    const idSet = new Set(ids.split(',').map((id) => id.trim()));
    products = products.filter((p) => idSet.has(p.id));
    // Return directly with matching order
    return { results: products, total: products.length, page: 1, totalPages: 1 };
  }

  const useRelevance = Boolean(q);
  if (q) {
    const queryLower = q.toLowerCase().trim();
    const maxPrice = extractMaxPrice(queryLower);
    const category = detectCategory(queryLower);

    products = relevanceSearch(products, q);
    // Strict matching found nothing — retry with a relaxed budget penalty so
    // the user sees the closest relevant products rather than an empty page.
    if (products.length === 0 && maxPrice !== null) {
      products = relevanceSearch(getAllProducts(), q, true);
    }
    // Some categories have sparse specs, so feature terms can still leave a
    // zero-result page. Fall back to closest products in the requested category.
    if (products.length === 0 && maxPrice !== null && category) {
      products = getAllProducts()
        .filter((p) => p.category.toLowerCase() === category)
        .sort((a, b) => {
          const aDistance = a.basePrice > 0 ? Math.max(0, a.basePrice - maxPrice) : Number.MAX_SAFE_INTEGER;
          const bDistance = b.basePrice > 0 ? Math.max(0, b.basePrice - maxPrice) : Number.MAX_SAFE_INTEGER;
          return aDistance - bDistance || b.rating - a.rating || b.popularity - a.popularity;
        });
    }
  }

  if (cat) {
    products = products.filter(
      (p) => p.category.toLowerCase() === cat.toLowerCase()
    );
  }

  if (brand) {
    const brandIds = brand.split(',').map((b) => b.trim().toLowerCase());
    products = products.filter((p) =>
      brandIds.includes(p.brand.toLowerCase())
    );
  }

  // Relevance order already reflects the query; only re-sort when the user
  // asked for an explicit order or when browsing without a query.
  if (!useRelevance || sort !== 'popularity') {
    products = sortProducts(products, sort);
  }

  const total = products.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const results = products.slice(offset, offset + limit);

  return { results, total, page, totalPages };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get('q') || '';
  const cat = params.get('cat');
  const brand = params.get('brand');
  const sort = params.get('sort') || 'popularity';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));
  const ids = params.get('ids');

  // Natural-language searches need tokenized relevance/category/soft-budget
  // handling; Postgres plainto_tsquery is too literal for queries like
  // "best camera phone" or "gaming laptop under 800".
  if (q) {
    const data = jsonFallback(q, cat, brand, sort, page, limit, ids);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  // No database configured → serve the bundled JSON catalog immediately
  // instead of paying a failed-connection timeout on every request.
  if (!process.env.DATABASE_URL) {
    const data = jsonFallback(q, cat, brand, sort, page, limit, ids);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  try {
    const offset = (page - 1) * limit;

    // Build sort SQL fragment
    let orderBy = 'popularity DESC';
    switch (sort) {
      case 'rating':
        orderBy = 'rating DESC';
        break;
      case 'price_asc':
        orderBy = 'base_price ASC';
        break;
      case 'price_desc':
        orderBy = 'base_price DESC';
        break;
      case 'release_year':
        orderBy = 'release_year DESC';
        break;
      case 'popularity':
      default:
        orderBy = 'popularity DESC';
        break;
    }

    // Build WHERE clauses
    const conditions: string[] = [];
    const values: (string | string[])[] = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex})`);
      values.push(q);
      paramIndex++;
    }

    if (cat) {
      // Join with categories table
      conditions.push(`EXISTS (SELECT 1 FROM categories c WHERE c.id = p.category_id AND c.slug = $${paramIndex})`);
      values.push(cat);
      paramIndex++;
    }

    if (brand) {
      const brandIds = brand.split(',').map((b) => b.trim());
      conditions.push(`p.brand_id = ANY($${paramIndex})`);
      values.push(brandIds);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `SELECT COUNT(*)::int AS total FROM products p ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe<{ total: number }[]>(countSql, ...values);
    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Data query
    const dataSql = `
      SELECT
        p.id,
        b.name AS brand,
        p.name,
        COALESCE(c.slug, 'other') AS category,
        p.image_url AS image,
        p.fallback_img AS "fallbackImg",
        p.release_date AS "releaseDate",
        p.release_year AS "releaseYear",
        p.base_price AS "basePrice",
        p.popularity,
        p.rating::float,
        p.review_count AS "reviewCount",
        p.quick_specs AS "quickSpecs",
        p.pros,
        p.cons
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const results = await prisma.$queryRawUnsafe<SearchProduct[]>(
      dataSql,
      ...values,
      limit,
      offset
    );

    return NextResponse.json({ results, total, page, totalPages }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    await captureError(error, { route: '/api/search', operation: 'prisma-search' });

    const params = request.nextUrl.searchParams;
    const q = params.get('q') || '';
    const cat = params.get('cat');
    const brand = params.get('brand');
    const sort = params.get('sort') || 'popularity';
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));
    const ids = params.get('ids');

    const data = jsonFallback(q, cat, brand, sort, page, limit, ids);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }
}
