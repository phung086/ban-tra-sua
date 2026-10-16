/**
 * QC-05: one authored greeting beat per customer arrival.
 * The gesture value drives the existing shoulder/elbow pose; no new geometry,
 * animation clocks or persistent save fields are needed.
 */
const START = 1.6;
const END = 2.7;
const DURATION = END - START;
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const smoothstep = (value: number): number => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/**
 * Return the right-arm greeting amplitude (radians in pose()).
 * It rises from zero, holds briefly and returns to zero before walking away.
 */
export function greetingGesture(elapsedSeconds: number, customerId: string): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= START || elapsedSeconds >= END)
    return 0;

  // Stable customer variation; identical saved orders replay the same motion.
  let hash = 0;
  for (const character of customerId) hash = (Math.imul(hash, 33) + character.charCodeAt(0)) >>> 0;
  const personality = (hash % 997) / 997;
  const local = elapsedSeconds - START;
  const raise = smoothstep(local / (0.16 + personality * 0.07));
  const lower = smoothstep((DURATION - local) / (0.2 + (1 - personality) * 0.06));
  const smallWave = 1 + 0.045 * Math.sin(local * 8 + personality * 3) * Math.sin(Math.PI * local / DURATION);
  return (0.78 + personality * 0.18) * raise * lower * smallWave;
}
