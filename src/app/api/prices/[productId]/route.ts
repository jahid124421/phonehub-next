import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PriceRow {
  id: number;
  productId: string;
  storeId: number;
  store: { id: number; name: string; slug: string };
  price: number | null;
  currency: string;
  url: string;
  fetchedAt: Date;
}

interface PriceHistoryRow {
  id: string; // BigInt serialized as string
  productId: string;
  storeId: number;
  store: { id: number; name: string; slug: string };
  price: number;
  currency: string;
  recordedAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const storeId = request.nextUrl.searchParams.get('storeId');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const priceWhere: Record<string, unknown> = { productId };
    const historyWhere: Record<string, unknown> = {
      productId,
      recordedAt: { gte: sixMonthsAgo },
    };

    if (storeId) {
      const sid = parseInt(storeId, 10);
      if (!isNaN(sid)) {
        priceWhere.storeId = sid;
        historyWhere.storeId = sid;
      }
    }

    const [current, historyRaw] = await Promise.all([
      prisma.price.findMany({
        where: priceWhere,
        include: { store: true },
        orderBy: { price: 'asc' },
      }),
      prisma.priceHistory.findMany({
        where: historyWhere,
        include: { store: true },
        orderBy: { recordedAt: 'desc' },
        take: 200,
      }),
    ]);

    // BigInt ids must be converted to strings for JSON serialization
    const history = historyRaw.map((h) => ({
      ...h,
      id: h.id.toString(),
    }));

    return NextResponse.json({ current, history });
  } catch (error) {
    console.error('[API /api/prices] Error:', error);
    return NextResponse.json(
      { current: [], history: [] },
      { status: 200 }
    );
  }
}
