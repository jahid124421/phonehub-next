import { Suspense } from 'react';
import { getAllProducts, getSpecsForProduct } from '@/lib/data';
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
  const products = getAllProducts();

  // Build a specs map: { [productId]: specs } — only for products that have specs
  const specsMap: Record<string, Record<string, Record<string, string>>> = {};
  products.forEach((p) => {
    const specs = getSpecsForProduct(p.id);
    if (specs) specsMap[p.id] = specs;
  });

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="loading loading-spinner loading-lg mt-12 mx-auto block" />
        </div>
      }
    >
      <CompareClient allSpecs={specsMap} />
    </Suspense>
  );
}
