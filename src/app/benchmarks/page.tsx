import type { Metadata } from "next";
import {
  getTopBenchmarkProducts,
  getAllBenchmarks,
  getProductById,
} from "@/lib/data";
import { SITE_URL } from "@/lib/config";
import BenchmarksClient from "./BenchmarksClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Phone Benchmarks - Compare Performance Scores | PhoneHub",
  description:
    "Compare Geekbench and AnTuTu benchmark scores for 100+ phones. Find the fastest smartphones ranked by performance.",
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PhoneHub Benchmarks' }],
  },
};

const benchmarksJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Phone Benchmarks - Compare Performance Scores | PhoneHub',
  description: 'Compare Geekbench and AnTuTu benchmark scores for 100+ phones.',
  url: `${SITE_URL}/benchmarks`,
};

export default function BenchmarksPage() {
  const topProducts = getTopBenchmarkProducts(200, "antutu.total");
  const allBenchmarks = getAllBenchmarks();

  // Enrich with product details
  const entries = topProducts
    .map((entry) => {
      const product = getProductById(entry.id);
      return {
        ...entry,
        name: product?.name || entry.id,
        brand: product?.brand || "",
        image: product?.image || "",
      };
    })
    .filter((e) => e.name); // filter out entries without matching products

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(benchmarksJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Phone Benchmarks</h1>
          <p className="text-base-content/60 mt-2">
            Compare Geekbench and AnTuTu performance scores across {entries.length}+ phones
          </p>
        </div>
        <BenchmarksClient entries={entries} />
      </div>
    </>
  );
}
