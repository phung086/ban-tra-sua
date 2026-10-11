/** Pure progress model for a tactile pour, in percentage points. */
export const POUR_RATES = { careful: 26, quick: 52 } as const;
export type PourSpeed = keyof typeof POUR_RATES;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Limit a background-tab frame to 100 ms; never add phantom tea on resume. */
export function advancePour(fill: number, elapsedMs: number, speed: PourSpeed, brewerLevel = 0): number {
  const safeFill = Number.isFinite(fill) ? clamp(fill, 0, 100) : 0;
  const safeElapsed = Number.isFinite(elapsedMs) ? clamp(elapsedMs, 0, 100) : 0;
  const upgradeFactor = 1 - Math.min(0.25, Math.max(0, brewerLevel) * 0.04);
  return clamp(safeFill + POUR_RATES[speed] * upgradeFactor * safeElapsed / 1000, 0, 100);
}

export type PourVerdict = 'perfect' | 'close' | 'off';
export function pourVerdict(fill: number, target: number, tolerance = 5): PourVerdict {
  const distance = Math.abs(fill - target);
  return distance <= tolerance ? 'perfect' : distance <= tolerance * 2 ? 'close' : 'off';
}

/** Actionable cue shown while the player is holding the pour button. */
export type PourCue = "empty" | "filling" | "approaching" | "release" | "over";
export function pourCue(fill: number, target: number, tolerance = 5): PourCue {
  const current = Number.isFinite(fill) ? clamp(fill, 0, 100) : 0;
  const goal = Number.isFinite(target) ? clamp(target, 0, 100) : 80;
  const margin = Number.isFinite(tolerance) ? clamp(tolerance, 0, 20) : 5;
  if (current <= 0) return "empty";
  if (current > goal + margin) return "over";
  if (current >= goal - margin) return "release";
  if (current >= goal - Math.max(12, margin + 5)) return "approaching";
  return "filling";
}
