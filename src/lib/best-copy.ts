import type { BestPageDef, RankedPhone } from "@/lib/best-pages";
import type { PhoneHubScore } from "@/lib/score-calculator";
import type { FilterSpecs } from "@/lib/data";

/**
 * Data-derived copy builders for /best/[slug] buying-guide pages.
 *
 * The per-page intros were already hand-written; what made these pages thin
 * was the list body — identical chrome around a spec line. Everything here is
 * computed from the ranked set itself (scores, specs, prices), so each list
 * reads differently because the data IS different.
 */

const SCORE_LABEL: Record<keyof PhoneHubScore, string> = {
  total: "overall",
  display: "display",
  camera: "camera",
  performance: "performance",
  battery: "battery",
  value: "value",
  build: "build",
};

const fmtNum = (n: number) => n.toLocaleString("en-US");
const maxOf = (nums: number[]): number | null => (nums.length ? Math.max(...nums) : null);

/* ------------------------------------------------------------------ */
/*  "How we ranked this list" methodology copy                         */
/* ------------------------------------------------------------------ */

const SCORING_COPY: Record<keyof PhoneHubScore, string> = {
  total:
    "Phones are ordered by our overall PhoneHub Score — a weighted blend of display, camera, performance, battery, value and build quality computed from spec sheets and benchmark results, not brand reputation.",
  camera:
    "Phones are ordered by our camera score, which analyzes the full imaging system: main sensor resolution, telephoto and ultrawide hardware, optical stabilization and video capability.",
  battery:
    "Phones are ordered by our battery score, which weighs capacity first and then charging speed and wireless charging support — so a huge cell with slow charging doesn't automatically top the list.",
  performance:
    "Phones are ordered by our performance score, informed by chipset benchmarks, RAM headroom and display refresh rate — the hardware that actually decides frame rates and longevity.",
  display:
    "Phones are ordered by our display score, which weighs peak brightness, refresh rate, resolution and panel technology together.",
  value:
    "Phones are ordered by our value score — a pure specs-per-dollar calculation that divides hardware capability by price, with no allowance for brand premium.",
  build:
    "Phones are ordered by our build score, which considers materials, water resistance and form factor.",
};

export function methodologyParagraphs(scoreKey: keyof PhoneHubScore): string[] {
  return [
    SCORING_COPY[scoreKey],
    "Scores are recomputed whenever our underlying spec database is refreshed (roughly daily), so rankings can shift as prices change and new models launch.",
  ];
}

/* ------------------------------------------------------------------ */
/*  Per-item "why it ranks here" blurb                                 */
/* ------------------------------------------------------------------ */

/** Spec one-liner tuned to what THIS list ranks by. */
function hardwareLine(fs: FilterSpecs, scoreKey: keyof PhoneHubScore, pros: string[]): string | null {
  const parts: string[] = [];
  switch (scoreKey) {
    case "battery":
      if (fs.batteryCapacity) parts.push(`${fmtNum(fs.batteryCapacity)} mAh battery`);
      if (fs.chargingWatt) parts.push(`${fs.chargingWatt}W charging`);
      if (fs.wirelessCharging) parts.push("wireless charging");
      break;
    case "camera":
      if (fs.mainCameraMP) parts.push(`${fs.mainCameraMP}MP main camera`);
      if (fs.telephoto) parts.push("telephoto zoom");
      if (fs.ois) parts.push("OIS");
      if (fs.videoResolution === "8K") parts.push("8K video");
      break;
    case "performance":
      if (fs.chipset) parts.push(fs.chipset);
      if (fs.ram.length) parts.push(`up to ${maxOf(fs.ram)}GB RAM`);
      if (fs.refreshRate) parts.push(`${fs.refreshRate}Hz display`);
      break;
    case "display":
      if (fs.displaySize) parts.push(`${fs.displaySize}" display`);
      if (fs.refreshRate) parts.push(`${fs.refreshRate}Hz`);
      if (fs.brightnessNits) parts.push(`${fmtNum(fs.brightnessNits)} nits peak`);
      if (fs.displayTechnology) parts.push(fs.displayTechnology);
      break;
    case "value": {
      const price = fs.price ?? null;
      if (price) parts.push(`$${fmtNum(price)}`);
      if (fs.batteryCapacity) parts.push(`${fmtNum(fs.batteryCapacity)} mAh battery`);
      if (fs.refreshRate) parts.push(`${fs.refreshRate}Hz display`);
      break;
    }
    default:
      // total / build: lead with silicon, back up with endurance
      if (fs.chipset) parts.push(fs.chipset);
      if (fs.batteryCapacity) parts.push(`${fmtNum(fs.batteryCapacity)} mAh battery`);
      break;
  }
  if (parts.length) return `Key hardware: ${parts.join(", ")}.`;
  return pros.length ? `Stands out for: ${pros[0].charAt(0).toLowerCase()}${pros[0].slice(1)}.` : null;
}

/**
 * One or two sentences explaining why this phone sits at this rank —
 * score context relative to the leader plus the specs this list cares about.
 * Returns null when there's genuinely nothing data-backed to say.
 */
export function rankBlurb(
  ranked: RankedPhone[],
  index: number,
  scoreKey: keyof PhoneHubScore
): string | null {
  const { phone, score } = ranked[index];
  const sentences: string[] = [];

  if (score) {
    const cur = score[scoreKey];
    const leader = ranked[0].score?.[scoreKey] ?? null;
    if (index === 0) {
      sentences.push(`Leads this list with a ${SCORE_LABEL[scoreKey]} score of ${cur}/100.`);
    } else if (leader !== null && leader > cur && leader - cur <= 15) {
      sentences.push(
        `Scores ${cur}/100 for ${SCORE_LABEL[scoreKey]} — ${leader - cur} point${leader - cur === 1 ? "" : "s"} behind the ${ranked[0].phone.name}.`
      );
    } else {
      sentences.push(`Scores ${cur}/100 for ${SCORE_LABEL[scoreKey]}.`);
    }
  }

  const hw = hardwareLine(phone.filterSpecs, scoreKey, phone.pros ?? []);
  if (hw) sentences.push(hw);

  return sentences.length ? sentences.join(" ") : null;
}

/* ------------------------------------------------------------------ */
/*  "List highlights" stat strip                                       */
/* ------------------------------------------------------------------ */

export interface ListHighlight {
  label: string;
  name: string;
  detail: string;
}

/** Standout stats computed from the actual ranked set on this page. */
export function listHighlights(
  ranked: RankedPhone[],
  scoreKey: keyof PhoneHubScore
): ListHighlight[] {
  const out: ListHighlight[] = [];

  const leader = ranked.find((r) => r.score);
  if (leader?.score) {
    out.push({
      label: `Top ${SCORE_LABEL[scoreKey]} score`,
      name: leader.phone.name,
      detail: `${leader.score[scoreKey]}/100`,
    });
  }

  const priced = ranked
    .map((r) => ({ r, price: r.phone.filterSpecs.price ?? (r.phone.basePrice > 0 ? r.phone.basePrice : null) }))
    .filter((x): x is { r: RankedPhone; price: number } => x.price !== null);
  if (priced.length >= 2) {
    const cheapest = priced.reduce((m, x) => (x.price < m.price ? x : m));
    out.push({ label: "Cheapest pick", name: cheapest.r.phone.name, detail: `$${fmtNum(cheapest.price)}` });
  }

  const withBattery = ranked.filter((r) => r.phone.filterSpecs.batteryCapacity);
  if (withBattery.length >= 2) {
    const biggest = withBattery.reduce((m, r) =>
      (r.phone.filterSpecs.batteryCapacity ?? 0) > (m.phone.filterSpecs.batteryCapacity ?? 0) ? r : m
    );
    out.push({
      label: "Biggest battery",
      name: biggest.phone.name,
      detail: `${fmtNum(biggest.phone.filterSpecs.batteryCapacity!)} mAh`,
    });
  }

  const withYear = ranked.filter((r) => r.phone.filterSpecs.launchYear);
  if (withYear.length >= 2) {
    const newest = withYear.reduce((m, r) =>
      (r.phone.filterSpecs.launchYear ?? 0) > (m.phone.filterSpecs.launchYear ?? 0) ? r : m
    );
    out.push({
      label: "Newest release",
      name: newest.phone.name,
      detail: String(newest.phone.filterSpecs.launchYear),
    });
  }

  return out.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/*  FAQ (visible + FAQPage JSON-LD)                                    */
/* ------------------------------------------------------------------ */

/** "Best Camera Phones" → "camera phones"; keeps brand names capitalized. */
function nounPhrase(title: string): string {
  const t = title.replace(/^Best\s+/i, "");
  const brands = ["iPhones", "Samsung", "Xiaomi", "Android", "8K", "1TB", "16GB", "5G"];
  return brands.some((b) => t.startsWith(b)) ? t : t.toLowerCase();
}

export function bestPageFaqs(def: BestPageDef, ranked: RankedPhone[]): { q: string; a: string }[] {
  if (!ranked.length) return [];
  const noun = nounPhrase(def.title);
  const top = ranked[0];
  const faqs: { q: string; a: string }[] = [];

  const topPrice = top.phone.filterSpecs.price ?? (top.phone.basePrice > 0 ? top.phone.basePrice : null);
  faqs.push({
    q: `Which of these ${noun} is the best right now?`,
    a:
      `Our top pick is the ${top.phone.name}` +
      (top.score ? `, which leads this list with a ${SCORE_LABEL[def.scoreKey]} score of ${top.score[def.scoreKey]}/100` : "") +
      (topPrice ? `. It starts at $${fmtNum(topPrice)}.` : ".") +
      " The full ranked list above shows how every contender compares.",
  });

  const priced = ranked
    .map((r) => ({ r, price: r.phone.filterSpecs.price ?? (r.phone.basePrice > 0 ? r.phone.basePrice : null) }))
    .filter((x): x is { r: RankedPhone; price: number } => x.price !== null);
  if (priced.length >= 2) {
    const cheapest = priced.reduce((m, x) => (x.price < m.price ? x : m));
    faqs.push({
      q: `Which of these ${noun} is the cheapest?`,
      a: `The ${cheapest.r.phone.name} is the most affordable pick on this list at $${fmtNum(cheapest.price)}${cheapest.r.score ? `, with a ${SCORE_LABEL[def.scoreKey]} score of ${cheapest.r.score[def.scoreKey]}/100` : ""}.`,
    });
  }

  faqs.push({
    q: `How does PhoneHub rank ${noun}?`,
    a: SCORING_COPY[def.scoreKey],
  });

  return faqs;
}
