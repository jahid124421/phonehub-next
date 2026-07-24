"use client";

import { useState, useEffect, useCallback } from "react";

const CCY_KEY = "ph_ccy";

const CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "BDT", label: "Bangladeshi Taka", symbol: "৳" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", label: "South Korean Won", symbol: "₩" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", label: "Swiss Franc", symbol: "Fr" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "MYR", label: "Malaysian Ringgit", symbol: "RM" },
  { code: "THB", label: "Thai Baht", symbol: "฿" },
  { code: "IDR", label: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", label: "Philippine Peso", symbol: "₱" },
  { code: "PKR", label: "Pakistani Rupee", symbol: "Rs" },
  { code: "LKR", label: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "NPR", label: "Nepalese Rupee", symbol: "Rs" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
];

type RatesMap = Record<string, number>;

let cachedRates: RatesMap | null = null;
let ratesPromise: Promise<RatesMap> | null = null;

async function fetchRates(): Promise<RatesMap> {
  if (cachedRates) return cachedRates;
  if (ratesPromise) return ratesPromise;

  ratesPromise = fetch("https://open.er-api.com/v6/latest/USD")
    .then((res) => res.json())
    .then((data: { rates?: RatesMap }) => {
      cachedRates = data.rates ?? {};
      return cachedRates;
    })
    .catch(() => {
      cachedRates = {};
      return cachedRates;
    });

  return ratesPromise;
}

export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function convertFromUSD(usdAmount: number, currency: string, rates: RatesMap): number {
  const rate = rates[currency];
  if (!rate || currency === "USD") return usdAmount;
  return usdAmount * rate;
}

export function PriceDisplay({ amount, className }: { amount: number; className?: string }) {
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState<RatesMap>({});

  useEffect(() => {
    const stored = localStorage.getItem(CCY_KEY);
    if (stored) setCurrency(stored);

    fetchRates().then(setRates);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      setCurrency(detail);
    };
    window.addEventListener("currency-changed", handler);
    return () => window.removeEventListener("currency-changed", handler);
  }, []);

  const converted = convertFromUSD(amount, currency, rates);
  const formatted = formatPrice(converted, currency);

  return <span className={className}>{formatted}</span>;
}

export default function CurrencyPicker() {
  const [currency, setCurrency] = useState("USD");
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CCY_KEY);
    if (stored) {
      setCurrency(stored);
      setDetected(true);
      return;
    }

    // Auto-detect from IP
    fetch("https://ipwho.is/?fields=currency_code")
      .then((res) => res.json())
      .then((data: { currency_code?: string }) => {
        const code = data.currency_code;
        if (code && CURRENCIES.some((c) => c.code === code)) {
          setCurrency(code);
          localStorage.setItem(CCY_KEY, code);
          window.dispatchEvent(new CustomEvent("currency-changed", { detail: code }));
        }
      })
      .catch(() => {
        // Silently fail, keep USD
      })
      .finally(() => setDetected(true));
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCurrency(code);
    localStorage.setItem(CCY_KEY, code);
    window.dispatchEvent(new CustomEvent("currency-changed", { detail: code }));
  }, []);

  return (
    <select
      value={currency}
      onChange={handleChange}
      disabled={!detected}
      aria-label="Select currency"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        height: 40,
        borderRadius: 10,
        padding: "0 8px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 13,
        flex: "none",
        outline: "none",
      }}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
    </select>
  );
}
