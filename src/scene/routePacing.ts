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
  let remaining = total * easedRouteProgress(progress);
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
      if (t >= 1 - 1e-12) return { x: b[0], z: b[1], rotation };
      return { x: a[0] + dx * t, z: a[1] + dz * t, rotation };
    }
    remaining -= length;
  }
  return last;
}
