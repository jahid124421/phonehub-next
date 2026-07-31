"use client";

import { useState, useMemo } from "react";
import type { BenchmarkData } from "@/lib/data";

interface BenchmarkRow extends BenchmarkData {
  id: string;
  name: string;
  brand: string;
  image: string;
}

type SortField =
  | "geekbench.single"
  | "geekbench.multi"
  | "antutu.total"
  | "antutu.cpu"
  | "antutu.gpu"
  | "antutu.mem"
  | "antutu.ux";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "antutu.total", label: "AnTuTu Total" },
  { value: "geekbench.single", label: "Geekbench Single" },
  { value: "geekbench.multi", label: "Geekbench Multi" },
  { value: "antutu.cpu", label: "AnTuTu CPU" },
  { value: "antutu.gpu", label: "AnTuTu GPU" },
  { value: "antutu.mem", label: "AnTuTu Memory" },
  { value: "antutu.ux", label: "AnTuTu UX" },
];

function getVal(obj: any, path: string): number {
  return path.split(".").reduce((o: any, k: string) => o?.[k], obj) || 0;
}

export default function BenchmarksClient({ entries }: { entries: BenchmarkRow[] }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<SortField>("antutu.total");

  const filtered = useMemo(() => {
    let result = [...entries];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.brand.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => getVal(b, activeTab) - getVal(a, activeTab));
    return result;
  }, [entries, search, activeTab]);

  const maxScores = useMemo(() => {
    const maxes: Record<string, number> = {};
    for (const opt of SORT_OPTIONS) {
      maxes[opt.value] = Math.max(...entries.map((e) => getVal(e, opt.value)), 1);
    }
    return maxes;
  }, [entries]);

  const handleTabClick = (field: SortField) => {
    setActiveTab(field);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search phones..."
          className="input input-bordered flex-1 bg-base-200 border-base-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {SORT_OPTIONS.slice(0, 4).map((opt) => (
          <button
            key={opt.value}
            className={`btn btn-sm justify-center ${
              activeTab === opt.value
                ? "btn-primary"
                : "btn-ghost border border-base-300"
            }`}
            onClick={() => handleTabClick(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-200">
        <table className="table table-sm w-full">
          <thead>
            <tr className="border-b border-base-300">
              <th className="w-12">#</th>
              <th>Phone</th>
              <th className="w-20 cursor-pointer hover:text-primary" onClick={() => handleTabClick("geekbench.single")}>
                GB Single {activeTab === "geekbench.single" && "▲"}
              </th>
              <th className="w-20 cursor-pointer hover:text-primary" onClick={() => handleTabClick("geekbench.multi")}>
                GB Multi {activeTab === "geekbench.multi" && "▲"}
              </th>
              <th className="w-24 cursor-pointer hover:text-primary" onClick={() => handleTabClick("antutu.total")}>
                AnTuTu {activeTab === "antutu.total" && "▲"}
              </th>
              <th className="w-48 hidden lg:table-cell">Score Bar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => {
              const score = getVal(entry, activeTab);
              const maxScore = maxScores[activeTab];
              const pct = Math.round((score / maxScore) * 100);

              return (
                <tr key={entry.id} className="hover border-b border-base-300/50">
                  <td className="font-mono text-base-content/50">{idx + 1}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      {entry.image && (
                        <img
                          src={entry.image}
                          alt={entry.name}
                          className="w-8 h-8 rounded object-cover"
                          loading="lazy"
                        />
                      )}
                      <div>
                        <a
                          href={`/phone/${entry.id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {entry.name}
                        </a>
                        <div className="text-xs text-base-content/50">{entry.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-sm">{entry.geekbench?.single?.toLocaleString() ?? '—'}</td>
                  <td className="font-mono text-sm">{entry.geekbench?.multi?.toLocaleString() ?? '—'}</td>
                  <td className="font-mono text-sm font-semibold text-primary">
                    {entry.antutu?.total?.toLocaleString() ?? '—'}
                  </td>
                  <td className="hidden lg:table-cell">
                    <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-base-content/50">
            No phones found matching &quot;{search}&quot;
          </div>
        )}
      </div>

      <p className="text-xs text-base-content/40 text-center">
        Benchmark scores are approximate and may vary by device configuration and test conditions.
      </p>
    </div>
  );
}
