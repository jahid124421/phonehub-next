import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureError } from '@/lib/monitoring';
import { getAllBrands, getAllProducts } from '@/lib/data';

interface BrandWithCount {
  id: string;
  name: string;
  logoUrl: string | null;
  color: string | null;
  category: string;
  subCategories: string[];
  productCount: number;
}

function jsonFallback(category: string | null) {
  const brands = getAllBrands();
  const products = getAllProducts();

  const productCountMap: Record<string, number> = {};
  for (const p of products) {
    productCountMap[p.brand] = (productCountMap[p.brand] || 0) + 1;
  }

  let filtered = brands;
  if (category) {
    filtered = brands.filter(
      (b) => b.category.toLowerCase() === category.toLowerCase()
    );
  }

  return filtered.map((b) => ({
    id: b.id,
    name: b.name,
    logoUrl: b.logo || null,
    color: b.color || null,
    category: b.category,
    subCategories: b.sub_categories || [],
    productCount: productCountMap[b.id] ?? 0,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }

    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    const result: BrandWithCount[] = brands.map((b) => ({
      id: b.id,
      name: b.name,
      logoUrl: b.logoUrl,
      color: b.color,
      category: b.category,
      subCategories: b.subCategories,
      productCount: b._count.products,
    }));

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    await captureError(error, { route: '/api/brands', operation: 'prisma-brands' });

    const category = request.nextUrl.searchParams.get('category');
    const data = jsonFallback(category);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }
}
