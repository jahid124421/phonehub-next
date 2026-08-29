import { Suspense } from 'react';
import { SITE_URL } from '@/lib/config';
import CompareClient from './CompareClient';

export const metadata = {
  title: 'Compare',
  description: 'Compare phones, laptops & more side by side',
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PhoneHub Compare' }],
  },
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="loading loading-spinner loading-lg mt-12 mx-auto block" />
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
