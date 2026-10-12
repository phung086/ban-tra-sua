/**
 * QC-06: Pace customers by traveled meters rather than time per waypoint.
 * Easing occurs only at route start/end, not at every corner.
 */
export type RoutePoint = readonly [number, number];
export type RoutePose = { x: number; z: number; rotation: number };

export function easedRouteProgress(progress: number): number {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const ramp = 0.12;
  if (p < ramp) {
    const t = p / ramp;
    return ramp * (2 * t * t - t * t * t);
  }
  if (p > 1 - ramp) {
    const t = (1 - p) / ramp;
    return 1 - ramp * (2 * t * t - t * t * t);
  }
  return p;
}

/**
 * Ease the facing direction around a waypoint while leaving the traveled
 * distance and actual route untouched. Short legs get smaller turn windows,
 * preventing two adjacent corners from fighting over the actor's heading.
 */
function cornerHeading(points: readonly RoutePoint[], distance: number, fallback: number): number {
  let traveled = 0;
  let nearest = Infinity;
  let heading = fallback;
  for (let i = 1; i < points.length - 1; i++) {
    const previous = points[i - 1], corner = points[i], next = points[i + 1];
    const inDx = corner[0] - previous[0], inDz = corner[1] - previous[1];
    const outDx = next[0] - corner[0], outDz = next[1] - corner[1];
    const incoming = Math.hypot(inDx, inDz);
    const outgoing = Math.hypot(outDx, outDz);
    traveled += incoming;
    if (incoming < 1e-8 || outgoing < 1e-8) continue;
    const window = Math.min(0.42, incoming * 0.45, outgoing * 0.45);
    const offset = distance - traveled;
    if (Math.abs(offset) > window || Math.abs(offset) >= nearest) continue;
    const from = Math.atan2(inDx, inDz);
    const to = Math.atan2(outDx, outDz);
    const t = Math.max(0, Math.min(1, (offset + window) / (2 * window)));
    const blend = t * t * (3 - 2 * t);
    const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    const angle = from + delta * blend;
    heading = Math.atan2(Math.sin(angle), Math.cos(angle));
    nearest = Math.abs(offset);
  }
  return heading;
}

export function sampleRouteByDistance(
  points: readonly RoutePoint[],
  progress: number,
): RoutePose {
  if (points.length === 0) return { x: 0, z: 0, rotation: 0 };
  if (points.length === 1) return { x: points[0][0], z: points[0][1], rotation: 0 };
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  if (total < 1e-8) return { x: points[0][0], z: points[0][1], rotation: 0 };
  const distance = total * easedRouteProgress(progress);
  let remaining = distance;
  let last: RoutePose = { x: points[0][0], z: points[0][1], rotation: 0 };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const length = Math.hypot(dx, dz);
    if (length < 1e-8) continue;
    const rotation = Math.atan2(dx, dz);
    last = { x: b[0], z: b[1], rotation };
    if (remaining <= length) {
      const t = Math.max(0, Math.min(1, remaining / length));
      const x = t >= 1 - 1e-12 ? b[0] : a[0] + dx * t;
      const z = t >= 1 - 1e-12 ? b[1] : a[1] + dz * t;
      return { x, z, rotation: cornerHeading(points, distance, rotation) };
    }
    remaining -= length;
  }
  return { ...last, rotation: cornerHeading(points, distance, last.rotation) };
}
