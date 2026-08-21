import type { Product } from '@/lib/data';
import type { PhoneHubScore } from '@/lib/score-calculator';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SpecsMap = Record<string, Record<string, Record<string, string>>>;
export type ScoresMap = Record<string, PhoneHubScore>;

export interface RowVerdict {
  /** Product indices that win this row (empty when not comparable or all equal). */
  winners: number[];
  /** True when every product has the identical raw value. */
  allSame: boolean;
  /** True when the row was numerically comparable. */
  comparable: boolean;
}

export type UseCaseId = 'overall' | 'photography' | 'gaming' | 'battery' | 'value';

export interface UseCaseVerdict {
  id: UseCaseId;
  label: string;
  winnerIndex: number;
  reason: string;
}

export interface Recommendation {
  winnerIndex: number;
  headline: string;
  body: string;
}

/* ------------------------------------------------------------------ */
/*  Numeric extraction helpers                                         */
/* ------------------------------------------------------------------ */

function firstNumber(re: RegExp, value: string): number | null {
  const m = value.match(re);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function maxNumber(re: RegExp, value: string): number | null {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const matches = [...value.matchAll(new RegExp(re.source, flags))];
  if (!matches.length) return null;
  const nums = matches
    .map((m) => parseFloat(m[1].replace(/,/g, '')))
    .filter((n) => !isNaN(n));
  return nums.length ? Math.max(...nums) : null;
}

/* ------------------------------------------------------------------ */
/*  Row rules: how to compare a given spec row numerically             */
/* ------------------------------------------------------------------ */

interface RowRule {
  matches(section: string, key: string): boolean;
  extract(value: string): number | null;
  better: 'high' | 'low';
}

const ROW_RULES: RowRule[] = [
  {
    // Battery capacity: "Li-Ion 5088 mAh" (take the largest variant listed)
    matches: (s, k) => s === 'Battery' && /^type$/i.test(k),
    extract: (v) => maxNumber(/(\d[\d,]*(?:\.\d+)?)\s*mAh/i, v),
    better: 'high',
  },
  {
    // Charging speed: "65W wired" → max wattage
    matches: (s, k) => s === 'Battery' && /charging/i.test(k),
    extract: (v) => maxNumber(/(\d+(?:\.\d+)?)\s*W\b/i, v),
    better: 'high',
  },
  {
    // RAM: "256GB 8GB RAM, 512GB 12GB RAM" → max RAM figure
    matches: (s, k) => s === 'Memory' && /internal|ram/i.test(k),
    extract: (v) => maxNumber(/(\d+)\s*GB\s*RAM/i, v),
    better: 'high',
  },
  {
    // Camera sensors: "48 MP, f/1.6 ..." → max MP across listed modules
    matches: (s, k) =>
      /camera/i.test(s) && /^(single|dual|triple|quad|penta|main)$/i.test(k.trim()),
    extract: (v) => maxNumber(/(\d+(?:\.\d+)?)\s*MP/i, v),
    better: 'high',
  },
  {
    // Refresh rate from display type: "LTPO OLED, 120Hz"
    matches: (s, k) => s === 'Display' && /^type$/i.test(k),
    extract: (v) => maxNumber(/(\d+)\s*Hz/i, v),
    better: 'high',
  },
  {
    // Display size in inches
    matches: (s, k) => s === 'Display' && /^size$/i.test(k),
    extract: (v) => firstNumber(/([\d.]+)\s*inches?/i, v),
    better: 'high',
  },
  {
    // Resolution: "1170 x 2532 pixels" → total pixel count
    matches: (s, k) => s === 'Display' && /^resolution$/i.test(k),
    extract: (v) => {
      const m = v.match(/(\d{3,4})\s*x\s*(\d{3,4})/);
      if (!m) return null;
      const w = parseInt(m[1], 10);
      const h = parseInt(m[2], 10);
      return isNaN(w) || isNaN(h) ? null : w * h;
    },
    better: 'high',
  },
  {
    // Weight: lower is better
    matches: (s, k) => s === 'Body' && /^weight$/i.test(k),
    extract: (v) => firstNumber(/([\d.]+)\s*g\b/i, v),
    better: 'low',
  },
  {
    // Price row in specs: "$ 939.26 / € 1,163.19" → cheapest listed figure, lower wins
    matches: (s, k) => s === 'Misc' && /^price$/i.test(k),
    extract: (v) => {
      const nums = [...v.matchAll(/(\d[\d,]*(?:\.\d+)?)/g)]
        .map((m) => parseFloat(m[1].replace(/,/g, '')))
        .filter((n) => !isNaN(n) && n > 10);
      return nums.length ? Math.min(...nums) : null;
    },
    better: 'low',
  },
  {
    // Benchmark-style rows (AnTuTu / Geekbench) if present in specs
    matches: (_s, k) => /antutu|geekbench|benchmark/i.test(k),
    extract: (v) => maxNumber(/(\d[\d,]{3,})/, v),
    better: 'high',
  },
];

/**
 * Detect the winning product index/indices for a single spec row.
 * Non-comparable rows (free text) return `comparable: false`.
 */
export function getRowVerdict(
  values: string[],
  section: string,
  key: string,
): RowVerdict {
  const allSame = values.every((v) => v === values[0]);
  const rule = ROW_RULES.find((r) => r.matches(section, key));
  if (!rule) return { winners: [], allSame, comparable: false };

  const nums = values.map((v) => (v === '—' ? null : rule.extract(v)));
  const present = nums.filter((n): n is number => n !== null);
  if (present.length < 2) return { winners: [], allSame, comparable: false };

  const best = rule.better === 'high' ? Math.max(...present) : Math.min(...present);
  const allEqual = present.every((n) => n === best) && nums.every((n) => n === null || n === best);
  if (allEqual) return { winners: [], allSame: true, comparable: true };

  const winners = nums
    .map((n, i) => (n === best ? i : -1))
    .filter((i) => i >= 0);
  return { winners, allSame: false, comparable: true };
}

/* ------------------------------------------------------------------ */
/*  Product facts (for reasons + heuristic fallbacks)                  */
/* ------------------------------------------------------------------ */

export interface ProductFacts {
  mah: number | null;
  mp: number | null;
  ramGb: number | null;
  refreshHz: number | null;
  price: number;
  score: PhoneHubScore | null;
}

export function getLowestPrice(p: Product): number {
  if (p.prices && p.prices.length) {
    const valid = p.prices
      .map((pr) => pr.price)
      .filter((v): v is number => v !== null && v > 0);
    if (valid.length) return Math.min(...valid);
  }
  return p.basePrice ?? 0;
}

function specValue(
  specs: SpecsMap,
  productId: string,
  section: string,
  key: string,
): string {
  return specs[productId]?.[section]?.[key] || '';
}

export function getProductFacts(
  p: Product,
  specs: SpecsMap,
  scores: ScoresMap,
): ProductFacts {
  const batteryType = specValue(specs, p.id, 'Battery', 'Type');
  const mainCam =
    specValue(specs, p.id, 'Main Camera', 'Single') ||
    specValue(specs, p.id, 'Main Camera', 'Dual') ||
    specValue(specs, p.id, 'Main Camera', 'Triple') ||
    specValue(specs, p.id, 'Main Camera', 'Quad');
  const internal = specValue(specs, p.id, 'Memory', 'Internal');
  const displayType = specValue(specs, p.id, 'Display', 'Type');

  return {
    mah: maxNumber(/(\d[\d,]*(?:\.\d+)?)\s*mAh/i, batteryType),
    mp: maxNumber(/(\d+(?:\.\d+)?)\s*MP/i, mainCam),
    ramGb: maxNumber(/(\d+)\s*GB\s*RAM/i, internal),
    refreshHz: maxNumber(/(\d+)\s*Hz/i, displayType),
    price: getLowestPrice(p),
    score: scores[p.id] ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Use-case verdicts                                                  */
/* ------------------------------------------------------------------ */

const fmtNum = (n: number) => n.toLocaleString('en-US');
const fmtPrice = (n: number) => (n > 0 ? `$${fmtNum(Math.round(n))}` : '');

function argmax(values: (number | null)[]): number {
  let bestIdx = -1;
  let bestVal = -Infinity;
  values.forEach((v, i) => {
    if (v !== null && v > bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

function scoreWinner(
  facts: ProductFacts[],
  key: keyof PhoneHubScore,
): number {
  // Only consider products that actually have a score
  const usable = facts.map((f) => (f.score ? f.score[key] : null));
  const withScores = usable.filter((v): v is number => v !== null);
  if (withScores.length < 2) return -1;
  return argmax(usable);
}

function strongestSubScores(score: PhoneHubScore, count = 2): string[] {
  const entries: [string, number][] = [
    ['camera', score.camera],
    ['battery', score.battery],
    ['performance', score.performance],
    ['display', score.display],
    ['value', score.value],
    ['build', score.build],
  ];
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name, v]) => `${name} (${v}/100)`);
}

/**
 * Pick a winner per use-case, preferring PhoneHub sub-scores and falling
 * back to spec heuristics when scores are missing.
 */
export function computeUseCaseVerdicts(
  products: Product[],
  specs: SpecsMap,
  scores: ScoresMap,
): UseCaseVerdict[] {
  if (products.length < 2) return [];
  const facts = products.map((p) => getProductFacts(p, specs, scores));

  const verdicts: UseCaseVerdict[] = [];

  // ── Overall ──
  {
    let idx = scoreWinner(facts, 'total');
    let reason: string;
    if (idx >= 0) {
      const s = facts[idx].score!;
      reason = `Top PhoneHub score (${s.total}/100), led by ${strongestSubScores(s).join(' and ')}.`;
    } else {
      // Heuristic: composite of key hardware specs
      const composite = facts.map((f) =>
        (f.mah ?? 0) / 1000 + (f.mp ?? 0) / 25 + (f.ramGb ?? 0) * 2 + (f.refreshHz ?? 60) / 60,
      );
      idx = argmax(composite);
      const f = facts[idx];
      const bits: string[] = [];
      if (f.mah) bits.push(`${fmtNum(f.mah)} mAh battery`);
      if (f.ramGb) bits.push(`${f.ramGb}GB RAM`);
      if (f.refreshHz) bits.push(`${f.refreshHz}Hz display`);
      reason = bits.length
        ? `Strongest overall hardware: ${bits.slice(0, 2).join(' + ')}.`
        : 'Best all-round spec sheet.';
    }
    verdicts.push({ id: 'overall', label: 'Overall', winnerIndex: idx, reason });
  }

  // ── Photography ──
  {
    let idx = scoreWinner(facts, 'camera');
    let reason = '';
    if (idx >= 0) {
      const f = facts[idx];
      reason = f.mp
        ? `Top camera score (${f.score!.camera}/100) with a ${fmtNum(f.mp)} MP main sensor.`
        : `Top camera score (${f.score!.camera}/100).`;
    } else {
      idx = argmax(facts.map((f) => f.mp));
      if (idx >= 0) {
        const f = facts[idx];
        reason = f.mp
          ? `Highest-resolution main camera at ${fmtNum(f.mp)} MP.`
          : 'Best camera hardware on paper.';
      }
    }
    // Skip the use case entirely when neither product has usable data.
    if (idx >= 0) {
      verdicts.push({ id: 'photography', label: 'Photography', winnerIndex: idx, reason });
    }
  }

  // ── Gaming / Performance ──
  {
    let idx = scoreWinner(facts, 'performance');
    let reason: string;
    if (idx >= 0) {
      const f = facts[idx];
      const extras: string[] = [];
      if (f.ramGb) extras.push(`${f.ramGb}GB RAM`);
      if (f.refreshHz && f.refreshHz >= 120) extras.push(`${f.refreshHz}Hz display`);
      reason = `Top performance score (${f.score!.performance}/100)` +
        (extras.length ? `, backed by ${extras.join(' and ')}.` : '.');
    } else {
      // Heuristic: RAM first, then refresh rate
      const composite = facts.map((f) => (f.ramGb ?? 0) * 10 + (f.refreshHz ?? 60) / 10);
      idx = argmax(composite);
      const f = facts[idx];
      const bits: string[] = [];
      if (f.ramGb) bits.push(`${f.ramGb}GB RAM`);
      if (f.refreshHz) bits.push(`${f.refreshHz}Hz screen`);
      reason = bits.length
        ? `Best gaming hardware: ${bits.join(' + ')}.`
        : 'Strongest performance hardware.';
    }
    verdicts.push({ id: 'gaming', label: 'Gaming/Performance', winnerIndex: idx, reason });
  }

  // ── Battery life ──
  {
    let idx = scoreWinner(facts, 'battery');
    let reason = '';
    if (idx >= 0) {
      const f = facts[idx];
      reason = f.mah
        ? `Top battery score (${f.score!.battery}/100) with a ${fmtNum(f.mah)} mAh cell.`
        : `Top battery score (${f.score!.battery}/100).`;
    } else {
      idx = argmax(facts.map((f) => f.mah));
      if (idx >= 0) {
        const f = facts[idx];
        reason = f.mah
          ? `Largest battery at ${fmtNum(f.mah)} mAh.`
          : 'Best battery hardware on paper.';
      }
    }
    if (idx >= 0) {
      verdicts.push({ id: 'battery', label: 'Battery life', winnerIndex: idx, reason });
    }
  }

  // ── Value for money ──
  {
    let idx = scoreWinner(facts, 'value');
    let reason = '';
    if (idx >= 0) {
      const f = facts[idx];
      const price = fmtPrice(f.price);
      reason = `Top value score (${f.score!.value}/100)` + (price ? ` at ${price}.` : '.');
    } else {
      // Heuristic: spec composite per dollar
      const perDollar = facts.map((f) => {
        if (!f.price) return null;
        const composite =
          (f.mah ?? 0) / 1000 + (f.mp ?? 0) / 25 + (f.ramGb ?? 0) * 2 + (f.refreshHz ?? 60) / 60;
        return composite / f.price;
      });
      idx = argmax(perDollar);
      if (idx >= 0) {
        const price = fmtPrice(facts[idx].price);
        reason = price
          ? `Most hardware per dollar, starting at ${price}.`
          : 'Best spec-to-price ratio.';
      }
    }
    if (idx >= 0) {
      verdicts.push({ id: 'value', label: 'Value for money', winnerIndex: idx, reason });
    }
  }

  return verdicts;
}

/* ------------------------------------------------------------------ */
/*  "PhoneHub recommends" summary                                      */
/* ------------------------------------------------------------------ */

export function computeRecommendation(
  products: Product[],
  specs: SpecsMap,
  scores: ScoresMap,
): Recommendation | null {
  const verdicts = computeUseCaseVerdicts(products, specs, scores);
  const overall = verdicts.find((v) => v.id === 'overall');
  if (!overall) return null;

  const winner = products[overall.winnerIndex];
  const facts = getProductFacts(winner, specs, scores);

  const sentences: string[] = [];
  sentences.push(overall.reason);

  // Mention which other use-cases the same product also wins
  const alsoWins = verdicts
    .filter((v) => v.id !== 'overall' && v.winnerIndex === overall.winnerIndex)
    .map((v) => v.label.toLowerCase().replace('/performance', ''));
  if (alsoWins.length >= 2) {
    sentences.push(`It also leads in ${alsoWins.slice(0, 3).join(', ')}.`);
  } else if (alsoWins.length === 1) {
    sentences.push(`It also leads in ${alsoWins[0]}.`);
  }

  // Price context vs the field
  const prices = products.map((p) => getLowestPrice(p)).filter((n) => n > 0);
  if (prices.length >= 2 && facts.price > 0) {
    const cheapest = Math.min(...prices);
    if (facts.price === cheapest) {
      sentences.push(`It's also the cheapest of the group at ${fmtPrice(facts.price)}.`);
    }
  }

  return {
    winnerIndex: overall.winnerIndex,
    headline: `PhoneHub recommends the ${winner.name}`,
    body: sentences.join(' '),
  };
}
