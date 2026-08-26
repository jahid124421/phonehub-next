import { PRICES_ARE_ESTIMATES, PRICE_DISCLAIMER } from "@/lib/price";

/**
 * Small disclaimer shown wherever estimated prices are rendered.
 * Renders nothing once a live price source is configured
 * (NEXT_PUBLIC_PRICE_SOURCE=live).
 */
export default function PriceNote({ className = "" }: { className?: string }) {
  if (!PRICES_ARE_ESTIMATES) return null;
  return (
    <p className={`text-xs text-base-content/50 ${className}`}>
      {PRICE_DISCLAIMER}
    </p>
  );
}
