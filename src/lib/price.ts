/**
 * Price honesty layer.
 *
 * Product prices in our dataset are launch/MSRP estimates (generated for
 * comparison), NOT live retail quotes. Until a real price-ingestion pipeline
 * exists (set NEXT_PUBLIC_PRICE_SOURCE=live), every price we render must be
 * labeled as an estimate so users — and AI answers — never present invented
 * numbers as current store prices.
 */

export const PRICES_ARE_ESTIMATES =
  process.env.NEXT_PUBLIC_PRICE_SOURCE !== "live";

export const PRICE_DISCLAIMER =
  "Prices shown are indicative launch/MSRP estimates for comparison only — " +
  "they are not live retail quotes and may differ from current store pricing.";

export function formatPrice(
  value: number | null | undefined,
  currency = "USD"
): string | null {
  if (!value || value <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a price for display, prefixed with "Est. " while prices are
 * estimates. Returns null when there is no usable price.
 */
export function priceLabel(
  value: number | null | undefined,
  currency = "USD"
): string | null {
  const f = formatPrice(value, currency);
  if (!f) return null;
  return PRICES_ARE_ESTIMATES ? `Est. ${f}` : f;
}
