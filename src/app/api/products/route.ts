import { NextRequest, NextResponse } from 'next/server';
import { getProductsByIds, getScoreForProduct } from '@/lib/data';

/**
 * Lightweight ID-lookup endpoint — exists so client components (e.g. the
 * watchlist) can fetch details for a handful of saved IDs instead of
 * bundling the full 2.9MB products.json.
 *
 * Returns card-shaped products (heavy fields stripped) with scores attached.
 */
export async function GET(req: NextRequest) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (!ids.length) return NextResponse.json({ products: [] });

  const products = getProductsByIds(ids).map((p) => ({
    id: p.id,
    brand: p.brand,
    name: p.name,
    category: p.category,
    image: p.image,
    fallbackImg: p.fallbackImg,
    releaseDate: p.releaseDate,
    basePrice: p.basePrice,
    popularity: p.popularity,
    rating: p.rating,
    reviewCount: p.reviewCount,
    review: '',
    quickSpecs: {},
    prices: [],
    pros: [],
    cons: [],
    score: getScoreForProduct(p.id),
  }));

  return NextResponse.json(
    { products },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
