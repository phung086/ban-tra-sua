/** Pure progress model for a tactile pour, in percentage points. */
export const POUR_RATES = { careful: 26, quick: 52 } as const;
export type PourSpeed = keyof typeof POUR_RATES;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Limit a background-tab frame to 50 ms; never add phantom tea on resume. */
export function advancePour(fill: number, elapsedMs: number, speed: PourSpeed, brewerLevel = 0): number {
  const safeFill = Number.isFinite(fill) ? clamp(fill, 0, 100) : 0;
  const safeElapsed = Number.isFinite(elapsedMs) ? clamp(elapsedMs, 0, 50) : 0;
  const upgradeFactor = 1 - Math.min(0.25, Math.max(0, brewerLevel) * 0.04);
  return clamp(safeFill + POUR_RATES[speed] * upgradeFactor * safeElapsed / 1000, 0, 100);
}

export type PourVerdict = 'perfect' | 'close' | 'off';
export function pourVerdict(fill: number, target: number, tolerance = 5): PourVerdict {
  const distance = Math.abs(fill - target);
  return distance <= tolerance ? 'perfect' : distance <= tolerance * 2 ? 'close' : 'off';
}
