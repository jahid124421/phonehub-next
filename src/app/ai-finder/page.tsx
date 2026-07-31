import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import AIFinderClient from "./AIFinderClient";

export const metadata: Metadata = {
  title: "AI Phone Finder - Smart Product Recommendations | PhoneHub",
  description:
    "Find the perfect phone, laptop, tablet or gadget with our AI-powered product finder. Answer a few questions and get personalized recommendations.",
  alternates: {
    canonical: `${SITE_URL}/ai-finder`,
  },
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PhoneHub AI Finder' }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Phone Finder",
  description:
    "Smart product recommendation wizard that helps you find the perfect device based on your needs, budget, and preferences.",
  url: `${SITE_URL}/ai-finder`,
  applicationCategory: "ShoppingApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function AIFinderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AIFinderClient />
    </>
  );
}
