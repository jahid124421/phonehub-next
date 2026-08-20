import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import { parseFinderState } from "./finder-shared";
import { buildFacetOptions, runFinder } from "./finder-server";
import AdvancedFinderClient from "./AdvancedFinderClient";

export const metadata: Metadata = {
  title: "Advanced Phone Finder - 50+ Filter Dimensions | PhoneHub",
  description:
    "Find the perfect phone with 50+ filter dimensions. Filter by brand, price, RAM, storage, battery, display, camera, chipset, connectivity and more.",
  keywords: [
    "phone finder",
    "advanced phone filter",
    "compare phones by specs",
    "phone search by RAM battery camera",
    "smartphone finder tool",
  ],
  alternates: {
    canonical: `${SITE_URL}/advanced-finder`,
  },
  openGraph: {
    title: "Advanced Phone Finder - 50+ Filter Dimensions | PhoneHub",
    description:
      "Filter phones by brand, price, RAM, storage, battery, display, chipset, 5G and more.",
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

const INITIAL_LIMIT = 60;

export default async function AdvancedFinderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initialState = parseFinderState((key) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? null : v ?? null;
  });

  const facetOptions = buildFacetOptions();
  const { results, total } = runFinder(initialState, INITIAL_LIMIT);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdvancedFinderClient
        facetOptions={facetOptions}
        initialState={initialState}
        initialResults={results}
        initialTotal={total}
      />
    </>
  );
}
