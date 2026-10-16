/**
 * QC-05: frame-rate-independent blink for existing character eye meshes.
 * Uses stable per-character timing without geometry, timers, or save fields.
 */
const smoothstep = (value: number): number => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function blinkOpenness(time: number, seed: number, motion: boolean): number {
  if (!motion || !Number.isFinite(time)) return 1;
  const identity = Number.isFinite(seed) ? Math.max(0, Math.min(1, seed)) : 0;
  const interval = 3.7 + identity * 1.4;
  const phase = ((time + identity * interval) % interval + interval) % interval;
  const duration = 0.22;
  const progress = (phase - (interval - duration)) / duration;
  if (progress <= 0) return 1;
  // Close faster than reopening so the eyelids read at 30 FPS.
  const closeFraction = 0.43;
  const closure = progress < closeFraction
    ? smoothstep(progress / closeFraction)
    : 1 - smoothstep((progress - closeFraction) / (1 - closeFraction));
  return 1 - 0.88 * closure;
}

export interface BlinkableEye {
  scale: { y: number };
  userData: { blinkHeight?: unknown };
}

export function applyBlink(
  eyes: readonly BlinkableEye[], time: number, seed: number, motion: boolean,
): void {
  const openness = blinkOpenness(time, seed, motion);
  for (const eye of eyes) {
    const original = eye.userData.blinkHeight;
    if (typeof original === 'number' && Number.isFinite(original)) {
      eye.scale.y = original * openness;
    }
  }
}
