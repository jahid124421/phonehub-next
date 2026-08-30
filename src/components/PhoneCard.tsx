import Link from "next/link";
import type { Product } from "@/lib/data";
import type { PhoneHubScore } from "@/lib/score-calculator";
import { priceLabel } from "@/lib/price";
import CompareButton from "./CompareButton";
import ProductImage from "./ProductImage";
import ScoreBadge from "./ScoreBadge";

/**
 * Product shape for card grids: a full Product, optionally carrying its
 * pre-computed score + editorial badge. MUST never import @/lib/data at runtime.
 */
export type CardProduct = Product & { score?: PhoneHubScore | null };

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const fullBase = Math.floor(rating);
  const frac = rating - fullBase;
  const full = frac >= 0.75 ? fullBase + 1 : fullBase;
  const halfAt = frac >= 0.25 && frac < 0.75 ? fullBase : -1;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <svg key={i} className="w-3.5 h-3.5 text-warning" viewBox="0 0 24 24" fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      );
    } else if (i === halfAt) {
      stars.push(
        <span key={i} className="relative inline-block w-3.5 h-3.5">
          <svg className="absolute inset-0 w-3.5 h-3.5 text-base-content/20" viewBox="0 0 24 24" fill="currentColor">
            <path d={STAR_PATH} />
          </svg>
          <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
            <svg className="w-3.5 h-3.5 text-warning" viewBox="0 0 24 24" fill="currentColor">
              <path d={STAR_PATH} />
            </svg>
          </span>
        </span>
      );
    } else {
      stars.push(
        <svg key={i} className="w-3.5 h-3.5 text-base-content/20" viewBox="0 0 24 24" fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      );
    }
  }
  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      <span className="text-sm text-base-content/60">
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}

function editorialBadge(p: Product, score: PhoneHubScore | null | undefined): { label: string; bg: string } | null {
  if (!score) return null;
  if (score.total >= 88) return { label: "Editor's choice", bg: "#5B8CFF" };
  if (score.value >= 85) return { label: "Best value", bg: "#0EA5E9" };
  if (score.battery >= 85) return { label: "Battery pick", bg: "#10B981" };
  return null;
}

function specChips(p: Product): string[] {
  const qs = p.quickSpecs || {};
  // Prefer 2 most meaningful specs for the category
  const picks: string[] = [];
  if (qs.display) picks.push(qs.display);
  else if (qs.chipset) picks.push(qs.chipset);
  if (qs.battery) picks.push(qs.battery);
  else if (qs.camera) picks.push(qs.camera);
  else if (qs.memory) picks.push(qs.memory);
  return picks.slice(0, 2).filter(Boolean);
}

export default function PhoneCard({ product, score = null }: { product: Product; score?: PhoneHubScore | null }) {
  const fallback = product.fallbackImg ? `/${product.fallbackImg}` : "/img/no-image.svg";
  const price = priceLabel(product.basePrice);
  const badge = editorialBadge(product, score);
  const chips = specChips(product);

  return (
    <div className="card card-compact bg-base-200 border border-base-300 overflow-hidden" style={{ borderRadius: 14 }}>
      <Link href={`/phone/${product.id}`} className="block">
        <figure className="relative aspect-square bg-base-300 overflow-hidden">
          <ProductImage src={product.image} alt={product.name} fallback={fallback} />
          {badge && (
            <span
              style={{ background: badge.bg, color: "#fff" }}
              className="absolute left-2 top-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase"
            >
              {badge.label}
            </span>
          )}
          {score && (
            <div className="absolute top-2 right-2 z-10">
              <ScoreBadge score={score} size="compact" />
            </div>
          )}
        </figure>
        <div className="card-body p-4 pb-2 gap-1">
          <h3 className="text-[13px] font-bold leading-snug line-clamp-2" style={{ minHeight: 36 }}>{product.name}</h3>
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {chips.map((c) => (
                <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-base-100 border border-base-300 text-base-content/60" style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="mt-1.5">{price ? <span className="text-[14px] font-extrabold" style={{ color: "var(--primary)" }}>{price}</span> : <span className="text-sm text-base-content/60 italic">Check price</span>}</div>
        </div>
      </Link>
      <div className="flex justify-end px-4 pb-3">
        <CompareButton productId={product.id} />
      </div>
    </div>
  );
}
