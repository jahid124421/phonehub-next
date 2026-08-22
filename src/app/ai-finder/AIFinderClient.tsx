"use client";

import { useState, useCallback } from "react";
import {
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Tv,
  Monitor,
  Wifi,
  Camera,
  LayoutGrid,
  Camera as CameraIcon,
  BatteryFull,
  Zap,
  MonitorSmartphone,
  Gem,
  BadgeDollarSign,
  Star,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import ProductImage from "@/components/ProductImage";
import CompareButton from "@/components/CompareButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryOption {
  slug: string;
  label: string;
  icon: LucideIcon;
}

interface FeatureOption {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

interface ResultProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  image: string;
  fallbackImg: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  popularity: number;
  quickSpecs: Record<string, string>;
  relevanceScore: number;
  matchReasons: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: CategoryOption[] = [
  { slug: "phone", label: "Phone", icon: Smartphone },
  { slug: "laptop", label: "Laptop", icon: Laptop },
  { slug: "tablet", label: "Tablet", icon: Tablet },
  { slug: "smartwatch", label: "Smartwatch", icon: Watch },
  { slug: "tv", label: "TV", icon: Tv },
  { slug: "monitor", label: "Monitor", icon: Monitor },
  { slug: "router", label: "Router", icon: Wifi },
  { slug: "camera", label: "Camera", icon: Camera },
];

const FEATURES: FeatureOption[] = [
  { id: "camera", label: "Camera Quality", desc: "Great photos & video", icon: CameraIcon },
  { id: "battery", label: "Battery Life", desc: "All-day power", icon: BatteryFull },
  { id: "performance", label: "Performance", desc: "Gaming & speed", icon: Zap },
  { id: "display", label: "Display Quality", desc: "Vivid, sharp screen", icon: MonitorSmartphone },
  { id: "design", label: "Design & Build", desc: "Premium materials", icon: Gem },
  { id: "value", label: "Value for Money", desc: "Best bang for buck", icon: BadgeDollarSign },
];

const BUDGET_PRESETS = [
  { label: "Under $200", max: 200 },
  { label: "$200 – $500", min: 200, max: 500 },
  { label: "$500 – $1000", min: 500, max: 1000 },
  { label: "$1000+", min: 1000, max: 10000 },
];

const STEP_LABELS = ["Category", "Budget", "Features", "Results"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIFinderClient() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<number>(10000);
  const [features, setFeatures] = useState<string[]>([]);
  const [results, setResults] = useState<ResultProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMethod, setSearchMethod] = useState<string>("");

  const canProceed = useCallback(() => {
    if (step === 0) return true; // category is optional
    if (step === 1) return true;
    if (step === 2) return features.length > 0;
    return false;
  }, [step, features]);

  const toggleFeature = useCallback((id: string) => {
    setFeatures((prev) => {
      if (prev.includes(id)) return prev.filter((f) => f !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  const runSearch = useCallback(async () => {
    setIsLoading(true);
    setStep(3);

    const queryParts: string[] = [];
    if (category) {
      const catLabel = CATEGORIES.find((c) => c.slug === category)?.label || category;
      queryParts.push(catLabel);
    }
    for (const f of features) {
      const featLabel = FEATURES.find((ft) => ft.id === f)?.label || f;
      queryParts.push(featLabel.toLowerCase());
    }
    if (budgetMax < 10000) {
      queryParts.push(`under $${budgetMax}`);
    }

    const query = queryParts.join(" ") || "best products";

    try {
      const res = await fetch("/api/ai-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          filters: {
            ...(category ? { category } : {}),
            ...(budgetMax < 10000 ? { maxPrice: budgetMax } : {}),
            ...(features.length > 0 ? { features } : {}),
          },
        }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setSearchMethod(data.method || "keyword");
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, budgetMax, features]);

  const handleNext = useCallback(() => {
    if (step === 2) {
      runSearch();
    } else {
      setStep((s) => Math.min(s + 1, 3));
    }
  }, [step, runSearch]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setStep(0);
    setCategory("");
    setBudgetMax(10000);
    setFeatures([]);
    setResults([]);
    setSearchMethod("");
  }, []);

  const budgetLabel =
    budgetMax >= 10000 ? "No limit" : `$${budgetMax.toLocaleString()}`;

  return (
    <div className="container py-6 max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "AI Phone Finder" },
        ]}
      />

      {/* Header */}
      <div className="text-center mt-6 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          <Sparkles className="inline w-7 h-7 mr-2 text-primary" />
          AI Phone Finder
        </h1>
        <p className="text-base-content/60 mt-2">
          Answer a few quick questions and we&apos;ll find the perfect device for you
        </p>
      </div>

      {/* Progress Steps */}
      <ul className="steps steps-horizontal w-full mb-10">
        {STEP_LABELS.map((label, i) => (
          <li
            key={label}
            className={`step ${i <= step ? "step-primary" : ""} cursor-default`}
            data-content={i < step ? "✓" : i + 1}
          >
            {label}
          </li>
        ))}
      </ul>

      {/* ── Step 0: Category ── */}
      {step === 0 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold mb-1 text-center">
            What type of device are you looking for?
          </h2>
          <p className="text-base-content/50 text-sm text-center mb-6">
            Select a category or skip to see all products
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const selected = category === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setCategory(selected ? "" : cat.slug)}
                  className={`card card-compact border transition-all duration-200
                    ${
                      selected
                        ? "bg-primary/15 border-primary shadow-lg shadow-primary/10 -translate-y-0.5"
                        : "bg-base-200 border-base-300 hover:border-primary/50 hover:-translate-y-0.5"
                    }`}
                >
                  <div className="card-body items-center text-center p-4 gap-2">
                    <Icon
                      className={`w-7 h-7 ${selected ? "text-primary" : "text-base-content/60"}`}
                    />
                    <span className={`text-sm font-semibold ${selected ? "text-primary" : ""}`}>
                      {cat.label}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Any / Skip */}
            <button
              onClick={() => setCategory("")}
              className={`card card-compact border transition-all duration-200
                ${
                  !category
                    ? "bg-primary/15 border-primary shadow-lg shadow-primary/10 -translate-y-0.5"
                    : "bg-base-200 border-base-300 hover:border-primary/50 hover:-translate-y-0.5"
                }`}
            >
              <div className="card-body items-center text-center p-4 gap-2">
                <LayoutGrid
                  className={`w-7 h-7 ${!category ? "text-primary" : "text-base-content/60"}`}
                />
                <span className={`text-sm font-semibold ${!category ? "text-primary" : ""}`}>
                  Any
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Budget ── */}
      {step === 1 && (
        <div className="animate-fade-in max-w-xl mx-auto">
          <h2 className="text-xl font-bold mb-1 text-center">What&apos;s your budget?</h2>
          <p className="text-base-content/50 text-sm text-center mb-8">
            Set a maximum price or choose a preset range
          </p>

          {/* Current value display */}
          <div className="text-center mb-6">
            <span className="text-4xl font-extrabold text-primary">
              {budgetLabel}
            </span>
          </div>

          {/* Range slider */}
          <div className="px-2 mb-6">
            <input
              type="range"
              className="range range-primary"
              min={50}
              max={10000}
              step={50}
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-base-content/50 mt-1 px-0.5">
              <span>$50</span>
              <span>$2,500</span>
              <span>$5,000</span>
              <span>$7,500</span>
              <span>$10,000</span>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setBudgetMax(10000)}
              className={`btn btn-sm ${budgetMax >= 10000 ? "btn-primary" : "btn-ghost"}`}
            >
              No limit
            </button>
            {BUDGET_PRESETS.map((preset) => {
              const active =
                preset.max === budgetMax ||
                (preset.min !== undefined &&
                  budgetMax === preset.max);
              return (
                <button
                  key={preset.label}
                  onClick={() => setBudgetMax(preset.max)}
                  className={`btn btn-sm ${active ? "btn-primary" : "btn-ghost"}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 2: Features ── */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold mb-1 text-center">
            What matters most to you?
          </h2>
          <p className="text-base-content/50 text-sm text-center mb-6">
            Select up to 3 priorities ({features.length}/3 selected)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              const selected = features.includes(feat.id);
              const disabled = !selected && features.length >= 3;
              return (
                <button
                  key={feat.id}
                  onClick={() => !disabled && toggleFeature(feat.id)}
                  disabled={disabled}
                  className={`card card-compact border transition-all duration-200 text-left
                    ${
                      selected
                        ? "bg-primary/15 border-primary shadow-lg shadow-primary/10 -translate-y-0.5"
                        : disabled
                          ? "bg-base-200 border-base-300 opacity-40 cursor-not-allowed"
                          : "bg-base-200 border-base-300 hover:border-primary/50 hover:-translate-y-0.5"
                    }`}
                >
                  <div className="card-body p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          selected ? "text-primary" : "text-base-content/60"
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${selected ? "text-primary" : ""}`}
                      >
                        {feat.label}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/50 leading-snug">
                      {feat.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Results ── */}
      {step === 3 && (
        <div className="animate-fade-in">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold">Finding your perfect match…</p>
                <p className="text-sm text-base-content/50 mt-1">
                  Analyzing products based on your preferences
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Results header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold">
                    {results.length > 0
                      ? `${results.length} matches found`
                      : "No matches found"}
                  </h2>
                  {searchMethod && (
                    <p className="text-xs text-base-content/50 mt-0.5">
                      Powered by {searchMethod === "hybrid" ? "AI + smart scoring" : "intelligent keyword matching"}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleReset} className="btn btn-sm btn-outline gap-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start Over
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="btn btn-sm btn-outline gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Refine
                  </button>
                </div>
              </div>

              {/* Summary chips */}
              <div className="flex flex-wrap gap-2 mb-5 justify-center items-center">
                {category && (
                  <span className="badge badge-primary badge-outline">
                    {CATEGORIES.find((c) => c.slug === category)?.label || category}
                  </span>
                )}
                {budgetMax < 10000 && (
                  <span className="badge badge-secondary badge-outline">
                    Under ${budgetMax.toLocaleString()}
                  </span>
                )}
                {features.map((f) => (
                  <span key={f} className="badge badge-accent badge-outline">
                    {FEATURES.find((ft) => ft.id === f)?.label || f}
                  </span>
                ))}
              </div>

              {/* Results grid */}
              {results.length > 0 ? (
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  }}
                >
                  {results.map((product) => (
                    <AIFinderCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-base-content/50">
                  <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-semibold">No products matched your criteria</p>
                  <p className="text-sm mt-1">
                    Try broadening your category, increasing your budget, or selecting different features.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Navigation buttons ── */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-10 max-w-xl mx-auto">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="btn btn-ghost gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn btn-primary gap-1"
          >
            {step === 2 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Find My Matches
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function AIFinderCard({ product }: { product: ResultProduct }) {
  const fallback = product.fallbackImg
    ? `/${product.fallbackImg}`
    : "/img/no-image.svg";

  // Star display
  const ratingDisplay = product.rating.toFixed(1);

  // Score badge color
  const scoreBadgeClass =
    product.relevanceScore >= 40
      ? "badge-primary"
      : product.relevanceScore >= 20
        ? "badge-secondary"
        : "badge-ghost";

  return (
    <div className="card card-compact bg-base-200 border border-base-300 hover:border-primary transition-all hover:-translate-y-1 duration-200 relative">
      {/* Relevance score badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className={`badge badge-sm ${scoreBadgeClass}`}>
          <Star className="w-3 h-3 mr-0.5" />
          {product.relevanceScore}
        </span>
      </div>

      <Link href={`/phone/${product.id}`} className="block">
        <figure className="relative aspect-square product-img-bg overflow-hidden">
          <ProductImage
            src={product.image}
            alt={product.name}
            fallback={fallback}
          />
        </figure>

        <div className="card-body p-4 gap-2">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Stars */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            <span className="text-sm text-base-content/60">
              {ratingDisplay} ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div>
            {product.basePrice > 0 ? (
              <span className="text-base font-bold text-primary">
                ${product.basePrice.toLocaleString()}
              </span>
            ) : (
              <span className="text-sm text-base-content/60 italic">
                Check price
              </span>
            )}
          </div>

          {/* Match reasons */}
          {product.matchReasons && product.matchReasons.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {product.matchReasons.slice(0, 2).map((reason) => (
                <p
                  key={reason}
                  className="text-xs text-base-content/50 flex items-start gap-1 leading-tight"
                >
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span className="line-clamp-1">{reason}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4 flex justify-end">
        <CompareButton productId={product.id} />
      </div>
    </div>
  );
}
