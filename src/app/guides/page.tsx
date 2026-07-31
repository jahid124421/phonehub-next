import type { Metadata } from "next";
import { getBuyingGuides, getProductById, getScoreForProduct, type BuyingGuide, type Product } from "@/lib/data";
import type { PhoneHubScore } from "@/lib/score-calculator";
import { SITE_URL } from "@/lib/config";
import GuidesClient from "./GuidesClient";

export const dynamic = "force-static";
export const revalidate = 86400; // daily

export const metadata: Metadata = {
  title: "Buying Guides — Best Phones, Laptops, Monitors & Routers 2026 | PhoneHub",
  description:
    "Curated best-of lists by PhoneHub experts. Find the best camera phones, budget phones, gaming phones, laptops, monitors, and Wi-Fi 7 routers for 2026.",
  keywords: [
    "best phones 2026",
    "best camera phones",
    "best budget phones",
    "best gaming phones",
    "best laptops",
    "best monitors",
    "best routers",
    "buying guide",
  ],
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "PhoneHub Buying Guides" }],
  },
};

const guidesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Buying Guides — Best Phones, Laptops, Monitors & Routers 2026 | PhoneHub",
  description: "Curated best-of lists by PhoneHub experts.",
  url: `${SITE_URL}/guides`,
};

interface EnrichedGuideProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  basePrice: number;
  score: PhoneHubScore | null;
  reasoning: string;
}

interface EnrichedGuide extends BuyingGuide {
  enrichedProducts: EnrichedGuideProduct[];
}

export default function GuidesPage() {
  const guides = getBuyingGuides();

  const enrichedGuides: EnrichedGuide[] = guides.map((guide) => {
    const enrichedProducts: EnrichedGuideProduct[] = guide.products
      .map((pid) => {
        const product = getProductById(pid);
        if (!product) return null;
        const score = getScoreForProduct(pid);
        return {
          id: pid,
          name: product.name,
          brand: product.brand,
          image: product.image,
          basePrice: product.basePrice,
          score,
          reasoning: guide.reasoning[pid] || "",
        };
      })
      .filter((p): p is EnrichedGuideProduct => p !== null);
    return { ...guide, enrichedProducts };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guidesJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Buying Guides</h1>
          <p className="mt-2" style={{ color: "var(--muted)" }}>
            Curated best-of lists by PhoneHub experts — find the perfect device for your needs
          </p>
        </div>
        <GuidesClient guides={enrichedGuides} />
      </div>
    </>
  );
}
