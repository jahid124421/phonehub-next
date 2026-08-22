import Link from "next/link";
import { type Product, getScoreForProduct } from "@/lib/data";
import CompareButton from "./CompareButton";
import ProductImage from "./ProductImage";
import ScoreBadge from "./ScoreBadge";

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  // Ratings are on a 0–5 scale
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
      // Half star via CSS overlay — no SVG gradient IDs, so no cross-card collisions
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

export default function PhoneCard({ product }: { product: Product }) {
  const fallback = product.fallbackImg ? `/${product.fallbackImg}` : "/img/no-image.svg";
  const score = getScoreForProduct(product.id);

  return (
    <div className="card card-compact bg-base-200 border border-base-300 hover:border-primary transition-all hover:-translate-y-1 duration-200">
      <Link href={`/phone/${product.id}`} className="block">
        {/* Image area */}
        <figure className="relative aspect-square product-img-bg overflow-hidden">
          <ProductImage src={product.image} alt={product.name} fallback={fallback} />
          {/* Score badge top-right */}
          {score && (
            <div className="absolute top-2 right-2 z-10">
              <ScoreBadge score={score} size="compact" />
            </div>
          )}
        </figure>

        {/* Card body */}
        <div className="card-body p-4 pb-2 gap-2">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{product.name}</h3>
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
          <div className="flex items-center justify-between mt-1">
            <div>
              {product.basePrice > 0 ? (
                <span className="text-base font-bold text-primary">
                  ${product.basePrice.toLocaleString()}
                </span>
              ) : (
                <span className="text-sm text-base-content/60 italic">Check price</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      {/* Compare button sits outside the Link — interactive elements are invalid inside anchors */}
      <div className="flex justify-end px-4 pb-4">
        <CompareButton productId={product.id} />
      </div>
    </div>
  );
}
