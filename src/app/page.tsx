import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  getAllProducts,
  getAllBrands,
  getAllNews,
  type Product,
  type Brand,
} from "@/lib/data";
import {
  trendingProducts,
  popularProducts,
  latestProducts,
  brandProductCount,
} from "@/lib/homepage-data";
import PhoneCard from "@/components/PhoneCard";
import ProductImage from "@/components/ProductImage";
import NewsCard from "@/components/NewsCard";
import NewsImage from "@/components/NewsImage";
import CookieConsent from "@/components/CookieConsent";
import CategoryStrip from "@/components/CategoryStrip";
import { websiteSchema, itemListSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/config";

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */
export const metadata = {
  title: "PhoneHub — Phone, Laptop, Tablet Specs, Prices & Reviews",
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const BRAND_CATEGORY_ORDER = [
  "Mobile",
  "Laptop",
  "Electronics",
  "Computers",
  "TVs",
  "Auto",
  "Other",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function lowestPrice(p: Product): number {
  if (p.prices && p.prices.length) {
    const valid = p.prices
      .map((pr) => pr.price)
      .filter((v): v is number => v !== null && v > 0);
    if (valid.length) return Math.min(...valid);
  }
  return p.basePrice ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Home() {
  const brands = getAllBrands();
  const news = getAllNews();

  /* ---- Phones only (for guides) ---- */
  const allProducts = getAllProducts();
  const onlyPhones = allProducts.filter(
    (p) => p.category === "phone" || !p.category
  );

  /* ---- Use pre-computed arrays from homepage-data ---- */
  const trending = trendingProducts;
  const popular = popularProducts;
  const latest = latestProducts;

  /* ---- Brands grouped by category ---- */
  const brandsByCategory: Record<string, Brand[]> = {};
  brands.forEach((b) => {
    const cat = b.category || "Other";
    if (!brandsByCategory[cat]) brandsByCategory[cat] = [];
    brandsByCategory[cat].push(b);
  });

  /* ---- Buying guide configs ---- */
  const guideConfigs = [
    {
      title: "Best Under $200",
      desc: "Top value picks that punch above their weight",
      icon: "💰",
      filter: (p: Product) => {
        const price = lowestPrice(p);
        return price > 0 && price <= 200;
      },
      sort: (a: Product, b: Product) => b.rating - a.rating,
    },
    {
      title: "Best Under $500",
      desc: "Premium features without the flagship price tag",
      icon: "⭐",
      filter: (p: Product) => {
        const price = lowestPrice(p);
        return price > 0 && price <= 500;
      },
      sort: (a: Product, b: Product) => b.rating - a.rating,
    },
    {
      title: "Flagship Killers",
      desc: "Top-tier specs that rival any flagship",
      icon: "👑",
      filter: (p: Product) => p.popularity >= 80,
      sort: (a: Product, b: Product) => b.rating - a.rating,
    },
    {
      title: "Camera Kings",
      desc: "For photography enthusiasts and content creators",
      icon: "📸",
      filter: (p: Product) => {
        const cam = (p.quickSpecs && p.quickSpecs.camera) || "";
        const mpMatch = cam.match(/(\d+)\s*MP/);
        return mpMatch && parseInt(mpMatch[1]) >= 48 && p.rating >= 4.0;
      },
      sort: (a: Product, b: Product) => b.rating - a.rating,
    },
    {
      title: "Battery Beasts",
      desc: "All-day power for heavy users",
      icon: "🔋",
      filter: (p: Product) => {
        const bat = (p.quickSpecs && p.quickSpecs.battery) || "";
        const mahMatch = bat.match(/(\d{3,5})\s*mAh/i);
        return mahMatch && parseInt(mahMatch[1]) >= 4500;
      },
      sort: (a: Product, b: Product) => b.rating - a.rating,
    },
  ];

  const guides = guideConfigs
    .map((cfg) => ({
      ...cfg,
      items: onlyPhones.filter(cfg.filter).sort(cfg.sort).slice(0, 5),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* JSON-LD: WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }}
      />

      {/* JSON-LD: Trending Products ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListSchema(
              'Trending Products',
              trending.map((p, i) => ({
                name: p.name,
                url: `${SITE_URL}/phone/${p.id}`,
                position: i + 1,
              }))
            )
          ),
        }}
      />

      {/* ============================================================ */}
      {/*  1. Hero                                                      */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* radial glow bg */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
            Find, compare &amp; decide.
          </h1>
          <p className="text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto">
            The smartest way to research phones, laptops, monitors, cars &amp; more
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-16 pb-16">
        {/* Category Strip — uses the full component with Lucide icons + hover dropdowns */}
        <Suspense fallback={<div className="cat-strip-outer"><div className="cat-strip">Loading categories…</div></div>}>
          <CategoryStrip />
        </Suspense>

        {/* ========================================================== */}
        {/*  2. News & Guides (moved to top)                           */}
        {/* ========================================================== */}
        {news.length > 0 && (() => {
          const featured = news[0];
          const rest = news.slice(1, 9);
          return (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  📰 Latest News &amp; Guides
                </h2>
                <Link
                  href="/news"
                  className="text-sm text-primary hover:underline"
                >
                  More →
                </Link>
              </div>

              {/* Featured article hero card */}
              <a
                href={featured.url}
                target="_blank"
                rel="noopener nofollow"
                className="block mb-6 card bg-base-200 border border-base-300 hover:border-primary transition-all hover:-translate-y-0.5 duration-200 md:flex md:items-stretch md:overflow-hidden"
              >
                <figure className="relative aspect-video md:aspect-auto md:w-80 md:shrink-0 overflow-hidden bg-base-300">
                  <NewsImage src={featured.image} alt={featured.title} />
                </figure>
                <div className="card-body p-5 gap-2 flex-1">
                  <span className="badge badge-outline badge-sm self-start">Featured</span>
                  <h3 className="text-xl font-bold leading-tight">{featured.title}</h3>
                  <p className="text-sm text-base-content/60 line-clamp-3">{featured.excerpt}</p>
                  <div className="flex items-center gap-3 mt-auto text-sm text-base-content/50">
                    <span className="font-medium">{featured.source}</span>
                    <time dateTime={featured.date}>
                      {new Date(featured.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </time>
                  </div>
                </div>
              </a>

              {/* Remaining news cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rest.map((n) => (
                  <NewsCard key={n.id} news={n} />
                ))}
              </div>
            </section>
          );
        })()}

        {/* ========================================================== */}
        {/*  3. Trending Now                                            */}
        {/* ========================================================== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🚀 Trending Now</h2>
            <Link
              href="/search?sort=popularity"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none">
            {trending.map((p) => (
              <div key={p.id} className="w-56 shrink-0 snap-start">
                <PhoneCard product={p} />
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================== */}
        {/*  4. Popular Right Now                                       */}
        {/* ========================================================== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🔥 Popular Right Now</h2>
            <Link
              href="/search?sort=popularity"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popular.map((p) => (
              <PhoneCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ========================================================== */}
        {/*  5. Latest Releases                                         */}
        {/* ========================================================== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🆕 Latest Releases</h2>
            <Link
              href="/search?sort=newest"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {latest.map((p) => (
              <PhoneCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ========================================================== */}
        {/*  6. Browse by Brand                                         */}
        {/* ========================================================== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Browse by Brand</h2>
            <Link
              href="/brands"
              className="text-sm text-primary hover:underline"
            >
              All brands →
            </Link>
          </div>

          <div className="space-y-8">
            {BRAND_CATEGORY_ORDER.map((category) => {
              const catBrands = brandsByCategory[category];
              if (!catBrands || catBrands.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 text-base-content/80">
                    {category}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {catBrands.map((b) => {
                      const count = brandProductCount[b.id] || 0;
                      const isAuto = b.category === "Auto";
                      const href = isAuto
                        ? `/search?brand=${b.id}&cat=auto`
                        : `/search?brand=${b.id}`;
                      const isEmojiLogo = b.logo && (b.logo.startsWith("📱") || b.logo.length <= 4);

                      return (
                        <Link
                          key={b.id}
                          href={href}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-base-200 border border-base-300 hover:border-primary hover:-translate-y-0.5 transition-all"
                        >
                          {/* Logo or monogram */}
                          {!isEmojiLogo && b.logo ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white ring-1 ring-base-300 p-1.5 flex items-center justify-center">
                              <img
                                src={b.logo}
                                alt={b.name}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                              style={{ backgroundColor: b.color || "#5b8cff" }}
                            >
                              {b.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-center line-clamp-1">
                            {b.name}
                          </span>
                          <span className="text-sm text-base-content/50">
                            {count} {count === 1 ? "product" : "products"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================== */}
        {/*  7. Best Picks by Category                                  */}
        {/* ========================================================== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              🏆 Best Picks by Category
            </h2>
            <Link
              href="/search?sort=rating"
              className="text-sm text-primary hover:underline"
            >
              See all rankings →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {guides.map((g) => (
              <div
                key={g.title}
                className="card bg-base-200 border border-base-300"
              >
                <div className="card-body p-5 gap-3">
                  <h3 className="text-lg font-bold">
                    {g.icon} {g.title}
                  </h3>
                  <p className="text-sm text-base-content/60">{g.desc}</p>

                  <div className="flex flex-col gap-2 mt-2">
                    {g.items.map((p) => {
                      // p.image is an absolute URL — never prefix it with /img/
                      const imgFallback = p.fallbackImg
                        ? `/${p.fallbackImg}`
                        : "/img/no-image.svg";
                      return (
                        <Link
                          key={p.id}
                          href={`/phone/${p.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden product-img-bg shrink-0 flex items-center justify-center">
                            <ProductImage
                              src={p.image}
                              alt={p.name}
                              fallback={imgFallback}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">
                              {p.name}
                            </div>
                            <div className="text-sm text-base-content/50">
                              ★ {p.rating.toFixed(1)}
                              {p.basePrice > 0
                                ? ` · $${p.basePrice.toLocaleString()}`
                                : ""}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================== */}
        {/*  8.5 Top 10 Section                                         */}
        {/* ========================================================== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Top 10</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column — Best by Category */}
            <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-3">
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>
                Best by Category
              </h3>
              {[
                { label: "Best Mobiles", href: "/search?cat=phone&sort=rating", icon: "📱" },
                { label: "Best Tablets", href: "/search?cat=tablet&sort=rating", icon: "📲" },
                { label: "Best Laptops", href: "/search?cat=laptop&sort=rating", icon: "💻" },
                { label: "Best TVs", href: "/search?cat=tv&sort=rating", icon: "📺" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors group"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ))}
            </div>

            {/* Right column — Best by Price */}
            <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-3">
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>
                Best Phones by Price
              </h3>
              {[
                { label: "Under $100", href: "/search?cat=phone&maxPrice=100&sort=rating" },
                { label: "Under $150", href: "/search?cat=phone&maxPrice=150&sort=rating" },
                { label: "Under $200", href: "/search?cat=phone&maxPrice=200&sort=rating" },
                { label: "Under $250", href: "/search?cat=phone&maxPrice=250&sort=rating" },
                { label: "Under $300", href: "/search?cat=phone&maxPrice=300&sort=rating" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors group"
                >
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>


      </div>

      {/* ============================================================ */}
      {/*  9. Client Components                                         */}
      {/* ============================================================ */}
      <CookieConsent />
    </>
  );
}
