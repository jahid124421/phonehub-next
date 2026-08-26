import type { Metadata } from "next";
import { getAllProducts, getScoreForProduct } from "@/lib/data";
import DealsClient, { type SlimDeal } from "./DealsClient";

export const metadata: Metadata = {
  title: "Best Value Picks — PhoneHub",
  description:
    "Find the best specs-per-dollar products on PhoneHub. Value kings and budget steals ranked by PhoneHub Score against estimated launch prices (MSRP), across phones, monitors, and routers.",
};

// Computed server-side so the client never bundles the full products.json.
// Only slim fields for the top candidates cross to the browser.
const MAX_PER_TAB = 100;

function toSlim(p: ReturnType<typeof getAllProducts>[number], score: NonNullable<ReturnType<typeof getScoreForProduct>>): SlimDeal {
  return {
    id: p.id,
    brand: p.brand,
    name: p.name,
    category: p.category,
    image: p.image,
    fallbackImg: p.fallbackImg,
    basePrice: p.basePrice,
    score,
  };
}

export default function DealsPage() {
  const withScores: SlimDeal[] = [];
  for (const p of getAllProducts()) {
    const score = getScoreForProduct(p.id);
    if (!score) continue;
    withScores.push(toSlim(p, score));
  }

  // Value Kings: highest specs-per-dollar (value score vs estimated MSRP)
  const valueKings = [...withScores]
    .sort((a, b) => b.score.value - a.score.value)
    .slice(0, MAX_PER_TAB);

  // Budget Steals: under $300 estimated, highest overall scores
  const budgetSteals = withScores
    .filter((d) => d.basePrice > 0 && d.basePrice < 300)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, MAX_PER_TAB);

  return <DealsClient valueKings={valueKings} budgetSteals={budgetSteals} />;
}
