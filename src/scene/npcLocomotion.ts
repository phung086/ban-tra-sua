/**
 * QC-06: per-customer path-driven locomotion.
 * The actor's root heading eases toward the path direction; feet advance only
 * when the scripted visitor actually moves. No new renderer resources.
 */
export type NpcLocomotion = {
  x: number;
  z: number;
  heading: number;
  gaitPhase: number;
  initialized: boolean;
};

export const initialNpcLocomotion = (): NpcLocomotion => ({
  x: 0, z: 0, heading: 0, gaitPhase: 0, initialized: false,
});

const wrap = (angle: number): number => Math.atan2(Math.sin(angle), Math.cos(angle));
const TAU = 2 * Math.PI;

export function advanceNpcLocomotion(
  previous: NpcLocomotion,
  x: number,
  z: number,
  targetHeading: number,
  walking: boolean,
  motion: boolean,
  dt: number,
): { next: NpcLocomotion; stepping: boolean } {
  if (![x, z, targetHeading].every(Number.isFinite)) {
    return { next: previous, stepping: false };
  }
  const target = wrap(targetHeading);
  if (!previous.initialized) {
    return { next: { x, z, heading: target, gaitPhase: 0, initialized: true }, stepping: false };
  }

  const displacement = Math.hypot(x - previous.x, z - previous.z);
  // A long background pause or teleport must not advance multiple walk cycles.
  const stepping = motion && walking && displacement >= 0.001 && displacement <= 0.25;
  const gaitPhase = stepping
    ? (previous.gaitPhase + displacement * 3.6) % TAU
    : previous.gaitPhase;

  // Keep the shortest angular arc through +/- PI, with both a rate cap and
  // exponential easing near the target. Clamp dt after tab suspension.
  const frame = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.05)) : 0;
  const current = Number.isFinite(previous.heading) ? wrap(previous.heading) : target;
  const delta = wrap(target - current);
  const ease = 1 - Math.exp(-15 * frame);
  const maxTurn = 7.5 * frame;
  const step = motion ? Math.sign(delta) * Math.min(Math.abs(delta) * ease, maxTurn) : delta;
  const heading = wrap(current + step);

  return {
    next: { x, z, heading, gaitPhase, initialized: true },
    stepping,
  };
}
