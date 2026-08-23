/**
 * The single source of truth for "how good is this number" colouring.
 *
 * Five components previously inlined their own hex ramp (compare, guides,
 * phone detail, upcoming, plus a now-deleted health badge) with three different
 * ambers and two threshold sets, none of which changed in the light theme —
 * #eab308 on white measures 1.9:1, well under the 4.5:1 AA floor.
 *
 * These return CSS custom properties, so the ramp re-themes automatically.
 * Token values live in globals.css and are AA-compliant in both themes.
 */

export type ScoreTone = "excellent" | "good" | "fair" | "poor" | "unknown";

/** Shared thresholds, on a 0–100 scale. */
export function scoreTone(value: number | null | undefined): ScoreTone {
  if (value == null || !Number.isFinite(value)) return "unknown";
  if (value >= 80) return "excellent";
  if (value >= 60) return "good";
  if (value >= 40) return "fair";
  return "poor";
}

/** Foreground colour for a score — safe for text on any app surface. */
export function scoreColor(value: number | null | undefined): string {
  return `var(--score-${scoreTone(value)})`;
}

/**
 * Tinted background for a score chip. `color-mix` keeps the tint derived from
 * the same token, so it tracks the theme instead of hardcoding an alpha hex
 * like the old "#16a34a22" literals (which stayed dark-green in light mode).
 */
export function scoreTint(value: number | null | undefined): string {
  return `color-mix(in srgb, var(--score-${scoreTone(value)}) 16%, transparent)`;
}

/** Same ramp keyed by an explicit tone, for non-numeric states. */
export function toneColor(tone: ScoreTone): string {
  return `var(--score-${tone})`;
}

export function toneTint(tone: ScoreTone): string {
  return `color-mix(in srgb, var(--score-${tone}) 16%, transparent)`;
}
