import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllProducts,
  getProductById,
  getProductsByBrand,
  getProductsByCategory,
  getSpecsForProduct,
  getBenchmarksForProduct,
  getScoreForProduct,
  type Product,
} from "@/lib/data";
import Breadcrumb from "@/components/Breadcrumb";
import CompareButton from "@/components/CompareButton";
import WatchlistButton from "@/components/WatchlistButton";
import PriceAlertButton from "@/components/PriceAlertButton";
import RecentlyViewed from "@/components/RecentlyViewed";
import ProductImage from "@/components/ProductImage";
import GiscusDiscussion from "@/components/GiscusDiscussion";
import PhoneCard from "@/components/PhoneCard";
import ScoreBadge from "@/components/ScoreBadge";
import UserReviews from "@/components/UserReviews";
import { SITE_URL } from "@/lib/config";
import { productSchema, breadcrumbSchema } from "@/lib/schema";
import { scoreColor } from "@/lib/score-color";

// ─── SSG + ISR config ────────────────────────────────────────────────────────
export const dynamic = "force-static";
export const revalidate = 86400; // daily

// ─── generateStaticParams ─────────────────────────────────────────────────────
export function generateStaticParams() {
  const allProducts = getAllProducts();
  // Sort by popularity (review count) and limit to top 200 for ISR
  const topProducts = allProducts
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 200);
  return topProducts.map((p) => ({ id: p.id }));
}

// ─── generateMetadata ─────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return {};

  const description =
    product.review?.slice(0, 160) ||
    Object.values(product.quickSpecs || {}).join(" · ").slice(0, 160);

  return {
    title: `${product.name} — Full Specs & Review`,
    description,
    openGraph: {
      type: "website",
      title: `${product.name} — PhoneHub`,
      description,
      images: [{ url: product.image }],
    },
    other: {
      "product:brand": product.brand,
    },
    alternates: {
      canonical: `/phone/${product.id}`,
    },
  };
}

// ─── Star display helper ──────────────────────────────────────────────────────
function Stars({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <svg key={i} className="w-5 h-5 text-warning fill-warning" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <svg key={i} className="w-5 h-5 text-warning" viewBox="0 0 24 24">
          <defs>
            <linearGradient id={`half-star-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#half-star-${i})`}
            stroke="currentColor"
            strokeWidth={1}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      );
    } else {
      stars.push(
        <svg
          key={i}
          className="w-5 h-5 text-base-content/20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex">{stars}</div>
      <span className="font-semibold text-lg">{rating.toFixed(1)}</span>
      <span className="text-sm text-base-content/60">({reviewCount.toLocaleString()} reviews)</span>
    </div>
  );
}

// ─── Quick-spec icons ──────────────────────────────────────────────────────────
const QS_ICONS: Record<string, string> = {
  display: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  processor: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
  ram: "M4 6h16M4 10h16M4 14h16M4 18h16",
  storage: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
  camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11zM12 17a4 4 0 100-8 4 4 0 000 8z",
  battery: "M17 6H3a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm4 4v4m-7-8h4",
};

function QsIcon({ label }: { label: string }) {
  const d = QS_ICONS[label.toLowerCase()] || QS_ICONS.display;
  return (
    <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

// ─── Page component ────────────────────────────────────────────────────────────
export default async function PhoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const specs = getSpecsForProduct(id) || {};
  const score = getScoreForProduct(id);
  const brandProducts = getProductsByBrand(product.brand).filter((p) => p.id !== id);
  const similar: Product[] =
    brandProducts.length >= 4
      ? brandProducts.slice(0, 4)
      : [
          ...brandProducts,
          ...getProductsByCategory(product.category)
            .filter((p) => p.id !== id && !brandProducts.some((bp) => bp.id === p.id))
            .slice(0, 4 - brandProducts.length),
        ];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: product.brand, href: `/search?brand=${product.brand.toLowerCase()}` },
    { label: product.name },
  ];

  const fallback = product.fallbackImg ? `/${product.fallbackImg}` : "/img/no-image.svg";

  // JSON-LD using schema helpers
  const productLd = productSchema(product);
  const breadcrumbLd = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: product.brand, url: `${SITE_URL}/search?brand=${product.brand.toLowerCase()}` },
    { name: product.name, url: `${SITE_URL}/phone/${product.id}` },
  ]);

  // Spec section display order
  const specOrder = [
    "Network", "Launch", "Body", "Display", "Platform", "Memory",
    "Main Camera", "Selfie Camera", "Selfie camera", "Sound",
    "Comms", "Features", "Battery", "Misc",
  ];
  const specKeys = Object.keys(specs);
  const orderedSpecKeys = [
    ...specOrder.filter((k) => specKeys.includes(k)),
    ...specKeys.filter((k) => !specOrder.includes(k)),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* 1. Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 2. Phone Top */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        {/* Gallery */}
        <div className="product-img-bg rounded-2xl border border-base-300 overflow-hidden flex items-center justify-center aspect-square">
          <ProductImage src={product.image} alt={product.name} fallback={fallback} />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-2 text-base-content/70 text-sm">
            <img
              src={`https://cdn.simpleicons.org/${product.brand.toLowerCase()}`}
              alt={product.brand}
              className="w-4 h-4"
              width={16}
              height={16}
            />
            <span>{product.brand}</span>
            {product.releaseDate && (
              <>
                <span>·</span>
                <span>Released {product.releaseDate}</span>
              </>
            )}
          </div>

          <Stars rating={product.rating} reviewCount={product.reviewCount} />

          {/* Price */}
          <div className="text-2xl font-extrabold">
            {product.basePrice > 0 ? (
              <>
                ${product.basePrice.toLocaleString()}
                <span className="ml-2 text-sm font-normal text-base-content/50">base price</span>
              </>
            ) : (
              <>
                Check latest price
                <span className="ml-2 text-sm font-normal text-base-content/50">from retailers</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <CompareButton productId={product.id} />
            <WatchlistButton productId={product.id} />
          </div>

          {/* PhoneHub Score */}
          {score && (
            <div className="flex items-start gap-4 pt-2">
              <ScoreBadge score={score} size="large" />
              <div className="space-y-1.5 flex-1">
                <div className="text-sm font-bold text-base-content/70 uppercase tracking-wide">PhoneHub Score Breakdown</div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                  {[
                    { label: 'Display', value: score.display },
                    { label: 'Camera', value: score.camera },
                    { label: 'Performance', value: score.performance },
                    { label: 'Battery', value: score.battery },
                    { label: 'Value', value: score.value },
                    { label: 'Build', value: score.build },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="flex-1 bg-base-300 rounded-full h-1.5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${value}%`,
                            backgroundColor: scoreColor(value),
                          }}
                        />
                      </div>
                      <span className="text-base-content/60 min-w-[56px]">{label}</span>
                      <span className="font-semibold min-w-[22px] text-right" style={{
                        color: scoreColor(value),
                      }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Specs */}
          {product.quickSpecs && Object.keys(product.quickSpecs).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {Object.entries(product.quickSpecs).slice(0, 6).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-start gap-3 rounded-xl bg-base-200 border border-base-300 px-4 py-3"
                >
                  <QsIcon label={key} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold uppercase tracking-wide text-base-content/50 mb-0.5">
                      {key}
                    </div>
                    <div className="text-sm text-base-content/80 leading-snug line-clamp-2">
                      {val}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Price Comparison */}
      <section>
        <h2 className="text-xl font-bold mb-4">💰 Price Comparison</h2>
        {product.prices && product.prices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Price</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {product.prices.map((entry, idx) => (
                  <tr key={idx} className="hover">
                    <td className="font-medium">{entry.store}</td>
                    <td>
                      {entry.price != null ? (
                        <span className="font-semibold text-primary">
                          ${entry.price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-base-content/50 italic">Check price</span>
                      )}
                    </td>
                    <td className="text-right">
                      <a
                        href={entry.url}
                        rel="nofollow sponsored noopener noreferrer"
                        target="_blank"
                        className="btn btn-primary btn-sm"
                      >
                        Buy Now
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-base-content/50 italic">Prices coming soon.</p>
        )}
        {product.basePrice > 0 && (
          <div className="mt-4">
            <PriceAlertButton productId={product.id} currentPrice={product.basePrice} />
          </div>
        )}
      </section>

      {/* 4. Expert Verdict */}
      <section>
        <h2 className="text-xl font-bold mb-4">Expert Verdict</h2>
        {product.review && (
          <p className="text-base-content/80 leading-relaxed mb-6">{product.review}</p>
        )}
        {(product.pros?.length > 0 || product.cons?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.pros?.length > 0 && (
              <div className="rounded-xl bg-success/10 border border-success/30 p-5">
                <h4 className="font-semibold text-success mb-3">👍 Pros</h4>
                <ul className="space-y-2">
                  {product.pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-success mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.cons?.length > 0 && (
              <div className="rounded-xl bg-error/10 border border-error/30 p-5">
                <h4 className="font-semibold text-error mb-3">👎 Cons</h4>
                <ul className="space-y-2">
                  {product.cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-error mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. Benchmarks */}
      {(() => {
        const bm = getBenchmarksForProduct(id);
        if (!bm) return null;
        const maxAntutu = 2000000;  // Updated for latest flagships
        const maxGbSingle = 3000;   // Updated for latest chips
        const maxGbMulti = 8000;    // Updated for latest chips
        return (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📊 Benchmarks</h2>
              <a href="/benchmarks" className="btn btn-ghost btn-sm">
                View All Benchmarks →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Geekbench */}
              <div className="rounded-xl bg-base-200 border border-base-300 p-5 space-y-4">
                <h3 className="font-semibold text-lg">Geekbench 6</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-base-content/70">Single-Core</span>
                      <span className="font-mono font-semibold">{bm.geekbench?.single?.toLocaleString() ?? '—'}</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${Math.min(100, ((bm.geekbench?.single ?? 0) / maxGbSingle) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-base-content/70">Multi-Core</span>
                      <span className="font-mono font-semibold">{bm.geekbench?.multi?.toLocaleString() ?? '—'}</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${Math.min(100, ((bm.geekbench?.multi ?? 0) / maxGbMulti) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* AnTuTu */}
              <div className="rounded-xl bg-base-200 border border-base-300 p-5 space-y-4">
                <h3 className="font-semibold text-lg">AnTuTu v10</h3>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-base-content/70">Total Score</span>
                    <span className="font-mono font-semibold text-primary">{bm.antutu?.total?.toLocaleString() ?? '—'}</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${Math.min(100, ((bm.antutu?.total ?? 0) / maxAntutu) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: "CPU", val: bm.antutu?.cpu, color: "from-orange-500 to-red-400" },
                    { label: "GPU", val: bm.antutu?.gpu, color: "from-green-500 to-emerald-400" },
                    { label: "Memory", val: bm.antutu?.mem, color: "from-purple-500 to-violet-400" },
                    { label: "UX", val: bm.antutu?.ux, color: "from-pink-500 to-rose-400" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-base-content/50">{item.label}</span>
                        <span className="font-mono">{item.val?.toLocaleString() ?? '—'}</span>
                      </div>
                      <div className="w-full bg-base-300 rounded-full h-1.5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${Math.min(100, ((item.val ?? 0) / (maxAntutu * 0.4)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* 6. Full Specifications */}
      {orderedSpecKeys.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Full Specifications</h2>
          <div className="space-y-2">
            {orderedSpecKeys.map((section, idx) => {
              const sectionData = specs[section];
              if (!sectionData || Object.keys(sectionData).length === 0) return null;
              const isFirst = idx === 0;
              return (
                <details
                  key={section}
                  className="collapse collapse-arrow bg-base-200 border border-base-300"
                  {...(isFirst ? { open: true } : {})}
                >
                  <summary className="collapse-title font-semibold text-base">
                    {section}
                  </summary>
                  <div className="collapse-content">
                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <tbody>
                          {Object.entries(sectionData).map(([k, v]) => (
                            <tr key={k} className="border-b border-base-300 last:border-0">
                              <td className="w-40 font-medium text-base-content/60 align-top">
                                {k}
                              </td>
                              <td className="text-base-content/90 whitespace-pre-line">{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. User Reviews */}
      <UserReviews productId={product.id} />

      {/* 7. Recently Viewed */}
      <RecentlyViewed
        currentProduct={{
          id: product.id,
          name: product.name,
          image: product.image,
          brand: product.brand,
        }}
      />

      {/* 7. Similar Products */}
      {similar.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {similar.map((p) => (
              <PhoneCard key={p.id} product={p} score={getScoreForProduct(p.id)} />
            ))}
          </div>
        </section>
      )}

      {/* 8. Discussion */}
      <section>
        <h2 className="text-xl font-bold mb-2">💬 Discussion</h2>
        <p className="text-base-content/60 text-sm mb-4">
          Ask questions or share your experience with the {product.name}.
        </p>
        <GiscusDiscussion />
      </section>
    </div>
  );
}
