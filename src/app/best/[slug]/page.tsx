import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import ProductImage from "@/components/ProductImage";
import ScoreBadge from "@/components/ScoreBadge";
import {
  getAllBestPages,
  getBestPage,
  getBestPageProducts,
  type BestPageDef,
  type PhoneWithSpecs,
} from "@/lib/best-pages";
import { breadcrumbSchema, itemListSchema } from "@/lib/schema";
import {
  bestPageFaqs,
  listHighlights,
  methodologyParagraphs,
  rankBlurb,
} from "@/lib/best-copy";

// ─── SSG + ISR config ────────────────────────────────────────────────────────
export const dynamic = "force-static";
export const revalidate = 86400; // daily

export function generateStaticParams() {
  return getAllBestPages().map((def) => ({ slug: def.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const def = getBestPage(slug);
  if (!def) return {};

  return {
    title: `${def.title} (2026)`,
    description: def.description,
    alternates: { canonical: `/best/${def.slug}` },
    openGraph: {
      type: "website",
      title: `${def.title} — PhoneHub`,
      description: def.description,
    },
  };
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
function keySpecsLine(phone: PhoneWithSpecs): string {
  const fs = phone.filterSpecs;
  const parts: string[] = [];
  if (fs.displaySize) {
    parts.push(
      `${fs.displaySize}"${fs.refreshRate ? ` ${fs.refreshRate}Hz` : ""}`
    );
  }
  if (fs.chipset) parts.push(fs.chipset);
  if (fs.mainCameraMP) parts.push(`${fs.mainCameraMP}MP camera`);
  if (fs.batteryCapacity) parts.push(`${fs.batteryCapacity.toLocaleString()} mAh`);
  return parts.join(" · ");
}

function relatedPages(current: BestPageDef): BestPageDef[] {
  return getAllBestPages()
    .filter((d) => d.slug !== current.slug)
    .slice(0, 6);
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function BestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const def = getBestPage(slug);
  if (!def) notFound();

  const ranked = getBestPageProducts(def);
  if (ranked.length === 0) notFound();

  const top3 = ranked.slice(0, 3);
  const compareUrl = `/compare?ids=${top3.map((r) => r.phone.id).join(",")}`;

  // Data-derived unique content: stats from this exact ranked set, FAQs and
  // ranking methodology — so each buying guide reads differently.
  const highlights = listHighlights(ranked, def.scoreKey);
  const faqs = bestPageFaqs(def, ranked);
  const methodology = methodologyParagraphs(def.scoreKey);

  const jsonLd = [
    itemListSchema(
      def.title,
      ranked.map((r) => ({
        id: r.phone.id,
        name: r.phone.name,
      }))
    ),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Best", url: `/best/${def.slug}` },
      { name: def.title, url: `/best/${def.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Best Phones" },
          { label: def.title },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold">{def.title}</h1>
        {def.intro.map((paragraph, i) => (
          <p key={i} className="text-base-content/70 max-w-3xl">
            {paragraph}
          </p>
        ))}
        <div className="pt-1">
          <Link href={compareUrl} className="btn btn-primary btn-sm">
            Compare the top {top3.length} picks
          </Link>
        </div>
      </header>

      {/* Standout stats for this exact ranked set */}
      {highlights.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {highlights.map((h) => (
            <div
              key={h.label}
              className="card bg-base-200 border border-base-300 p-3 text-center"
            >
              <div className="text-xs uppercase tracking-wide text-base-content/50">
                {h.label}
              </div>
              <div className="font-semibold truncate">{h.name}</div>
              <div className="text-primary font-bold">{h.detail}</div>
            </div>
          ))}
        </section>
      )}

      <ol className="space-y-4">
        {ranked.map(({ phone, score }, index) => {
          const fallback = phone.fallbackImg
            ? `/${phone.fallbackImg}`
            : "/img/no-image.svg";
          const blurb = rankBlurb(ranked, index, def.scoreKey);
          return (
            <li
              key={phone.id}
              className="card bg-base-200 border border-base-300 hover:border-primary transition-colors"
            >
              <div className="card-body p-4 md:p-5 flex-row gap-4 items-start">
                {/* Rank */}
                <div className="flex flex-col items-center shrink-0 w-10 pt-1">
                  <span
                    className={`text-2xl font-black ${
                      index < 3 ? "text-primary" : "text-base-content/40"
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Image */}
                <Link
                  href={`/phone/${phone.id}`}
                  className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg bg-base-300 overflow-hidden"
                >
                  <ProductImage
                    src={phone.image}
                    alt={phone.name}
                    fallback={fallback}
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold leading-snug">
                      <Link
                        href={`/phone/${phone.id}`}
                        className="hover:text-primary"
                      >
                        {phone.name}
                      </Link>
                    </h2>
                    <div className="flex items-center gap-3">
                      {score && <ScoreBadge score={score} size="compact" />}
                      {phone.basePrice > 0 && (
                        <span className="text-lg font-bold text-primary">
                          ${phone.basePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-base-content/60">
                    {keySpecsLine(phone)}
                  </p>

                  {blurb && (
                    <p className="text-sm text-base-content/80">{blurb}</p>
                  )}

                  {phone.pros.length > 0 && (
                    <ul className="text-sm text-base-content/70 space-y-0.5">
                      {phone.pros.slice(0, 2).map((pro, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-success">+</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-1">
                    <Link
                      href={`/phone/${phone.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Full specs &amp; review →
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Ranking methodology */}
      <section className="space-y-3 pt-4 border-t border-base-300">
        <h2 className="text-xl font-semibold">How we ranked this list</h2>
        {methodology.map((paragraph, i) => (
          <p key={i} className="text-base-content/70 max-w-3xl">
            {paragraph}
          </p>
        ))}
      </section>

      {/* FAQ (visible, mirrors JSON-LD) */}
      {faqs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="collapse collapse-arrow bg-base-200 border border-base-300"
              >
                <input type="checkbox" />
                <div className="collapse-title font-medium">{f.q}</div>
                <div className="collapse-content text-base-content/70">
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Internal linking */}
      <section className="space-y-3 pt-4 border-t border-base-300">
        <h2 className="text-xl font-semibold">More buying guides</h2>
        <div className="flex flex-wrap gap-2">
          {relatedPages(def).map((d) => (
            <Link
              key={d.slug}
              href={`/best/${d.slug}`}
              className="btn btn-outline btn-sm"
            >
              {d.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
