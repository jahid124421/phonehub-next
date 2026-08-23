"use client";

import { useState, useMemo } from "react";
import { getAllProducts, getScoreForProduct, type Product } from "@/lib/data";
import type { PhoneHubScore } from "@/lib/score-calculator";
import ProductImage from "@/components/ProductImage";
import ScoreBadge from "@/components/ScoreBadge";
import { PriceDisplay } from "@/components/CurrencyPicker";
import Link from "next/link";

type TabKey = "value-kings" | "budget-steals" | "price-drops";
type CategoryFilter = "all" | "phone" | "monitor" | "router";
type SortKey = "best-value" | "lowest-price" | "highest-score";

interface DealProduct {
  product: Product;
  score: PhoneHubScore;
  categoryAvgPrice?: number;
  savingsPercent?: number;
}

export default function DealsClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("value-kings");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("best-value");

  const allProducts = useMemo(() => getAllProducts(), []);

  // Calculate category average prices
  const categoryAvgPrices = useMemo(() => {
    const categoryPrices: Record<string, number[]> = {};
    allProducts.forEach((p) => {
      if (p.basePrice > 0) {
        if (!categoryPrices[p.category]) categoryPrices[p.category] = [];
        categoryPrices[p.category].push(p.basePrice);
      }
    });
    const avgs: Record<string, number> = {};
    Object.entries(categoryPrices).forEach(([cat, prices]) => {
      avgs[cat] = prices.reduce((a, b) => a + b, 0) / prices.length;
    });
    return avgs;
  }, [allProducts]);

  // Get deals for each tab
  const deals = useMemo(() => {
    const result: Record<TabKey, DealProduct[]> = {
      "value-kings": [],
      "budget-steals": [],
      "price-drops": [],
    };

    allProducts.forEach((product) => {
      const score = getScoreForProduct(product.id);
      if (!score) return;

      // Value Kings: highest value score
      result["value-kings"].push({ product, score });

      // Budget Steals: under $300 with highest overall scores
      if (product.basePrice > 0 && product.basePrice < 300) {
        result["budget-steals"].push({ product, score });
      }

      // Price Drops: price significantly below category average
      const avgPrice = categoryAvgPrices[product.category];
      if (product.basePrice > 0 && avgPrice && product.basePrice < avgPrice * 0.8) {
        const savingsPercent = Math.round(((avgPrice - product.basePrice) / avgPrice) * 100);
        result["price-drops"].push({ product, score, categoryAvgPrice: avgPrice, savingsPercent });
      }
    });

    return result;
  }, [allProducts, categoryAvgPrices]);

  // Filter and sort
  const filteredDeals = useMemo(() => {
    let items = deals[activeTab];

    // Category filter
    if (categoryFilter !== "all") {
      items = items.filter((d) => d.product.category === categoryFilter);
    }

    // Sort (with tie-breakers so equal scores still order sensibly)
    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case "best-value":
          return (
            b.score.value - a.score.value ||
            b.score.total - a.score.total ||
            (a.product.basePrice || 999999) - (b.product.basePrice || 999999)
          );
        case "lowest-price":
          return (a.product.basePrice || 999999) - (b.product.basePrice || 999999);
        case "highest-score":
          return b.score.total - a.score.total || b.score.value - a.score.value;
        default:
          return 0;
      }
    });

    return items.slice(0, 24); // Limit to 24 items
  }, [deals, activeTab, categoryFilter, sortBy]);

  const tabs = [
    { key: "value-kings" as TabKey, label: "Value Kings", icon: "👑" },
    { key: "budget-steals" as TabKey, label: "Budget Steals", icon: "💰" },
    { key: "price-drops" as TabKey, label: "Price Drops", icon: "📉" },
  ];

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "phone", label: "Phones" },
    { key: "monitor", label: "Monitors" },
    { key: "router", label: "Routers" },
  ];

  const sorts: { key: SortKey; label: string }[] = [
    { key: "best-value", label: "Best Value" },
    { key: "lowest-price", label: "Lowest Price" },
    { key: "highest-score", label: "Highest Score" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold">Best Deals on PhoneHub</h1>
        <p className="text-base-content/60 text-lg max-w-2xl mx-auto">
          Discover the best value-for-money products based on our PhoneHub Score. 
          Find deals that give you the most specs for your money.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn ${activeTab === tab.key ? "btn-primary" : "btn-ghost"}`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-base-content/70">Category:</span>
          <div className="flex gap-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`btn btn-sm ${categoryFilter === cat.key ? "btn-primary" : "btn-ghost"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-base-content/70">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="select select-bordered select-sm"
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deals grid */}
      {filteredDeals.length === 0 ? (
        <div className="text-center py-16 text-base-content/50">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium">No deals found</p>
          <p className="text-sm mt-2">Try changing the category or tab</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDeals.map(({ product, score, savingsPercent }) => (
            <Link
              key={product.id}
              href={`/phone/${product.id}`}
              className="group card bg-base-200 border border-base-300 hover:border-primary/50 transition-all hover:shadow-lg"
            >
              {/* Image */}
              <div className="aspect-square product-img-bg rounded-t-2xl overflow-hidden relative">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  fallback={product.fallbackImg ? `/${product.fallbackImg}` : "/img/no-image.svg"}
                />
                {savingsPercent && savingsPercent > 0 && (
                  <div className="absolute top-3 right-3 badge badge-error badge-lg font-bold">
                    Save {savingsPercent}%
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="card-body p-4 space-y-3">
                <div>
                  <div className="text-xs text-base-content/50 uppercase font-semibold mb-1">
                    {product.brand}
                  </div>
                  <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </div>

                {/* Price */}
                {product.basePrice > 0 && (
                  <div className="text-2xl font-extrabold text-primary">
                    <PriceDisplay amount={product.basePrice} />
                  </div>
                )}

                {/* Scores */}
                <div className="flex items-center justify-between">
                  <ScoreBadge score={score} size="compact" />
                  <div className="text-right">
                    <div className="text-xs text-base-content/50">Value Score</div>
                    <div className="text-lg font-bold text-success">{score.value}</div>
                  </div>
                </div>

                {/* Value bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-base-content/60">Value for Money</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-success to-success/70"
                      style={{ width: `${score.value}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
