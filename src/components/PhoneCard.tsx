import Link from "next/link";
import { type Product, getScoreForProduct } from "@/lib/data";
import CompareButton from "./CompareButton";
import ProductImage from "./ProductImage";
import ScoreBadge from "./ScoreBadge";

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating / 2);
  const hasHalf = rating % 2 >= 1;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <svg key={i} className="w-3.5 h-3.5 text-warning fill-warning" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <svg key={i} className="w-3.5 h-3.5 text-warning" viewBox="0 0 24 24">
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#half-${i})`}
            stroke="currentColor"
            strokeWidth={1}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} className="w-3.5 h-3.5 text-base-content/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
        <figure className="relative aspect-square bg-base-300 overflow-hidden">
          <ProductImage src={product.image} alt={product.name} fallback={fallback} />
          {/* Score badge top-right */}
          {score && (
            <div className="absolute top-2 right-2 z-10">
              <ScoreBadge score={score} size="compact" />
            </div>
          )}
        </figure>

        {/* Card body */}
        <div className="card-body p-4 gap-2">
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

      {/* Compare button - inside card, outside link */}
      <div className="px-4 pb-4 flex justify-end">
        <CompareButton productId={product.id} />
      </div>
    </div>
  );
}
