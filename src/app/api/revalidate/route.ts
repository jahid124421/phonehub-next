import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { isAuthorizedCronRequest } from '@/lib/security';

export async function POST(request: NextRequest) {
  // Timing-safe secret check; fails closed when CRON_SECRET is unset.
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidatePath('/');
  revalidatePath('/search');
  revalidateTag('products', 'max');

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
