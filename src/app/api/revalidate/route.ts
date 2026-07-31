import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidatePath('/');
  revalidatePath('/search');
  revalidateTag('products', {});

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
