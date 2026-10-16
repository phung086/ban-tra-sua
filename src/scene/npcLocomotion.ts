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
  startDistance: number;
  initialized: boolean;
};

export const initialNpcLocomotion = (): NpcLocomotion => ({
  x: 0, z: 0, heading: 0, gaitPhase: 0, startDistance: 0, initialized: false,
});

const wrap = (angle: number): number => Math.atan2(Math.sin(angle), Math.cos(angle));
const TAU = 2 * Math.PI;

/** Shorten the step when feet still travel forward but the torso turns. */
export function turnStrideScale(travelHeading: number, facingHeading: number): number {
  if (!Number.isFinite(travelHeading) || !Number.isFinite(facingHeading)) return 1;
  const mismatch = Math.abs(wrap(travelHeading - facingHeading));
  // Keep full stride for small steering; soften it across a 15-90 degree pivot.
  const t = Math.max(0, Math.min(1, (mismatch - Math.PI / 12) / (Math.PI * 5 / 12)));
  return 1 - 0.55 * t * t * (3 - 2 * t);
}

/** Ease the foot swing down with actual ground speed before a route ends.
 * Visitors decelerate over the last 12% of their path, so the feet should
 * settle before the root stops rather than skating in place at full stride.
 */
export function brakingStrideScale(displacement: number, dt: number): number {
  if (!Number.isFinite(displacement) || !Number.isFinite(dt) || dt <= 0) return 1;
  const speed = Math.max(0, displacement) / dt;
  const t = Math.max(0, Math.min(1, (speed - 0.15) / 1.65));
  return 0.3 + 0.7 * t * t * (3 - 2 * t);
}

/** Plant the feet at take-off, then restore a full swing over the first 24cm.
 * Distance (not elapsed frames) keeps the launch consistent at 30/60 FPS.
 */
export function launchStrideScale(distanceSinceStart: number): number {
  if (!Number.isFinite(distanceSinceStart)) return 1;
  const t = Math.max(0, Math.min(1, distanceSinceStart / 0.24));
  return 0.28 + 0.72 * t * t * (3 - 2 * t);
}

export function advanceNpcLocomotion(
  previous: NpcLocomotion,
  x: number,
  z: number,
  targetHeading: number,
  walking: boolean,
  motion: boolean,
  dt: number,
): { next: NpcLocomotion; stepping: boolean; strideScale: number } {
  if (![x, z, targetHeading].every(Number.isFinite)) {
    return { next: previous, stepping: false, strideScale: 1 };
  }
  const target = wrap(targetHeading);
  if (!previous.initialized) {
    return { next: { x, z, heading: target, gaitPhase: 0, startDistance: 0, initialized: true }, stepping: false, strideScale: 1 };
  }

  const displacement = Math.hypot(x - previous.x, z - previous.z);
  // A long background pause or teleport must not advance multiple walk cycles.
  const stepping = motion && walking && displacement >= 0.001 && displacement <= 0.25;
  // When a visitor stops, ease the feet toward the nearest planted half-cycle
  // (both leg swings and knee bends are neutral at multiples of PI). Preserve
  // phase across teleports/reduced-motion instead of snapping the rig.
  const frame = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.05)) : 0;
  const plantedPhase = Math.round(previous.gaitPhase / Math.PI) * Math.PI;
  const gaitPhase = stepping
    ? (previous.gaitPhase + displacement * 3.6) % TAU
    : motion && displacement < 0.001
      ? previous.gaitPhase + (plantedPhase - previous.gaitPhase) * (1 - Math.exp(-18 * frame))
      : previous.gaitPhase;
  const startDistance = stepping ? Math.min(0.24, previous.startDistance + displacement) : 0;

  // Keep the shortest angular arc through +/- PI, with both a rate cap and
  // exponential easing near the target. Clamp dt after tab suspension.
  const current = Number.isFinite(previous.heading) ? wrap(previous.heading) : target;
  const delta = wrap(target - current);
  const ease = 1 - Math.exp(-15 * frame);
  const maxTurn = 7.5 * frame;
  const step = motion ? Math.sign(delta) * Math.min(Math.abs(delta) * ease, maxTurn) : delta;
  const heading = wrap(current + step);
  const strideScale = stepping
    ? turnStrideScale(Math.atan2(x - previous.x, z - previous.z), heading)
      * brakingStrideScale(displacement, dt)
      * launchStrideScale(startDistance)
    : 1;

  return {
    next: { x, z, heading, gaitPhase, startDistance, initialized: true },
    stepping,
    strideScale,
  };
}
