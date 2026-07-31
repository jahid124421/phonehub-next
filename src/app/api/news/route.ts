import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllNews, type NewsItem } from '@/lib/data';

function jsonFallback(tag: string | null, page: number, limit: number) {
  let items = getAllNews();

  if (tag) {
    items = items.filter((n) => n.tag.toLowerCase() === tag.toLowerCase());
  }

  // Sort by date descending
  items = [...items].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paged = items.slice(offset, offset + limit);

  return { items: paged, total, page, totalPages };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const tag = params.get('tag');
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (tag) {
      where.tag = tag;
    }

    const [items, totalResult] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { publishedDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.news.count({ where }),
    ]);

    const total = totalResult;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ items, total, page, totalPages }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API /api/news] Prisma error, falling back to JSON:', error);

    const params = request.nextUrl.searchParams;
    const tag = params.get('tag');
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));

    const data = jsonFallback(tag, page, limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }
}
