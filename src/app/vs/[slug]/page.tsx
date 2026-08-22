import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPhoneProducts,
  getProductById,
  getFilterSpecsForProduct,
  getSpecsForProduct,
  getScoreForProduct,
  type FilterSpecs,
  type Product,
} from "@/lib/data";
import Breadcrumb from "@/components/Breadcrumb";
import ProductImage from "@/components/ProductImage";
import { breadcrumbSchema } from "@/lib/schema";
import {
  computeUseCaseVerdicts,
  type ScoresMap,
  type SpecsMap,
} from "@/lib/compare-verdict";
import {
  buildCameraFaq,
  buildDisplayFaq,
  buildIntro,
  buildMetaDescription,
  isDataRich,
  keyDifferences,
  type VsCopyRow,
} from "@/lib/vs-copy";

// ─── SSG + ISR config ────────────────────────────────────────────────────────
export const revalidate = 86400; // daily
export const dynamicParams = true; // on-demand ISR for non-prebuilt pairs

const TOP_PRODUCTS = 25;
const PAIRS_PER_PRODUCT = 12;

/** Slugs pre-built at build time (~220 pairs from the 25 most-reviewed phones). */
export function getStaticVsSlugs(): string[] {
  // Dedupe by id first — source data contains a few duplicate ids
  const byId = new Map<string, (Product & { filterSpecs: FilterSpecs })>();
  for (const p of getPhoneProducts()) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  const phones = [...byId.values()]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, TOP_PRODUCTS);

  const seen = new Set<string>();
  const slugs: string[] = [];
  phones.forEach((a, i) => {
    const last = Math.min(i + PAIRS_PER_PRODUCT, phones.length - 1);
    for (let j = i + 1; j <= last; j++) {
      const b = phones[j];
      const key = [a.id, b.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      slugs.push(`${a.id}-vs-${b.id}`);
    }
  });
  return slugs;
}

export function generateStaticParams() {
  return getStaticVsSlugs().map((slug) => ({ slug }));
}

// ─── slug parsing ────────────────────────────────────────────────────────────
function parseVsSlug(slug: string): [string, string] | null {
  const idx = slug.indexOf("-vs-");
  if (idx <= 0 || idx + 4 >= slug.length) return null;
  return [slug.slice(0, idx), slug.slice(idx + 4)];
}

function getPair(slug: string): [Product, Product] | null {
  const ids = parseVsSlug(slug);
  if (!ids) return null;
  const a = getProductById(ids[0]);
  const b = getProductById(ids[1]);
  if (!a || !b || a.id === b.id) return null;
  return [a, b];
}

// ─── metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pair = getPair(slug);
  if (!pair) return {};
  const [a, b] = pair;
  const fa = getFilterSpecsForProduct(a.id);
  const fb = getFilterSpecsForProduct(b.id);
  const rows = buildRows(a, b, fa, fb);
  const aWins = rows.filter((r) => r.winner === "a").length;
  const bWins = rows.filter((r) => r.winner === "b").length;
  const winner: Winner = aWins === bWins ? "tie" : aWins > bWins ? "a" : "b";
  const description = buildMetaDescription(
    a,
    b,
    winner,
    aWins,
    bWins,
    keyDifferences(rows, a, b, 2)
  );

  return {
    title: `${a.name} vs ${b.name}: Which Should You Buy?`,
    description,
    alternates: { canonical: `/vs/${slug}` },
    openGraph: {
      type: "website",
      title: `${a.name} vs ${b.name} — PhoneHub`,
      description,
    },
  };
}

// ─── comparison logic ────────────────────────────────────────────────────────
type Winner = "a" | "b" | "tie" | null;

// Rows carry their raw numeric values so the narrative builders in vs-copy
// can quantify each gap ("40% larger battery"), not just restate the table.
type VsRow = VsCopyRow;

function compareNumeric(
  label: string,
  aVal: number | null,
  bVal: number | null,
  higherIsBetter: boolean,
  format: (v: number) => string
): VsRow {
  const aText = aVal !== null ? format(aVal) : "—";
  const bText = bVal !== null ? format(bVal) : "—";
  let winner: Winner = null;
  if (aVal !== null && bVal !== null) {
    if (aVal === bVal) winner = "tie";
    else if (higherIsBetter) winner = aVal > bVal ? "a" : "b";
    else winner = aVal < bVal ? "a" : "b";
  }
  return {
    label,
    aText,
    bText,
    winner,
    aNum: aVal,
    bNum: bVal,
    isBool: false,
    lowerIsBetter: !higherIsBetter,
  };
}

function textRow(label: string, aText: string | null, bText: string | null): VsRow {
  return {
    label,
    aText: aText || "—",
    bText: bText || "—",
    winner: null,
    aNum: null,
    bNum: null,
    isBool: false,
    lowerIsBetter: false,
  };
}

function boolRow(label: string, aVal: boolean, bVal: boolean, trustworthy = true): VsRow {
  let winner: Winner = null;
  if (aVal !== bVal) winner = aVal ? "a" : "b";
  return {
    label,
    aText: aVal ? "Yes" : "No",
    bText: bVal ? "Yes" : "No",
    winner,
    aNum: null,
    bNum: null,
    isBool: true,
    boolTrustworthy: trustworthy,
    lowerIsBetter: false,
  };
}

function maxOf(nums: number[]): number | null {
  return nums.length ? Math.max(...nums) : null;
}

function buildRows(a: Product, b: Product, fa: FilterSpecs | null, fb: FilterSpecs | null): VsRow[] {
  const priceA = fa?.price ?? (a.basePrice > 0 ? a.basePrice : null);
  const priceB = fb?.price ?? (b.basePrice > 0 ? b.basePrice : null);
  // Bool rows conflate "absent" with "not parsed" — narrative claims based on
  // them are only safe when both phones have fully-enriched spec data.
  const rich = isDataRich(fa) && isDataRich(fb);

  return [
    compareNumeric("Launch price", priceA, priceB, false, (v) => `$${v.toLocaleString()}`),
    compareNumeric("Battery capacity", fa?.batteryCapacity ?? null, fb?.batteryCapacity ?? null, true, (v) => `${v.toLocaleString()} mAh`),
    compareNumeric("Charging speed", fa?.chargingWatt ?? null, fb?.chargingWatt ?? null, true, (v) => `${v}W`),
    boolRow("Wireless charging", fa?.wirelessCharging ?? false, fb?.wirelessCharging ?? false, rich),
    compareNumeric("Main camera", fa?.mainCameraMP ?? null, fb?.mainCameraMP ?? null, true, (v) => `${v} MP`),
    boolRow("Telephoto lens", fa?.telephoto ?? false, fb?.telephoto ?? false, rich),
    boolRow("Optical stabilization", fa?.ois ?? false, fb?.ois ?? false, rich),
    compareNumeric("Display size", fa?.displaySize ?? null, fb?.displaySize ?? null, true, (v) => `${v}"`),
    compareNumeric("Refresh rate", fa?.refreshRate ?? null, fb?.refreshRate ?? null, true, (v) => `${v} Hz`),
    compareNumeric("Peak brightness", fa?.brightnessNits ?? null, fb?.brightnessNits ?? null, true, (v) => `${v.toLocaleString()} nits`),
    compareNumeric("Max RAM", fa ? maxOf(fa.ram) : null, fb ? maxOf(fb.ram) : null, true, (v) => `${v} GB`),
    compareNumeric("Max storage", fa ? maxOf(fa.storage) : null, fb ? maxOf(fb.storage) : null, true, (v) => (v >= 1024 ? `${v / 1024} TB` : `${v} GB`)),
    compareNumeric("Weight", fa?.weight ?? null, fb?.weight ?? null, false, (v) => `${v} g`),
    textRow("Chipset", fa?.chipset ?? null, fb?.chipset ?? null),
    textRow("Water resistance", fa?.ipRating ?? null, fb?.ipRating ?? null),
    textRow("Operating system", fa?.os ?? null, fb?.os ?? null),
  ];
}

function parseRelease(date: string): number {
  const t = Date.parse(date.replace(/^Released\s+/i, ""));
  return isNaN(t) ? 0 : t;
}

// ─── page ────────────────────────────────────────────────────────────────────
export default async function VsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pair = getPair(slug);
  if (!pair) notFound();
  const [a, b] = pair;

  const fa = getFilterSpecsForProduct(a.id);
  const fb = getFilterSpecsForProduct(b.id);
  const rows = buildRows(a, b, fa, fb);

  const aWins = rows.filter((r) => r.winner === "a").length;
  const bWins = rows.filter((r) => r.winner === "b").length;
  const winner: Winner = aWins === bWins ? "tie" : aWins > bWins ? "a" : "b";
  const winnerProduct = winner === "a" ? a : winner === "b" ? b : null;

  const priceA = fa?.price ?? (a.basePrice > 0 ? a.basePrice : null);
  const priceB = fb?.price ?? (b.basePrice > 0 ? b.basePrice : null);
  const battA = fa?.batteryCapacity ?? null;
  const battB = fb?.batteryCapacity ?? null;
  const dateA = parseRelease(a.releaseDate);
  const dateB = parseRelease(b.releaseDate);

  // ── FAQ content ──
  const priceAnswer =
    priceA !== null && priceB !== null
      ? priceA === priceB
        ? `Both launched at $${priceA.toLocaleString()}, so there is no price difference between the ${a.name} and the ${b.name}.`
        : `The ${priceA < priceB ? a.name : b.name} is cheaper: it launched at $${Math.min(priceA, priceB).toLocaleString()} versus $${Math.max(priceA, priceB).toLocaleString()} for the ${priceA < priceB ? b.name : a.name} — a difference of $${Math.abs(priceA - priceB).toLocaleString()}.`
      : `We don't have complete launch pricing for both phones, so we can't give an exact difference. Check the linked product pages for current prices.`;

  const relA = a.releaseDate.replace(/^Released\s+/i, "").trim();
  const relB = b.releaseDate.replace(/^Released\s+/i, "").trim();
  const newerAnswer =
    dateA && dateB
      ? dateA === dateB
        ? `Both phones were released around the same time (${a.releaseDate.replace(/^Released\s+/i, "")}).`
        : `The ${dateA > dateB ? a.name : b.name} is newer — it was released ${(dateA > dateB ? a : b).releaseDate.replace(/^Released\s+/i, "")}, while the ${dateA > dateB ? b.name : a.name} launched ${(dateA > dateB ? b : a).releaseDate.replace(/^Released\s+/i, "")}.`
      : relA && relB
        ? `Release timing: ${a.name} — ${relA}; ${b.name} — ${relB}.`
        : `We don't have complete release date information for both phones. Check the linked product pages for launch details.`;

  const batteryAnswer =
    battA !== null && battB !== null
      ? battA === battB
        ? `Both phones have the same ${battA.toLocaleString()} mAh battery, so real-world endurance should be comparable.`
        : `The ${battA > battB ? a.name : b.name} has the larger battery at ${Math.max(battA, battB).toLocaleString()} mAh, versus ${Math.min(battA, battB).toLocaleString()} mAh in the ${battA > battB ? b.name : a.name} — an advantage of ${Math.abs(battA - battB).toLocaleString()} mAh, which typically translates to longer screen-on time.`
      : `We don't have complete battery capacity data for both phones. Check the full spec pages linked below for details.`;

  const cameraFaq = buildCameraFaq(a, b, fa, fb);
  const displayFaq = buildDisplayFaq(a, b, fa, fb);
  const faqs = [
    { q: `Is the ${a.name} cheaper than the ${b.name}?`, a: priceAnswer },
    { q: `Which is newer, the ${a.name} or the ${b.name}?`, a: newerAnswer },
    { q: `Which has better battery life, the ${a.name} or the ${b.name}?`, a: batteryAnswer },
    ...(cameraFaq ? [cameraFaq] : []),
    ...(displayFaq ? [displayFaq] : []),
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Versus", url: `/vs/${slug}` },
    { name: `${a.name} vs ${b.name}`, url: `/vs/${slug}` },
  ]);

  const diffs = keyDifferences(rows, a, b);

  // Use-case verdicts reuse the compare engine's analysis — per-pair, data-derived.
  const specsMap: SpecsMap = {};
  const specsA = getSpecsForProduct(a.id);
  const specsB = getSpecsForProduct(b.id);
  if (specsA) specsMap[a.id] = specsA;
  if (specsB) specsMap[b.id] = specsB;
  const scoresMap: ScoresMap = {};
  const scoreA = getScoreForProduct(a.id);
  const scoreB = getScoreForProduct(b.id);
  if (scoreA) scoresMap[a.id] = scoreA;
  if (scoreB) scoresMap[b.id] = scoreB;
  const useCaseVerdicts = computeUseCaseVerdicts([a, b], specsMap, scoresMap);

  const verdictText =
    winnerProduct === null
      ? `This one is genuinely close — the ${a.name} and ${b.name} each win ${aWins} of the comparable spec categories. Your decision should come down to price and which ecosystem you prefer.`
      : `Based on the specs, the ${winnerProduct.name} takes this head-to-head, winning ${Math.max(aWins, bWins)} of ${aWins + bWins} comparable categories. The ${winnerProduct.id === a.id ? b.name : a.name} still fights back${winnerProduct.id === a.id ? (bWins > 0 ? ` with ${bWins} category win${bWins > 1 ? "s" : ""}` : "") : aWins > 0 ? ` with ${aWins} category win${aWins > 1 ? "s" : ""}` : ""}, so check the table below for the details that matter to you.`;

  const cellClass = (row: VsRow, side: "a" | "b") =>
    row.winner === side ? "bg-success/15 font-semibold" : "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Versus" },
          { label: `${a.name} vs ${b.name}` },
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">
          {a.name} vs {b.name}
        </h1>
        <p className="text-base-content/70">{buildIntro(a, b, fa, fb)}</p>
      </header>

      {/* Product headers */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { p: a, isWinner: winner === "a" },
          { p: b, isWinner: winner === "b" },
        ].map(({ p, isWinner }) => (
          <div
            key={p.id}
            className={`card bg-base-200 border ${
              isWinner ? "border-success" : "border-base-300"
            }`}
          >
            <div className="card-body p-4 items-center text-center gap-2">
              {isWinner && (
                <span className="badge badge-success badge-sm">Our pick</span>
              )}
              <Link
                href={`/phone/${p.id}`}
                className="relative w-24 h-24 rounded-lg product-img-bg overflow-hidden"
              >
                <ProductImage
                  src={p.image}
                  alt={p.name}
                  fallback={p.fallbackImg ? `/${p.fallbackImg}` : "/img/no-image.svg"}
                />
              </Link>
              <h2 className="font-semibold leading-snug">
                <Link href={`/phone/${p.id}`} className="hover:text-primary">
                  {p.name}
                </Link>
              </h2>
              {p.basePrice > 0 && (
                <span className="text-primary font-bold">
                  ${p.basePrice.toLocaleString()}
                </span>
              )}
              <Link
                href={`/phone/${p.id}`}
                className="text-sm text-primary hover:underline"
              >
                Full specs →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Verdict */}
      <section className="card bg-base-200 border border-base-300">
        <div className="card-body p-5 space-y-2">
          <h2 className="text-xl font-semibold">Verdict</h2>
          <p className="text-base-content/80">{verdictText}</p>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link href={`/compare?ids=${a.id},${b.id}`} className="btn btn-primary btn-sm">
              Full comparison
            </Link>
            <Link href={`/phone/${a.id}`} className="btn btn-outline btn-sm">
              {a.name} details
            </Link>
            <Link href={`/phone/${b.id}`} className="btn btn-outline btn-sm">
              {b.name} details
            </Link>
          </div>
        </div>
      </section>

      {/* Key differences — the narrative summary of the table below */}
      {diffs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Key differences</h2>
          <ul className="card bg-base-200 border border-base-300 p-5 space-y-2 list-disc list-inside text-base-content/80">
            {diffs.map((d) => (
              <li key={d.label}>{d.sentence}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Spec table */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Spec by spec</h2>
        <div className="overflow-x-auto card bg-base-200 border border-base-300">
          <table className="table table-sm md:table-md">
            <thead>
              <tr>
                <th className="w-1/4">Spec</th>
                <th className={aWins >= bWins ? "text-success" : ""}>{a.name}</th>
                <th className={bWins >= aWins ? "text-success" : ""}>{b.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="text-base-content/60">{row.label}</td>
                  <td className={cellClass(row, "a")}>{row.aText}</td>
                  <td className={cellClass(row, "b")}>{row.bText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-base-content/50">
          Highlighted cells mark the better value in each row. Lower is better
          for price and weight; higher is better everywhere else.
        </p>
      </section>

      {/* Use-case verdicts from the compare engine */}
      {useCaseVerdicts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Which should you choose?</h2>
          <div className="overflow-x-auto card bg-base-200 border border-base-300">
            <table className="table table-sm md:table-md">
              <thead>
                <tr>
                  <th>Use case</th>
                  <th>Better pick</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody>
                {useCaseVerdicts.map((v) => (
                  <tr key={v.id}>
                    <td className="text-base-content/60 whitespace-nowrap">{v.label}</td>
                    <td className="font-semibold whitespace-nowrap">
                      {v.winnerIndex === 0 ? a.name : b.name}
                    </td>
                    <td className="text-base-content/70">{v.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* FAQ (visible, mirrors JSON-LD) */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <div className="space-y-2">
          {faqs.map((item, i) => (
            <div key={i} className="collapse collapse-arrow bg-base-200 border border-base-300">
              <input type="checkbox" />
              <div className="collapse-title font-medium">{item.q}</div>
              <div className="collapse-content text-base-content/70">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
