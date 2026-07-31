import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

  if (q) {
    const query = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
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

  products = sortProducts(products, sort);

  const total = products.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const results = products.slice(offset, offset + limit);

  return { results, total, page, totalPages };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const q = params.get('q') || '';
    const cat = params.get('cat');
    const brand = params.get('brand');
    const sort = params.get('sort') || 'popularity';
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));
    const ids = params.get('ids');
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
    console.error('[API /api/search] Prisma error, falling back to JSON:', error);

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
