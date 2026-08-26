"use client";

import { useMemo, useState } from "react";
import type { UpcomingDevice } from "@/lib/data";
import { toneColor, toneTint } from "@/lib/score-color";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: toneTint("excellent"), text: toneColor("excellent"), label: "Confirmed" },
  leaked: { bg: toneTint("good"), text: toneColor("good"), label: "Leaked" },
  rumored: { bg: toneTint("unknown"), text: toneColor("unknown"), label: "Rumored" },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: toneColor("excellent"),
  medium: toneColor("good"),
  low: toneColor("unknown"),
};

/** Parse "Q3 2026" into a sortable number (2026*4 + 3). Unknown → far future. */
function getQuarterSort(q: string): number {
  const match = q.match(/Q([1-4])\s*(\d{4})/i);
  if (!match) return 99999;
  return parseInt(match[2], 10) * 4 + parseInt(match[1], 10);
}

/** Rough months until the START of a quarter like "Q3 2026". Negative = already passed. */
function monthsUntilQuarter(q: string): number | null {
  const match = q.match(/Q([1-4])\s*(\d{4})/i);
  if (!match) return null;
  const quarter = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  const now = new Date();
  const startMonth = (quarter - 1) * 3; // 0-indexed start month of the quarter
  return (year - now.getFullYear()) * 12 + (startMonth - now.getMonth());
}

function countdownLabel(q: string): string | null {
  const months = monthsUntilQuarter(q);
  if (months === null) return null;
  if (months < 0) return "Expected soon";
  if (months === 0) return "This quarter";
  if (months < 3) return `~${months} mo away`;
  return `~${Math.round(months / 3)} qtrs away`;
}

export default function UpcomingClient({ devices }: { devices: UpcomingDevice[] }) {
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const brands = useMemo(() => {
    return Array.from(new Set(devices.map((d) => d.brand))).sort();
  }, [devices]);

  const categories = useMemo(() => {
    return Array.from(new Set(devices.map((d) => d.category))).sort();
  }, [devices]);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (brandFilter !== "all" && d.brand !== brandFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
      return true;
    });
  }, [devices, brandFilter, statusFilter, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, UpcomingDevice[]>();
    for (const d of filtered) {
      const q = d.expectedLaunch;
      if (!map.has(q)) map.set(q, []);
      map.get(q)!.push(d);
    }
    return Array.from(map.entries()).sort((a, b) => getQuarterSort(a[0]) - getQuarterSort(b[0]));
  }, [filtered]);

  const selectStyle = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>Filter:</label>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="leaked">Leaked</option>
          <option value="rumored">Rumored</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <span className="text-sm" style={{ color: "var(--muted)", marginLeft: "auto" }}>
          {filtered.length} device{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      {grouped.map(([quarter, items]) => (
        <div key={quarter}>
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "var(--primary)",
                flexShrink: 0,
              }}
            />
            <h2 className="text-xl font-bold">{quarter}</h2>
            {countdownLabel(quarter) && (
              <span
                className="text-xs font-semibold"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  padding: "2px 10px",
                  borderRadius: 20,
                  whiteSpace: "nowrap",
                }}
              >
                {countdownLabel(quarter)}
              </span>
            )}
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span className="text-sm" style={{ color: "var(--muted)" }}>{items.length} device{items.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((device) => {
              const statusStyle = STATUS_COLORS[device.status] || STATUS_COLORS.rumored;
              const confColor = CONFIDENCE_COLORS[device.confidence] || toneColor("unknown");
              return (
                <div
                  key={device.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium" style={{ color: "var(--muted)" }}>{device.brand}</div>
                      <div className="font-semibold text-base">{device.name}</div>
                    </div>
                    <span
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 20,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Price & confidence */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold" style={{ color: "var(--primary)" }}>{device.expectedPrice}</span>
                    <span style={{ color: "var(--muted)" }}>•</span>
                    <span style={{ color: "var(--muted)" }}>{device.category}</span>
                    <span style={{ color: "var(--muted)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: confColor, display: "inline-block" }} />
                      <span style={{ fontSize: 11 }}>{device.confidence} confidence</span>
                    </span>
                  </div>

                  {/* Specs */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                    {device.expectedSpecs.display && (
                      <div style={{ color: "var(--muted)" }}>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>Display:</span> {device.expectedSpecs.display}
                      </div>
                    )}
                    {device.expectedSpecs.chipset && (
                      <div style={{ color: "var(--muted)" }}>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>Chip:</span> {device.expectedSpecs.chipset}
                      </div>
                    )}
                    {device.expectedSpecs.camera && (
                      <div style={{ color: "var(--muted)" }}>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>Camera:</span> {device.expectedSpecs.camera}
                      </div>
                    )}
                    {device.expectedSpecs.battery && (
                      <div style={{ color: "var(--muted)" }}>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>Battery:</span> {device.expectedSpecs.battery}
                      </div>
                    )}
                    {device.expectedSpecs.os && (
                      <div style={{ color: "var(--muted)" }}>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>OS:</span> {device.expectedSpecs.os}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--muted)" }}>
          No devices match the selected filters.
        </div>
      )}
    </div>
  );
}
