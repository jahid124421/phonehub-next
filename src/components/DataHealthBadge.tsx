"use client";

import { useState, useEffect, useRef } from "react";

interface HealthData {
  status: "healthy" | "warning" | "critical";
  timestamp: string;
  summary: {
    productCount: number;
    brandCount: number;
    newsCount: number;
  };
  metrics: {
    priceCoveragePercent: number;
    imageCoveragePercent: number;
    newsFreshnessPercent: number;
    brandLogoPercent: number;
    duplicateProductNames: number;
    freshNewsCount: number;
    staleNewsCount: number;
    productsWithPrice: number;
    productsWithImage: number;
  };
  warnings: string[];
}

const STATUS_CONFIG = {
  healthy: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.3)",
    label: "Healthy",
    icon: "●",
  },
  warning: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    label: "Warning",
    icon: "▲",
  },
  critical: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    label: "Critical",
    icon: "✕",
  },
};

export default function DataHealthBadge() {
  const [data, setData] = useState<HealthData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchHealth() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        }
      } catch {
        // silently fail — badge just won't show
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHealth();
    return () => { cancelled = true; };
  }, []);

  // Close tooltip on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (loading || !data) return null;

  const cfg = STATUS_CONFIG[data.status];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Badge button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Data health: ${cfg.label}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 10px",
          borderRadius: 9999,
          border: `1px solid ${cfg.border}`,
          background: cfg.bg,
          color: cfg.color,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          lineHeight: 1.4,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <span style={{ fontSize: 10 }}>{cfg.icon}</span>
        {cfg.label}
      </button>

      {/* Tooltip / modal */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 100,
            width: 300,
            padding: 16,
            borderRadius: 12,
            border: "1px solid var(--header-border, #333)",
            background: "var(--card-bg, #1a1a2e)",
            color: "var(--text, #e0e0e0)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ color: cfg.color, fontSize: 18 }}>{cfg.icon}</span>
            <strong style={{ color: cfg.color, fontSize: 14 }}>{cfg.label}</strong>
            <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.6 }}>
              {new Date(data.timestamp).toLocaleString()}
            </span>
          </div>

          {/* Summary row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            <StatBlock label="Products" value={data.summary.productCount} />
            <StatBlock label="Brands" value={data.summary.brandCount} />
            <StatBlock label="News" value={data.summary.newsCount} />
          </div>

          {/* Metrics */}
          <div style={{ borderTop: "1px solid var(--header-border, #333)", paddingTop: 10 }}>
            <MetricBar label="Price coverage" value={data.metrics.priceCoveragePercent} />
            <MetricBar label="Image coverage" value={data.metrics.imageCoveragePercent} />
            <MetricBar label="News freshness" value={data.metrics.newsFreshnessPercent} />
            <MetricBar label="Brand logos" value={data.metrics.brandLogoPercent} />
          </div>

          {/* Duplicates */}
          {data.metrics.duplicateProductNames > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              ⚠ {data.metrics.duplicateProductNames} duplicate product entries
            </div>
          )}

          {/* Warnings */}
          {data.warnings.length > 0 && (
            <div style={{ marginTop: 10, borderTop: "1px solid var(--header-border, #333)", paddingTop: 8 }}>
              {data.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 12, color: "#f59e0b", marginBottom: 2 }}>
                  ▸ {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: "6px 4px", borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 11, opacity: 0.6 }}>{label}</div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            borderRadius: 2,
            background: color,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
