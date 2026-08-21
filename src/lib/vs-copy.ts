import type { FilterSpecs, Product } from "@/lib/data";

/**
 * Data-derived copy builders for /vs/[slug] comparison pages.
 *
 * Every sentence is computed from the pair's actual spec data, so each of the
 * 220+ prebuilt pairs (and any on-demand ISR pair) gets substantively unique
 * copy instead of a name-swapped template — the mitigation for thin/templated
 * programmatic content.
 */

export type VsWinner = "a" | "b" | "tie" | null;

export interface VsCopyRow {
  label: string;
  aText: string;
  bText: string;
  winner: VsWinner;
  /** Raw numeric values behind the formatted text (null when unknown). */
  aNum: number | null;
  bNum: number | null;
  /** True for yes/no capability rows (wireless charging, telephoto...). */
  isBool: boolean;
  /**
   * False when a bool row's asymmetry may reflect missing data rather than a
   * real capability gap — narrative claims skip these rows (the table still
   * shows them). See isDataRich().
   */
  boolTrustworthy?: boolean;
  /** True when a smaller number wins the row (price, weight). */
  lowerIsBetter: boolean;
}

export interface KeyDifference {
  label: string;
  winnerText: string;
  loserText: string;
  sentence: string;
}

const fmtNum = (n: number) => n.toLocaleString("en-US");

/** Narrative priority: the differences buyers care about most come first. */
const DIFF_PRIORITY: Record<string, number> = {
  "Launch price": 0,
  "Battery capacity": 1,
  "Main camera": 2,
  "Telephoto lens": 3,
  "Refresh rate": 4,
  "Display size": 5,
  "Peak brightness": 6,
  "Charging speed": 7,
  "Wireless charging": 8,
  "Optical stabilization": 9,
  "Max RAM": 10,
  "Max storage": 11,
  Weight: 12,
};

const BOOL_PHRASES: Record<string, string> = {
  "Wireless charging": "supports wireless charging",
  "Telephoto lens": "has a telephoto lens",
  "Optical stabilization": "has optical image stabilization",
};

/**
 * Core fields a fully-enriched phone should have. Bool rows read `false` for
 * both "genuinely absent" and "never parsed", so asymmetric bool claims
 * ("Only the X has...") are only trustworthy when BOTH phones went through
 * full spec enrichment. Roughly 1 in 5 catalog phones is fully enriched;
 * the prebuilt /vs pairs overwhelmingly are.
 */
export function isDataRich(fs: FilterSpecs | null): boolean {
  if (!fs) return false;
  const filled = [
    fs.batteryCapacity,
    fs.mainCameraMP,
    fs.displaySize,
    fs.refreshRate,
    fs.chipset,
    fs.weight,
  ].filter((v) => v !== null).length;
  return filled >= 3;
}

/** Ignore numeric gaps smaller than this — a few percent is not a story. */
const MIN_DIFF_PCT = 5;

/** Winner's advantage over the loser, in percent of the LOSER's value. */
function pctGap(winner: number, loser: number): number {
  if (loser <= 0) return 0;
  return Math.round(((winner - loser) / loser) * 100);
}

/**
 * Pick the most meaningful spec gaps and phrase them as sentences.
 * Returns at most `limit` differences, ordered by buyer relevance.
 */
export function keyDifferences(
  rows: VsCopyRow[],
  a: Product,
  b: Product,
  limit = 5
): KeyDifference[] {
  const out: { priority: number; diff: KeyDifference }[] = [];

  for (const row of rows) {
    if (row.winner !== "a" && row.winner !== "b") continue;
    const wName = row.winner === "a" ? a.name : b.name;
    const winnerText = row.winner === "a" ? row.aText : row.bText;
    const loserText = row.winner === "a" ? row.bText : row.aText;

    let sentence: string | null = null;
    if (row.isBool) {
      // Skip capability claims when either phone's data may be incomplete.
      if (row.boolTrustworthy === false) continue;
      const phrase = BOOL_PHRASES[row.label] ?? `offers ${row.label.toLowerCase()}`;
      sentence = `Only the ${wName} ${phrase}.`;
    } else {
      const wNum = row.winner === "a" ? row.aNum : row.bNum;
      const lNum = row.winner === "a" ? row.bNum : row.aNum;
      if (wNum === null || lNum === null || wNum <= 0 || lNum <= 0) continue;
      // Advantage is always expressed relative to the larger value, so the
      // sign works for both higher-better and lower-better rows.
      const pct = row.lowerIsBetter
        ? Math.round(((lNum - wNum) / lNum) * 100)
        : pctGap(wNum, lNum);
      if (pct < MIN_DIFF_PCT) continue;
      if (row.lowerIsBetter) {
        const adj = row.label === "Weight" ? "lighter" : "cheaper";
        sentence = `The ${wName} is ${pct}% ${adj} — ${winnerText} versus ${loserText}.`;
      } else {
        sentence = `The ${wName} leads on ${row.label.toLowerCase()} — ${winnerText} versus ${loserText}${pct >= 8 ? `, a ${pct}% edge` : ""}.`;
      }
    }

    out.push({
      priority: DIFF_PRIORITY[row.label] ?? 99,
      diff: { label: row.label, winnerText, loserText, sentence },
    });
  }

  return out
    .sort((x, y) => x.priority - y.priority)
    .slice(0, limit)
    .map((d) => d.diff);
}

function releaseYear(p: Product): string | null {
  const m = p.releaseDate.match(/(\d{4})/);
  return m ? m[1] : null;
}

function priceOf(p: Product, fs: FilterSpecs | null): number | null {
  return fs?.price ?? (p.basePrice > 0 ? p.basePrice : null);
}

/**
 * Positioning intro for the header — brand, year, price and silicon for each
 * phone, so no two pages share the same opening copy.
 */
export function buildIntro(
  a: Product,
  b: Product,
  fa: FilterSpecs | null,
  fb: FilterSpecs | null
): string {
  const bit = (p: Product, fs: FilterSpecs | null): string => {
    const year = releaseYear(p);
    const price = priceOf(p, fs);
    if (year && price) return ` (${year}, $${fmtNum(price)})`;
    if (year) return ` (${year})`;
    if (price) return ` ($${fmtNum(price)})`;
    return "";
  };

  const sentences = [
    `The ${a.name}${bit(a, fa)} goes head-to-head with the ${b.name}${bit(b, fb)}.`,
  ];

  const chipA = fa?.chipset;
  const chipB = fb?.chipset;
  if (chipA && chipB && chipA !== chipB) {
    sentences.push(
      `Inside, the ${a.name} runs on the ${chipA}, while the ${b.name} uses the ${chipB}.`
    );
  } else if (chipA && chipB) {
    sentences.push(`Both are powered by the ${chipA}.`);
  }

  return sentences.join(" ");
}

/** Unique meta description per pair (was a fixed name-swap template). */
export function buildMetaDescription(
  a: Product,
  b: Product,
  winner: VsWinner,
  aWins: number,
  bWins: number,
  diffs: KeyDifference[]
): string {
  const winBit =
    winner === "a" || winner === "b"
      ? `the ${winner === "a" ? a.name : b.name} wins ${Math.max(aWins, bWins)} of ${aWins + bWins} comparable spec categories`
      : "they split the comparable categories evenly";
  const diffBit = diffs.length
    ? ` ${diffs[0].label}: ${diffs[0].winnerText} vs ${diffs[0].loserText}.`
    : "";
  const headline = `${a.name} vs ${b.name}: ${winBit}.${diffBit}`;
  const suffix = " Full spec-by-spec comparison, prices and verdict.";
  // Keep under ~170 chars so SERPs don't truncate mid-word; drop the suffix first.
  if ((headline + suffix).length <= 170) return headline + suffix;
  return headline.length <= 170 ? headline : headline.slice(0, 167).replace(/\s+\S*$/, "") + "…";
}

/** Camera FAQ — only when the data supports a meaningful answer. */
export function buildCameraFaq(
  a: Product,
  b: Product,
  fa: FilterSpecs | null,
  fb: FilterSpecs | null
): { q: string; a: string } | null {
  const mpA = fa?.mainCameraMP ?? null;
  const mpB = fb?.mainCameraMP ?? null;
  if (mpA === null || mpB === null) return null;

  const q = `Which has the better camera, the ${a.name} or the ${b.name}?`;
  const extras = (w: Product, l: Product, wf: FilterSpecs | null, lf: FilterSpecs | null): string => {
    const bits: string[] = [];
    if (wf?.telephoto && !lf?.telephoto) bits.push("a dedicated telephoto lens");
    if (wf?.ois && !lf?.ois) bits.push("optical image stabilization");
    return bits.length ? ` It also packs ${bits.join(" and ")}, which the ${l.name} lacks.` : "";
  };

  if (mpA !== mpB) {
    const w = mpA > mpB ? a : b;
    const l = mpA > mpB ? b : a;
    return {
      q,
      a: `On paper, the ${w.name} has the higher-resolution main camera — ${Math.max(mpA, mpB)} MP versus ${Math.min(mpA, mpB)} MP on the ${l.name}.${extras(w, l, mpA > mpB ? fa : fb, mpA > mpB ? fb : fa)} Megapixels aren't everything, but combined with the lens hardware they give the ${w.name} the edge.`,
    };
  }

  // Equal resolution — the tiebreaker is lens/stabilization hardware.
  const tie = extras(a, b, fa, fb) || extras(b, a, fb, fa);
  if (tie) {
    const w = extras(a, b, fa, fb) ? a : b;
    const l = w === a ? b : a;
    return {
      q,
      a: `Both have a ${mpA} MP main camera, so the difference is in the supporting hardware.${extras(w, l, w === a ? fa : fb, w === a ? fb : fa)} That makes the ${w.name} the more versatile shooter.`,
    };
  }
  return null;
}

/** Display FAQ — refresh rate first, then size, then brightness. */
export function buildDisplayFaq(
  a: Product,
  b: Product,
  fa: FilterSpecs | null,
  fb: FilterSpecs | null
): { q: string; a: string } | null {
  if (!fa || !fb) return null;
  const q = `Which has the better display, the ${a.name} or the ${b.name}?`;

  const bits: { w: Product; l: Product; text: string }[] = [];
  if (fa.refreshRate !== null && fb.refreshRate !== null && fa.refreshRate !== fb.refreshRate) {
    const w = fa.refreshRate > fb.refreshRate ? a : b;
    bits.push({
      w,
      l: w === a ? b : a,
      text: `a smoother ${Math.max(fa.refreshRate, fb.refreshRate)}Hz refresh rate (versus ${Math.min(fa.refreshRate, fb.refreshRate)}Hz)`,
    });
  }
  if (fa.displaySize !== null && fb.displaySize !== null && fa.displaySize !== fb.displaySize) {
    const w = fa.displaySize > fb.displaySize ? a : b;
    bits.push({
      w,
      l: w === a ? b : a,
      text: `a larger ${Math.max(fa.displaySize, fb.displaySize)}" panel (versus ${Math.min(fa.displaySize, fb.displaySize)}")`,
    });
  }
  if (fa.brightnessNits !== null && fb.brightnessNits !== null && fa.brightnessNits !== fb.brightnessNits) {
    const w = fa.brightnessNits > fb.brightnessNits ? a : b;
    bits.push({
      w,
      l: w === a ? b : a,
      text: `a brighter screen at ${fmtNum(Math.max(fa.brightnessNits, fb.brightnessNits))} nits peak (versus ${fmtNum(Math.min(fa.brightnessNits, fb.brightnessNits))})`,
    });
  }
  if (!bits.length) return null;

  const wCounts = new Map<Product, string[]>();
  for (const bit of bits) {
    wCounts.set(bit.w, [...(wCounts.get(bit.w) ?? []), bit.text]);
  }
  const [winner, texts] = [...wCounts.entries()].sort((x, y) => y[1].length - x[1].length)[0];
  const loser = winner === a ? b : a;
  return {
    q,
    a: `The ${winner.name} offers ${texts.join(" and ")} compared to the ${loser.name}, giving it the stronger display overall.`,
  };
}
