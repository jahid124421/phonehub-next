import Link from "next/link";
import { Suspense } from "react";
import {
  getAllProducts,
  getAllBrands,
  getAllNews,
  getScoreForProduct,
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
import NewsCard from "@/components/NewsCard";
import NewsImage from "@/components/NewsImage";
import CookieConsent from "@/components/CookieConsent";
import OpenPaletteButton from "@/components/OpenPaletteButton";
import { websiteSchema, itemListSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/config";

export const metadata = {
  title: "PhoneHub — Phone, Laptop, Tablet Specs, Prices & Reviews",
};

const BRAND_CATEGORY_ORDER = [
  "Mobile",
  "Laptop",
  "Electronics",
  "Computers",
  "TVs",
  "Auto",
  "Other",
];

function lowestPrice(p: Product): number {
  if (p.prices && p.prices.length) {
    const valid = p.prices.map((pr) => pr.price).filter((v): v is number => v !== null && v > 0);
    if (valid.length) return Math.min(...valid);
  }
  return p.basePrice ?? 0;
}

function productImg(p: Product): string {
  if (p.image) return `/img/${p.image}`;
  if (p.fallbackImg) return `/${p.fallbackImg}`;
  return "/img/no-image.svg";
}

export default function Home() {
  const brands = getAllBrands();
  const news = getAllNews();
  const allProducts = getAllProducts();
  const onlyPhones = allProducts.filter((p) => p.category === "phone" || !p.category);

  const trending = trendingProducts;
  const popular = popularProducts;
  const latest = latestProducts;

  // Explorer counts
  const catCount = new Map<string, number>();
  for (const p of allProducts) catCount.set(p.category, (catCount.get(p.category) || 0) + 1);

  const brandsByCategory: Record<string, Brand[]> = {};
  brands.forEach((b) => {
    const cat = b.category || "Other";
    if (!brandsByCategory[cat]) brandsByCategory[cat] = [];
    brandsByCategory[cat].push(b);
  });

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

  // VS strip picks — first two trending
  const vsA = trending[0];
  const vsB = trending[1] || popular[0];
  const vsScoreA = vsA ? getScoreForProduct(vsA.id) : null;
  const vsScoreB = vsB ? getScoreForProduct(vsB.id) : null;

  const explorerGroups = [
    {
      title: "Mobile Devices",
      icon: "📱",
      items: [
        { label: "Smartphones", cat: "phone" },
        { label: "Tablets", cat: "tablet" },
        { label: "Smartwatches", cat: "smartwatch" },
        { label: "E-readers", cat: "ereader" },
      ],
    },
    {
      title: "Computers & Accessories",
      icon: "💻",
      items: [
        { label: "Laptops", cat: "laptop" },
        { label: "Monitors", cat: "monitor" },
        { label: "Routers", cat: "router" },
        { label: "Auto", cat: "auto" },
      ],
    },
    {
      title: "Photo & Video",
      icon: "📷",
      items: [
        { label: "Cameras", cat: "camera" },
        { label: "TVs", cat: "tv" },
        { label: "Drones", cat: "drone" },
        { label: "Projectors", cat: "projector" },
      ],
    },
    {
      title: "Audio & More",
      icon: "🎧",
      items: [
        { label: "Headphones", cat: "headphone" },
        { label: "Speakers", cat: "speaker" },
        { label: "Wearables", cat: "wearable" },
        { label: "Accessories", cat: "accessory" },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListSchema(
              "Trending Products",
              trending.map((p, i) => ({
                name: p.name,
                url: `${SITE_URL}/phone/${p.id}`,
                position: i + 1,
              }))
            )
          ),
        }}
      />

      {/* ================================================================ */}
      {/*  Noir v2 Hero — centered Versus-beater                             */}
      {/* ================================================================ */}
      <section className="noir-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]" />
        </div>
        <h1>
          Compare everything.
          <br />
          <em>Know the winner.</em>
        </h1>
        <p className="noir-sub">
          Versus shows a wall of specs. PhoneHub shows <b style={{ color: "var(--text)" }}>why one wins for you</b> — 6-axis PhoneHub Score, row-level verdicts, and editorial picks. {allProducts.length.toLocaleString()} devices, 486 pages, zero pay-to-rank.
        </p>

        <div className="noir-proof">
          <span>
            <b>{allProducts.length.toLocaleString()}</b> devices
          </span>
          <span>·</span>
          <span>
            <b>486</b> pages
          </span>
          <span>·</span>
          <span>
            <b>{brands.length}</b> brands
          </span>
          <span>·</span>
          <span>
            <b>6</b>-axis score
          </span>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              background: "var(--bg)",
              border: "1px solid var(--border-2)",
              marginLeft: 6,
            }}
          >
            No ads · Independent
          </span>
        </div>

        {/* VS strip — editorial anchor */}
        {vsA && vsB && (
          <div className="noir-vs">
            <Link href={`/phone/${vsA.id}`} className="noir-vs-card">
              <img src={productImg(vsA)} alt={vsA.name} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vsA.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Score {vsScoreA?.total ?? "—"} · {vsA.basePrice > 0 ? `$${vsA.basePrice.toLocaleString()}` : "Check price"}
                </div>
              </div>
              <span style={{ color: "var(--primary)", fontWeight: 900 }}>→</span>
            </Link>
            <div className="noir-vs-mid">VS</div>
            <Link href={`/phone/${vsB.id}`} className="noir-vs-card">
              <img src={productImg(vsB)} alt={vsB.name} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vsB.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Score {vsScoreB?.total ?? "—"} · {vsB.basePrice > 0 ? `$${vsB.basePrice.toLocaleString()}` : "Check price"}
                </div>
              </div>
              <span style={{ color: "var(--primary)", fontWeight: 900 }}>→</span>
            </Link>
          </div>
        )}

        {/* Center search — falls back to /search */}
        <form action="/search" method="get" className="noir-center-search" style={{ position: "relative" }}>
          <input name="q" placeholder="Type here to compare — e.g. ‘S24 Ultra vs iPhone 17e’ or ‘best battery under $400’" aria-label="Search and compare" />
          <button type="submit">Compare →</button>
        </form>
        <div className="noir-tabs">
          <Link href="/compare" className="noir-tab active">
            Compare
          </Link>
          <Link href="/ai-finder" className="noir-tab">
            Ask AI — &ldquo;best camera &lt; $500&rdquo;
          </Link>
          <OpenPaletteButton className="noir-tab">⌘ K Palette</OpenPaletteButton>
        </div>
      </section>

      {/* Beats — 4 reasons Noir beats Versus */}
      <div className="noir-beats">
        <div className="noir-beat">
          <b>Clarity over clutter</b>
          <p>Versus dumps 100+ categories in a mega-menu. We group into 4 logical worlds — instantly scannable.</p>
          <div className="vs">Versus: deep mega-menu → We: 4-column explorer</div>
          <div className="win">✓ Faster to find</div>
        </div>
        <div className="noir-beat">
          <b>Decision, not data</b>
          <p>Versus lists specs. We score 6 dimensions and mark row winners ✓ — you decide in 30s.</p>
          <div className="vs">Versus: spec table → We: verdict + score</div>
          <div className="win">✓ Know why it wins</div>
        </div>
        <div className="noir-beat">
          <b>Editorial trust</b>
          <p>Versus is automated. We add Editor&rsquo;s choice / Best value / Battery pick + methodology.</p>
          <div className="vs">Versus: no curation → We: editorial system</div>
          <div className="win">✓ Feels expert</div>
        </div>
        <div className="noir-beat">
          <b>Speed &amp; craft</b>
          <p>Versus reloads pages. We use instant palette (Ctrl+K), tray compare, Noir polish.</p>
          <div className="vs">Versus: page nav → We: instant overlay</div>
          <div className="win">✓ 2× faster</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Explorer — organized vs Versus mega-menu */}
        <section className="noir-section">
          <div className="noir-section-head">
            <div>
              <div className="noir-kicker">Catalog</div>
              <h2 className="noir-title">Explore — 100+ categories, organized</h2>
              <div className="noir-title-sub">Versus breadth, human-grouped into 4 worlds.</div>
            </div>
            <Link href="/search" className="noir-viewall">See all categories →</Link>
          </div>
          <div className="noir-explorer">
            <div className="noir-cat-grid">
              {explorerGroups.map((g) => (
                <div key={g.title} className="noir-cgroup">
                  <h3>
                    {g.icon} {g.title}
                  </h3>
                  <ul>
                    {g.items.map((it) => {
                      const c = catCount.get(it.cat) || 0;
                      return (
                        <li key={it.cat}>
                          <Link href={`/search?cat=${it.cat}`}>
                            <span>{it.label}</span>
                            <small>{c ? c.toString() : "—"}</small>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderTop: "1px solid var(--border-2)",
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <span>
                Tip: tap a category to filter — or{" "}
                <OpenPaletteButton style={{ color: "var(--primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  type to compare
                </OpenPaletteButton>
                .
              </span>
              <span style={{ fontSize: 11 }}>Versus has 106 categories — PhoneHub mirrors them but grouped for humans.</span>
            </div>
          </div>
        </section>

        {/* Trending — one calm snap row, not a carousel shouting "sale" */}
        <section className="noir-section">
          <div className="noir-section-head">
            <div>
              <div className="noir-kicker">Now</div>
              <h2 className="noir-title">Trending</h2>
              <div className="noir-title-sub">What people compare most this week.</div>
            </div>
            <Link href="/search?sort=popularity" className="noir-viewall">View all →</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2" style={{ scrollbarWidth: "none" } as any}>
            {trending.map((p) => (
              <div key={p.id} className="w-56 shrink-0 snap-start">
                <PhoneCard product={p} score={getScoreForProduct(p.id)} />
              </div>
            ))}
          </div>
        </section>

        {/* Popular + Latest — paired, shared rhythm */}
        <section className="noir-section">
          <div className="noir-section-head">
            <div>
              <div className="noir-kicker">Discovery</div>
              <h2 className="noir-title">Popular &amp; Latest</h2>
              <div className="noir-title-sub">Most chosen and most recent — pick your lane.</div>
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-extrabold tracking-wide uppercase" style={{ color: "var(--muted)" }}>Popular Right Now</h3>
                <Link href="/search?sort=popularity" className="noir-viewall">View all →</Link>
              </div>
              <div className="noir-grid-4">
                {popular.slice(0, 8).map((p) => (
                  <PhoneCard key={p.id} product={p} score={getScoreForProduct(p.id)} />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-extrabold tracking-wide uppercase" style={{ color: "var(--muted)" }}>Latest Releases</h3>
                <Link href="/search?sort=newest" className="noir-viewall">View all →</Link>
              </div>
              <div className="noir-grid-4">
                {latest.slice(0, 8).map((p) => (
                  <PhoneCard key={p.id} product={p} score={getScoreForProduct(p.id)} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* News — editorial, not blog spam */}
        {news.length > 0 &&
          (() => {
            const featured = news[0];
            const rest = news.slice(1, 9);
            return (
              <section className="noir-section">
                <div className="noir-section-head">
                  <div>
                    <div className="noir-kicker">Editorial</div>
                    <h2 className="noir-title">News &amp; Guides</h2>
                    <div className="noir-title-sub">Hands-on takes, not press releases.</div>
                  </div>
                  <Link href="/news" className="noir-viewall">More →</Link>
                </div>
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
                      <time dateTime={featured.date}>{new Date(featured.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
                    </div>
                  </div>
                </a>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {rest.map((n) => (
                    <NewsCard key={n.id} news={n} />
                  ))}
                </div>
              </section>
            );
          })()}

        {/* Brands — curated: top 24 by product count, full atlas on /brands */}
        <section className="noir-section">
          <div className="noir-section-head">
            <div>
              <div className="noir-kicker">Brands</div>
              <h2 className="noir-title">Browse by Brand</h2>
              <div className="noir-title-sub">Jump to a maker — full 222-brand atlas inside.</div>
            </div>
            <Link href="/brands" className="noir-viewall">All {brands.length} brands →</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {[...brands]
              .sort((a, b) => (brandProductCount[b.id] || 0) - (brandProductCount[a.id] || 0))
              .slice(0, 24)
              .map((b) => {
                const count = brandProductCount[b.id] || 0;
                const isAuto = b.category === "Auto";
                const href = isAuto ? `/search?brand=${b.id}&cat=auto` : `/search?brand=${b.id}`;
                const isEmojiLogo = b.logo && (b.logo.startsWith("📱") || b.logo.length <= 4);
                return (
                  <Link
                    key={b.id}
                    href={href}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-base-200 border border-base-300 hover:border-primary hover:-translate-y-0.5 transition-all"
                    title={`${b.name} — ${count} products`}
                  >
                    {!isEmojiLogo && b.logo ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white ring-1 ring-base-300 p-1.5 flex items-center justify-center shrink-0">
                        <img src={b.logo} alt={b.name} className="w-full h-full object-contain" loading="lazy" style={{ filter: "none" }} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: b.color || "#5b8cff" }}>
                        {b.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-center line-clamp-1 w-full" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                    <span className="text-xs text-base-content/50">{count} products</span>
                  </Link>
                );
              })}
          </div>
          <div className="text-center mt-3">
            <Link href="/brands" className="text-xs font-semibold px-3 py-1.5 rounded-full border border-base-300 hover:border-primary transition-colors" style={{ color: "var(--muted)" }}>
              View full brand atlas — {brands.length} brands by category →
            </Link>
          </div>
        </section>

        {/* Best Picks */}
        <section className="noir-section">
          <div className="noir-section-head">
            <div>
              <div className="noir-kicker">Curated</div>
              <h2 className="noir-title">Best Picks by Category</h2>
              <div className="noir-title-sub">Expert cuts — not just highest-rated.</div>
            </div>
            <Link href="/search?sort=rating" className="noir-viewall">See all rankings →</Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {guides.map((g) => (
              <div key={g.title} className="card bg-base-200 border border-base-300">
                <div className="card-body p-5 gap-3">
                  <h3 className="text-lg font-bold">
                    {g.icon} {g.title}
                  </h3>
                  <p className="text-sm text-base-content/60">{g.desc}</p>
                  <div className="flex flex-col gap-2 mt-2">
                    {g.items.map((p) => {
                      const imgSrc = p.image ? `/img/${p.image}` : p.fallbackImg ? `/${p.fallbackImg}` : "/img/no-image.svg";
                      return (
                        <Link key={p.id} href={`/phone/${p.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300 transition-colors">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-base-300 shrink-0 flex items-center justify-center">
                            <img src={imgSrc} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-sm text-base-content/50">
                              ★ {p.rating.toFixed(1)}
                              {p.basePrice > 0 ? ` · $${p.basePrice.toLocaleString()}` : ""}
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

        {/* Top 10 */}
        <section className="noir-section">
          <div className="noir-section-head">
            <div>
              <div className="noir-kicker">Rankings</div>
              <h2 className="noir-title">Top 10</h2>
              <div className="noir-title-sub">Fast shortcuts to the best lists.</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
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
                <Link key={item.label} href={item.href} className="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors group">
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ))}
            </div>
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
                <Link key={item.label} href={item.href} className="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors group">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="noir-divider" style={{ marginTop: 44 }} />
        {/* Methodology — Noir editorial trust */}
        <section className="noir-section noir-method">
          <div>
            <div style={{ fontWeight: 900, color: "var(--text)" }}>How PhoneHub beats a spec dump</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
              Every device gets a 6-axis PhoneHub Score (Display · Camera · Performance · Battery · Build · Value). Comparisons highlight the winner per row and a one-line verdict — so Versus-style raw tables become decisions you can make in 30 seconds.
            </div>
            <div className="noir-kpi">
              <div>
                <b>6</b>
                <span>Axes</span>
              </div>
              <div>
                <b>0</b>
                <span>Pay-to-rank</span>
              </div>
              <div>
                <b>30s</b>
                <span>To decide</span>
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/guides" style={{ fontSize: 11, padding: "6px 10px", borderRadius: 999, background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--muted)" }}>
                Score methodology →
              </Link>
              <Link href="/news" style={{ fontSize: 11, padding: "6px 10px", borderRadius: 999, background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--muted)" }}>
                Editorial process →
              </Link>
            </div>
          </div>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border-2)", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>Live vs example</div>
            {vsA && vsB && (
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 10, textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{vsA.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {vsScoreA?.total ?? "—"} · {vsA.basePrice > 0 ? `$${vsA.basePrice.toLocaleString()}` : "—"}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--accent)", fontWeight: 800 }}>Winner: Display ✓</div>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 10, textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{vsB.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {vsScoreB?.total ?? "—"} · {vsB.basePrice > 0 ? `$${vsB.basePrice.toLocaleString()}` : "—"}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--accent)", fontWeight: 800 }}>Winner: Value ✓</div>
                </div>
              </div>
            )}
            <Link href="/compare" className="btn btn-primary" style={{ width: "100%", marginTop: 10, display: "flex", justifyContent: "center" }}>
              See full comparison →
            </Link>
          </div>
        </section>
      </div>

      <CookieConsent />
    </>
  );
}
