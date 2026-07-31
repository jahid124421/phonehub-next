"use client";

import { useState } from "react";
import Link from "next/link";
import type { PhoneHubScore } from "@/lib/score-calculator";

interface EnrichedGuideProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  basePrice: number;
  score: PhoneHubScore | null;
  reasoning: string;
}

interface EnrichedGuide {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  products: string[];
  reasoning: Record<string, string>;
  enrichedProducts: EnrichedGuideProduct[];
}

function ScoreBadge({ score }: { score: PhoneHubScore | null }) {
  if (!score) return <span style={{ color: "var(--muted)", fontSize: 13 }}>No score</span>;
  const color =
    score.total >= 85 ? "#22c55e" :
    score.total >= 70 ? "#eab308" :
    score.total >= 50 ? "#f97316" : "#ef4444";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        color,
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {score.total}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = { 1: "#fbbf24", 2: "#94a3b8", 3: "#d97706" };
  const bg = colors[rank] || "var(--border)";
  const text = rank <= 3 ? "#000" : "var(--muted)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: bg,
        color: text,
        fontWeight: 800,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      #{rank}
    </span>
  );
}

function GuideCard({ guide, onClick }: { guide: EnrichedGuide; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "transform 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      <div className="flex items-center gap-3">
        <span style={{ fontSize: 32 }}>{guide.icon}</span>
        <div>
          <div className="font-semibold text-base">{guide.title}</div>
          <div className="text-xs" style={{ color: "var(--muted)", textTransform: "capitalize" }}>{guide.category}</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{guide.description}</p>
      <div className="flex items-center gap-2 mt-auto">
        <span className="text-xs font-medium px-3 py-1" style={{ background: "var(--nav-hover-bg)", borderRadius: 20, color: "var(--primary)" }}>
          {guide.enrichedProducts.length} picks
        </span>
        <span className="text-xs" style={{ color: "var(--primary)", marginLeft: "auto" }}>View guide →</span>
      </div>
    </button>
  );
}

function GuideDetail({ guide, onBack }: { guide: EnrichedGuide; onBack: () => void }) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--primary)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
          padding: 0,
        }}
      >
        ← Back to all guides
      </button>

      {/* Guide header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: 40 }}>{guide.icon}</span>
          <div>
            <h2 className="text-2xl font-bold">{guide.title}</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{guide.description}</p>
          </div>
        </div>
      </div>

      {/* Ranked product list */}
      <div className="space-y-3">
        {guide.enrichedProducts.map((product, index) => (
          <Link
            key={product.id}
            href={`/phone/${product.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <RankBadge rank={index + 1} />

            {/* Image */}
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: 56,
                height: 56,
                objectFit: "contain",
                borderRadius: 8,
                background: "var(--nav-hover-bg)",
                flexShrink: 0,
                padding: 4,
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs" style={{ color: "var(--muted)", textTransform: "capitalize" }}>{product.brand}</div>
              <div className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{product.name}</div>
              {product.reasoning && (
                <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>{product.reasoning}</div>
              )}
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0" style={{ minWidth: 70 }}>
              <div className="text-sm font-bold" style={{ color: "var(--text)" }}>
                ${product.basePrice.toLocaleString()}
              </div>
            </div>

            {/* Score */}
            <ScoreBadge score={product.score} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function GuidesClient({ guides }: { guides: EnrichedGuide[] }) {
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  const activeGuide = activeGuideId ? guides.find((g) => g.id === activeGuideId) : null;

  if (activeGuide) {
    return <GuideDetail guide={activeGuide} onBack={() => setActiveGuideId(null)} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {guides.map((guide) => (
        <GuideCard key={guide.id} guide={guide} onClick={() => setActiveGuideId(guide.id)} />
      ))}
    </div>
  );
}
