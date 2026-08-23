'use client';

import { useState } from 'react';
import type { PhoneHubScore } from '@/lib/score-calculator';
import { scoreColor } from "@/lib/score-color";



function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Below Avg';
}

interface ScoreBadgeProps {
  score: PhoneHubScore | null | undefined;
  size?: 'compact' | 'large';
  showBreakdown?: boolean;
}

export default function ScoreBadge({ score, size = 'compact', showBreakdown: initialBreakdown = false }: ScoreBadgeProps) {
  const [expanded, setExpanded] = useState(initialBreakdown);

  if (!score) return null;

  const dim = size === 'large' ? 64 : 40;
  const stroke = size === 'large' ? 5 : 3.5;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score.total / 100) * circumference;
  const color = scoreColor(score.total);
  const fontSize = size === 'large' ? 18 : 12;
  const labelSize = size === 'large' ? 'text-xs' : 'text-[9px]';

  const categories = [
    { label: 'Display', value: score.display, icon: '🖥' },
    { label: 'Camera', value: score.camera, icon: '📷' },
    { label: 'Performance', value: score.performance, icon: '⚡' },
    { label: 'Battery', value: score.battery, icon: '🔋' },
    { label: 'Value', value: score.value, icon: '💰' },
    { label: 'Build', value: score.build, icon: '🏗' },
  ];

  return (
    <div className="relative inline-block">
      {/* Badge button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded); }}
        className="flex flex-col items-center gap-0.5 group cursor-pointer"
        title={`PhoneHub Score: ${score.total}/100 — ${scoreLabel(score.total)}`}
        aria-label={`PhoneHub Score ${score.total} out of 100`}
      >
        <svg width={dim} height={dim} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-base-content/10"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Score number overlay */}
        <span
          className="absolute font-bold leading-none pointer-events-none"
          style={{
            color,
            fontSize,
            top: size === 'large' ? 18 : 10,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {score.total}
        </span>
        <span className={`${labelSize} font-semibold text-base-content/60 group-hover:text-base-content/80 transition-colors leading-none`}>
          PH Score
        </span>
      </button>

      {/* Expanded breakdown popover */}
      {expanded && (
        <div
          className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-52 rounded-xl bg-base-200 border border-base-300 shadow-xl p-3 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">PhoneHub Score</span>
            <span className="text-sm font-extrabold" style={{ color }}>{score.total}/100</span>
          </div>
          <div className="text-xs text-base-content/50 mb-2">{scoreLabel(score.total)}</div>
          {categories.map(({ label, value, icon }) => {
            const catColor = scoreColor(value);
            return (
              <div key={label} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-base-content/70">
                    <span className="mr-1">{icon}</span>{label}
                  </span>
                  <span className="font-semibold" style={{ color: catColor }}>{value}</span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${value}%`, backgroundColor: catColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
