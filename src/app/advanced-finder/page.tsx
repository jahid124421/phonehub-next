import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import { getPhoneProducts } from "@/lib/data";
import AdvancedFinderClient from "./AdvancedFinderClient";

export const metadata: Metadata = {
  title: "Advanced Phone Finder - 50+ Filter Dimensions | PhoneHub",
  description:
    "Find the perfect phone with 50+ filter dimensions. Filter by display, camera, battery, performance, build, connectivity and more.",
  alternates: {
    canonical: `${SITE_URL}/advanced-finder`,
  },
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "PhoneHub Advanced Finder" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Advanced Phone Finder",
  description:
    "Advanced phone filter with 50+ dimensions including display tech, camera specs, battery, chipset and connectivity.",
  url: `${SITE_URL}/advanced-finder`,
  applicationCategory: "ShoppingApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

// Build a lightweight payload — only fields needed by the UI
type FinderProduct = {
  id: string;
  name: string;
  brand: string;
  basePrice: number;
  image: string;
  rating: number;
  reviewCount: number;
  popularity: number;
  filterSpecs: Record<string, unknown>;
};

function buildPayload(): FinderProduct[] {
  const phones = getPhoneProducts();
  return phones.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    basePrice: p.basePrice,
    image: p.image,
    rating: p.rating,
    reviewCount: p.reviewCount,
    popularity: p.popularity,
    filterSpecs: p.filterSpecs as unknown as Record<string, unknown>,
  }));
}

// Gather dynamic option values for brand & chipset
function getDynamicOptions() {
  const phones = getPhoneProducts();
  const brands = [...new Set(phones.map((p) => p.brand))].sort();
  const chipsets = [
    ...new Set(phones.map((p) => p.filterSpecs?.chipset).filter(Boolean) as string[]),
  ].sort();
  return { brands, chipsets };
}

export default function AdvancedFinderPage() {
  const products = buildPayload();
  const dynamic = getDynamicOptions();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdvancedFinderClient products={products} dynamicOptions={dynamic} />
    </>
  );
}
