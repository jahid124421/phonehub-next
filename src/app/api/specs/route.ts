import { NextRequest, NextResponse } from 'next/server';
import { getSpecsForProduct, getScoreForProduct } from '@/lib/data';

/**
 * Lightweight specs+scores lookup — exists so the compare page can fetch
 * details for only the selected IDs (max 4) instead of bundling specs for
 * all 1.6k products into the client.
 */
export async function GET(req: NextRequest) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!ids.length) return NextResponse.json({ specs: {}, scores: {} });

  const specs: Record<string, unknown> = {};
  const scores: Record<string, unknown> = {};
  for (const id of ids) {
    const s = getSpecsForProduct(id);
    if (s) specs[id] = s;
    const sc = getScoreForProduct(id);
    if (sc) scores[id] = sc;
  }

  return NextResponse.json(
    { specs, scores },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
