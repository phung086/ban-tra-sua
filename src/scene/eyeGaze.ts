/**
 * QC-05: small, deterministic paired eye glances while NPCs idle.
 * Existing pupil meshes move inside their eye whites; no new geometry.
 */
export type EyeGaze = Readonly<{ x: number; y: number }>;
const CENTER: EyeGaze = { x: 0, y: 0 };
const ease = (value: number): number => value * value * (3 - 2 * value);

export function idleEyeGaze(time: number, seed: number, active: boolean): EyeGaze {
  if (!active || !Number.isFinite(time)) return CENTER;
  const personSeed = Number.isFinite(seed) ? Math.max(0, Math.min(1, seed)) : 0;
  const cycleLength = 4.8 + personSeed * 1.7;
  const clock = time + personSeed * cycleLength;
  const cycle = Math.floor(clock / cycleLength);
  const phase = clock - cycle * cycleLength;
  const start = 0.85 + personSeed * 0.25;
  const enter = 0.18;
  const hold = 1.05;
  const exit = 0.22;
  const end = start + enter + hold + exit;
  if (phase <= start || phase >= end) return CENTER;
  const strength = phase < start + enter
    ? ease((phase - start) / enter)
    : phase < start + enter + hold
      ? 1
      : 1 - ease((phase - start - enter - hold) / exit);
  return {
    x: Math.sin(cycle * 2.13 + personSeed * 12.7 + 0.6) * 0.0055 * strength,
    y: Math.cos(cycle * 1.73 + personSeed * 7.4) * 0.0014 * strength,
  };
}
