import {
  getPhoneProducts,
  getScoreForProduct,
  type FilterSpecs,
  type Product,
} from "@/lib/data";
import type { PhoneHubScore } from "@/lib/score-calculator";

export type PhoneWithSpecs = Product & { filterSpecs: FilterSpecs };

export interface BestPageDef {
  slug: string;
  /** Used for the H1 and meta title, e.g. "Best Camera Phones" */
  title: string;
  /** Meta description */
  description: string;
  /** Unique intro copy, rendered as paragraphs (2–3 sentences total) */
  intro: string[];
  /** Which PhoneHubScore component drives the ranking */
  scoreKey: keyof PhoneHubScore;
  /** Selection predicate over phones with filterSpecs */
  select: (phone: PhoneWithSpecs) => boolean;
  /** Max items in the ranked list (default 10) */
  limit?: number;
}

// ── predicate helpers ────────────────────────────────────────────────────────
const price = (p: PhoneWithSpecs): number =>
  p.filterSpecs.price ?? p.basePrice ?? 0;
const maxRam = (p: PhoneWithSpecs): number =>
  p.filterSpecs.ram.length ? Math.max(...p.filterSpecs.ram) : 0;
const maxStorage = (p: PhoneWithSpecs): number =>
  p.filterSpecs.storage.length ? Math.max(...p.filterSpecs.storage) : 0;

// ── page definitions ─────────────────────────────────────────────────────────
export const BEST_PAGES: BestPageDef[] = [
  {
    slug: "best-phones-2026",
    title: "Best Phones of 2026",
    description:
      "The best phones released in 2026, ranked by our data-driven PhoneHub Score. Compare camera, battery, performance and price before you buy.",
    intro: [
      "Every phone on this list launched in 2026, so you're only looking at the freshest hardware — new chipsets, bigger silicon-carbon batteries and the latest camera sensors.",
      "We rank them with our PhoneHub Score, which weighs display, camera, performance, battery and value against real spec data rather than marketing claims.",
    ],
    scoreKey: "total",
    select: (p) => p.filterSpecs.launchYear === 2026,
  },
  {
    slug: "best-phones-2025",
    title: "Best Phones of 2025",
    description:
      "The best phones of 2025 that are still worth buying — flagship cameras and chipsets, often at newly discounted prices.",
    intro: [
      "Last year's flagships are this year's bargains: 2025 phones still deliver top-tier cameras and performance, and many have dropped significantly in price since launch.",
      "These are the 2025 releases we still recommend, ranked by overall PhoneHub Score.",
    ],
    scoreKey: "total",
    select: (p) => p.filterSpecs.launchYear === 2025,
  },
  {
    slug: "best-camera-phones",
    title: "Best Camera Phones",
    description:
      "The best camera phones with 50MP+ main sensors, telephoto zoom and OIS, ranked by our camera score from real spec analysis.",
    intro: [
      "A great camera phone needs more than megapixels — optical stabilization, a real telephoto lens and a large main sensor matter far more for everyday shots.",
      "Every phone here combines a 50MP+ main camera with OIS and a dedicated telephoto, and we rank them by our camera score, which analyzes sensor, lens and video specs together.",
    ],
    scoreKey: "camera",
    select: (p) =>
      (p.filterSpecs.mainCameraMP ?? 0) >= 50 &&
      p.filterSpecs.telephoto === true &&
      p.filterSpecs.ois === true,
  },
  {
    slug: "best-phones-for-photography",
    title: "Best Phones for Photography",
    description:
      "Serious photography phones with triple-camera systems, OIS and large sensors — ranked for people who shoot more than selfies.",
    intro: [
      "If photography is your priority, look for a versatile triple-camera array: a stabilized main sensor, an ultrawide for landscapes and a telephoto for portraits and zoom.",
      "These phones all pack three or more cameras with OIS, ranked by how strongly their complete imaging system scores in our analysis.",
    ],
    scoreKey: "camera",
    select: (p) =>
      (p.filterSpecs.cameraCount ?? 0) >= 3 && p.filterSpecs.ois === true,
  },
  {
    slug: "best-battery-phones",
    title: "Best Battery Life Phones",
    description:
      "Phones with the biggest batteries (5,500 mAh and up) ranked by battery score — multi-day endurance without the power bank.",
    intro: [
      "Battery anxiety ends at 5,500 mAh. The phones on this list pair huge cells — including new silicon-carbon designs — with efficient chipsets for genuine two-day endurance.",
      "We rank by our battery score, which considers capacity, charging speed and wireless charging support together.",
    ],
    scoreKey: "battery",
    select: (p) => (p.filterSpecs.batteryCapacity ?? 0) >= 5500,
  },
  {
    slug: "best-gaming-phones",
    title: "Best Gaming Phones",
    description:
      "The best gaming phones with 120Hz+ displays, 12GB+ RAM and flagship chipsets — ranked by performance score for smooth high-frame-rate play.",
    intro: [
      "Mobile gaming demands three things: a high-refresh display, plenty of RAM and a chipset that sustains peak frame rates without throttling.",
      "Every phone here offers at least a 120Hz screen and 12GB of RAM, and we rank them by our benchmark-informed performance score.",
    ],
    scoreKey: "performance",
    select: (p) => (p.filterSpecs.refreshRate ?? 0) >= 120 && maxRam(p) >= 12,
  },
  {
    slug: "best-budget-phones",
    title: "Best Budget Phones",
    description:
      "The best cheap phones under $700 that punch above their price — ranked by spec-to-price value, not just the lowest sticker.",
    intro: [
      "Budget doesn't have to mean compromised. The sub-$700 segment now includes 120Hz OLED screens, capable cameras and batteries that outlast flagships.",
      "We rank these affordable picks by our value score — raw specs per dollar — so the top of the list is genuinely the most phone for your money.",
    ],
    scoreKey: "value",
    select: (p) => price(p) > 0 && price(p) < 700,
  },
  {
    slug: "best-phones-under-500",
    title: "Best Phones Under $500",
    description:
      "The best phones under $500 — high-refresh displays, big batteries and capable cameras at half flagship prices.",
    intro: [
      "Five hundred dollars buys a remarkable amount of phone right now: smooth high-refresh displays, 5G, and batteries that embarrass $1,200 flagships.",
      "These are the strongest sub-$500 options in our database, ranked by spec-per-dollar value.",
    ],
    scoreKey: "value",
    select: (p) => price(p) > 0 && price(p) < 500,
  },
  {
    slug: "best-phones-under-1000",
    title: "Best Phones Under $1,000",
    description:
      "Flagship-killer territory: the best phones under $1,000 with top chipsets, great cameras and premium builds for less.",
    intro: [
      "The sub-$1,000 bracket is where value meets flagship performance — many of these phones share chipsets and camera hardware with models costing hundreds more.",
      "We've ranked every strong contender under a grand by overall PhoneHub Score so you can see exactly where the sweet spot is.",
    ],
    scoreKey: "total",
    select: (p) => price(p) > 0 && price(p) < 1000,
  },
  {
    slug: "best-flagship-phones",
    title: "Best Flagship Phones",
    description:
      "The best flagship phones money can buy — premium chips, pro cameras and the best displays, ranked by overall score.",
    intro: [
      "Flagships are where manufacturers hold nothing back: the brightest displays, the fastest silicon and the most advanced camera systems they make.",
      "This list covers the $1,200+ tier, ranked by overall PhoneHub Score so you can see which ultra-premium phone actually earns its price.",
    ],
    scoreKey: "total",
    select: (p) => price(p) >= 1200,
  },
  {
    slug: "best-5g-phones",
    title: "Best 5G Phones",
    description:
      "The best 5G phones across every budget — fast modems, strong battery life and great value, ranked by overall score.",
    intro: [
      "5G is standard across most of the market now, but the best 5G phones pair modern modems with the battery capacity to actually use them all day.",
      "Here are the top-scoring 5G-capable phones in our database, spanning budget to flagship.",
    ],
    scoreKey: "total",
    select: (p) => p.filterSpecs.has5G === true,
    limit: 12,
  },
  {
    slug: "best-small-phones",
    title: "Best Small Phones",
    description:
      "The best compact phones with screens of 6.2 inches or less — one-hand-friendly flagships that don't skimp on power.",
    intro: [
      "Compact phones are an endangered species, but a few manufacturers still build small flagships with no compromises on chipset or camera.",
      "Every phone here has a display of 6.2 inches or less, ranked by overall score — proof that pocket-friendly doesn't mean underpowered.",
    ],
    scoreKey: "total",
    select: (p) =>
      (p.filterSpecs.displaySize ?? 0) > 0 &&
      (p.filterSpecs.displaySize ?? 99) <= 6.2,
  },
  {
    slug: "best-foldable-phones",
    title: "Best Foldable Phones",
    description:
      "The best foldable and flip phones — book-style foldables and compact clamshells ranked by overall score.",
    intro: [
      "Foldables have matured from fragile novelties into genuinely practical daily drivers, with tougher hinges, better crease control and flagship-grade cameras.",
      "This list covers both book-style foldables and flip-style clamshells, ranked by overall PhoneHub Score.",
    ],
    scoreKey: "total",
    select: (p) =>
      p.filterSpecs.formFactor === "Foldable" ||
      p.filterSpecs.formFactor === "Clamshell",
  },
  {
    slug: "best-android-phones",
    title: "Best Android Phones",
    description:
      "The best Android phones from Samsung, Google, Xiaomi, OnePlus and more — ranked by our data-driven overall score.",
    intro: [
      "Android's strength is choice: from $400 value champions to $1,800 ultra-flagships, there's a top-tier option at every price.",
      "We rank the best Android phones across all brands using our overall PhoneHub Score, so brand loyalty never distorts the order.",
    ],
    scoreKey: "total",
    select: (p) => p.filterSpecs.osFamily === "Android",
    limit: 12,
  },
  {
    slug: "best-iphones",
    title: "Best iPhones",
    description:
      "Every current iPhone ranked — from the value pick to the Pro Max, scored on camera, battery, performance and value.",
    intro: [
      "Choosing an iPhone is really about deciding how much camera and screen you need — the gap between the standard and Pro models keeps shifting each generation.",
      "Here's every current iPhone ranked by overall PhoneHub Score, with value scoring that makes the cheaper models easier to justify.",
    ],
    scoreKey: "total",
    select: (p) => p.filterSpecs.osFamily === "iOS",
    limit: 12,
  },
  {
    slug: "best-gaming-phones-under-1000",
    title: "Best Gaming Phones Under $1,000",
    description:
      "High-frame-rate gaming without the flagship price: 120Hz+ phones with 12GB RAM under $1,000, ranked by performance.",
    intro: [
      "You don't need to spend flagship money for flagship frame rates — several sub-$1,000 phones ship with the same top-tier chipsets as devices costing far more.",
      "These picks all combine a 120Hz+ display with at least 12GB of RAM under a $1,000 budget, ranked by performance score.",
    ],
    scoreKey: "performance",
    select: (p) =>
      price(p) > 0 &&
      price(p) < 1000 &&
      (p.filterSpecs.refreshRate ?? 0) >= 120 &&
      maxRam(p) >= 12,
  },
  {
    slug: "best-camera-phones-under-1000",
    title: "Best Camera Phones Under $1,000",
    description:
      "Flagship-grade photography under $1,000 — 50MP+ cameras with telephoto zoom and OIS, ranked by camera score.",
    intro: [
      "Great mobile photography no longer requires a four-figure budget — several sub-$1,000 phones carry the same sensors and telephoto hardware as their pricier siblings.",
      "Each phone here pairs a 50MP+ stabilized main camera with a dedicated telephoto lens, and all stay under $1,000.",
    ],
    scoreKey: "camera",
    select: (p) =>
      price(p) > 0 &&
      price(p) < 1000 &&
      (p.filterSpecs.mainCameraMP ?? 0) >= 50 &&
      p.filterSpecs.telephoto === true &&
      p.filterSpecs.ois === true,
  },
  {
    slug: "best-battery-phones-under-1000",
    title: "Best Battery Phones Under $1,000",
    description:
      "Two-day battery life on a budget — 5,500 mAh+ phones under $1,000 ranked by battery score.",
    intro: [
      "Some of the biggest batteries in the industry live in mid-range phones, where manufacturers prioritize endurance over razor-thin designs.",
      "These phones all pack at least 5,500 mAh and cost under $1,000 — ranked by our battery score, which also weighs charging speed.",
    ],
    scoreKey: "battery",
    select: (p) =>
      price(p) > 0 &&
      price(p) < 1000 &&
      (p.filterSpecs.batteryCapacity ?? 0) >= 5500,
  },
  {
    slug: "best-8k-video-phones",
    title: "Best 8K Video Phones",
    description:
      "Phones that shoot 8K video — maximum-resolution recording for creators, ranked by camera score.",
    intro: [
      "8K recording lets you crop, stabilize and pull 33MP stills from footage — a genuine creative tool, not just a spec-sheet flex.",
      "These are the phones in our database that shoot 8K video, ranked by their overall camera score.",
    ],
    scoreKey: "camera",
    select: (p) => p.filterSpecs.videoResolution === "8K",
  },
  {
    slug: "best-fast-charging-phones",
    title: "Best Fast Charging Phones",
    description:
      "The fastest charging phones — 80W and above, going from empty to full in under 40 minutes, ranked by battery score.",
    intro: [
      "When a phone charges at 80W or more, plugging in for fifteen minutes realistically buys you a full day of use — it changes how you think about battery life entirely.",
      "These are the fastest-charging phones we track, ranked by battery score so raw wattage never overshadows actual capacity.",
    ],
    scoreKey: "battery",
    select: (p) => (p.filterSpecs.chargingWatt ?? 0) >= 80,
  },
  {
    slug: "best-wireless-charging-phones",
    title: "Best Wireless Charging Phones",
    description:
      "The best phones with wireless charging — drop-and-go convenience, ranked by battery score.",
    intro: [
      "Wireless charging is the feature you stop appreciating only when it's gone — desk pads, car mounts and bedside stands all just work.",
      "Every phone here supports wireless charging out of the box, ranked by overall battery score.",
    ],
    scoreKey: "battery",
    select: (p) => p.filterSpecs.wirelessCharging === true,
    limit: 12,
  },
  {
    slug: "best-waterproof-phones",
    title: "Best Waterproof Phones",
    description:
      "The best IP68-rated phones — dust-tight and submersion-proof flagships and mid-rangers, ranked by overall score.",
    intro: [
      "An IP68 rating means full dust protection and survival in 1.5 meters of water for 30 minutes — real peace of mind for poolside summers and rainy commutes.",
      "These IP68-certified phones are ranked by overall PhoneHub Score, spanning rugged budget picks to premium flagships.",
    ],
    scoreKey: "total",
    select: (p) => (p.filterSpecs.ipRating ?? "").includes("IP68"),
    limit: 12,
  },
  {
    slug: "best-lightweight-phones",
    title: "Best Lightweight Phones",
    description:
      "The best phones under 170 grams — featherweight designs that don't sacrifice performance, ranked by overall score.",
    intro: [
      "Flagships keep getting heavier, but a sub-170g phone disappears in your pocket and saves your pinky during long scrolling sessions.",
      "These lightweight contenders all weigh less than 170 grams, ranked by overall score so portability never means settling.",
    ],
    scoreKey: "total",
    select: (p) =>
      (p.filterSpecs.weight ?? 0) > 0 && (p.filterSpecs.weight ?? 999) < 170,
  },
  {
    slug: "best-big-screen-phones",
    title: "Best Big Screen Phones",
    description:
      "The best phones with 6.8-inch+ displays — maximum screen for streaming, gaming and reading, ranked by display score.",
    intro: [
      "For streaming, gaming and split-screen multitasking, nothing beats a genuinely big display — 6.8 inches and up is mini-tablet territory.",
      "These large-screen phones are ranked by our display score, which weighs brightness, refresh rate and panel technology together.",
    ],
    scoreKey: "display",
    select: (p) => (p.filterSpecs.displaySize ?? 0) >= 6.8,
  },
  {
    slug: "best-1tb-phones",
    title: "Best 1TB Storage Phones",
    description:
      "Phones with 1TB of storage or more — shoot unlimited 4K video and never delete anything, ranked by overall score.",
    intro: [
      "A terabyte of storage means 4K video shoots, full-res photo libraries and entire offline media collections with room to spare.",
      "These phones all offer a 1TB (or larger) configuration, ranked by overall PhoneHub Score.",
    ],
    scoreKey: "total",
    select: (p) => maxStorage(p) >= 1024,
  },
  {
    slug: "best-16gb-ram-phones",
    title: "Best 16GB RAM Phones",
    description:
      "Multitasking monsters: phones with 16GB of RAM for heavy gaming, AI features and years of headroom, ranked by performance.",
    intro: [
      "Sixteen gigabytes of RAM keeps dozens of apps resident, powers on-device AI features and gives demanding games headroom for years of updates.",
      "These phones all ship with a 16GB configuration, ranked by our benchmark-informed performance score.",
    ],
    scoreKey: "performance",
    select: (p) => maxRam(p) >= 16,
  },
  {
    slug: "best-samsung-phones",
    title: "Best Samsung Phones",
    description:
      "The best Samsung Galaxy phones ranked — from Galaxy S flagships to foldables and value A-series picks.",
    intro: [
      "Samsung's Galaxy lineup spans everything from affordable A-series workhorses to the S Ultra flagships and Z-series foldables.",
      "We've ranked every Samsung phone in our database by overall PhoneHub Score, so you can see exactly where each model lands.",
    ],
    scoreKey: "total",
    select: (p) => p.brand === "samsung",
    limit: 12,
  },
  {
    slug: "best-xiaomi-phones",
    title: "Best Xiaomi Phones",
    description:
      "The best Xiaomi phones ranked — flagship killers with huge batteries, fast charging and aggressive prices.",
    intro: [
      "Xiaomi built its reputation on flagship specs at disruptive prices, and its current lineup doubles down with massive batteries and class-leading charging speeds.",
      "Here are the best Xiaomi phones we've scored, ranked by overall PhoneHub Score.",
    ],
    scoreKey: "total",
    select: (p) => p.brand === "xiaomi",
    limit: 12,
  },
  {
    slug: "best-value-phones",
    title: "Best Value Phones",
    description:
      "The most phone for your money — ranked purely by spec-to-price ratio in the $400–$900 sweet spot.",
    intro: [
      "Value isn't about being cheap — it's about getting flagship-adjacent hardware where it counts and skipping what you won't notice.",
      "We rank every phone in the $400–$900 sweet spot by our value score, a pure specs-per-dollar calculation with no brand bias.",
    ],
    scoreKey: "value",
    select: (p) => price(p) >= 400 && price(p) <= 900,
  },
  {
    slug: "best-zoom-phones",
    title: "Best Zoom Camera Phones",
    description:
      "The best periscope zoom phones — long-range optical telephoto cameras ranked by camera score.",
    intro: [
      "Periscope telephoto lenses fold optics sideways inside the phone to reach 3x, 5x and beyond — genuine optical zoom that digital cropping can't match.",
      "Every phone here has a periscope telephoto camera, ranked by our overall camera score.",
    ],
    scoreKey: "camera",
    select: (p) =>
      p.filterSpecs.telephoto === true &&
      /periscope/i.test(p.quickSpecs?.camera ?? ""),
  },
];

// ── lookup + ranking ─────────────────────────────────────────────────────────
const bestPageBySlug = new Map<string, BestPageDef>(
  BEST_PAGES.map((def) => [def.slug, def])
);

export function getAllBestPages(): BestPageDef[] {
  return BEST_PAGES;
}

export function getBestPage(slug: string): BestPageDef | undefined {
  return bestPageBySlug.get(slug);
}

export interface RankedPhone {
  phone: PhoneWithSpecs;
  score: PhoneHubScore | null;
}

/** Select + rank products for a best-page definition (score desc, popularity tiebreak). */
export function getBestPageProducts(def: BestPageDef): RankedPhone[] {
  return getPhoneProducts()
    .filter(def.select)
    .map((phone) => ({ phone, score: getScoreForProduct(phone.id) }))
    .sort((a, b) => {
      const sa = a.score?.[def.scoreKey] ?? 0;
      const sb = b.score?.[def.scoreKey] ?? 0;
      if (sb !== sa) return sb - sa;
      return (b.phone.reviewCount || 0) - (a.phone.reviewCount || 0);
    })
    .slice(0, def.limit ?? 10);
}
