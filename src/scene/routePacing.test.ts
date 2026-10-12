import { describe, expect, it } from "vitest";
import { easedRouteProgress, sampleRouteByDistance } from "./routePacing";

describe("QC-06 distance-based NPC route pacing", () => {
  it("travels by meters, not by number of waypoints", () => {
    const route: [number, number][] = [[0, 0], [1, 0], [1, 4]];
    expect(sampleRouteByDistance(route, 0.2)).toMatchObject({ x: 1, z: 0 });
    expect(sampleRouteByDistance(route, 0.4)).toMatchObject({ x: 1, z: 1 });
    expect(sampleRouteByDistance(route, 0.6)).toMatchObject({ x: 1, z: 2 });
    expect(sampleRouteByDistance(route, 1)).toMatchObject({ x: 1, z: 4 });
  });
  it("accelerates/decelerates only at route endpoints", () => {
    expect(easedRouteProgress(0.03)).toBeLessThan(0.03);
    expect(easedRouteProgress(0.97)).toBeGreaterThan(0.97);
    expect(easedRouteProgress(0.2)).toBe(0.2);
    expect(easedRouteProgress(0.5)).toBe(0.5);
    for (let i = 1; i <= 100; i++)
      expect(easedRouteProgress(i / 100)).toBeGreaterThanOrEqual(easedRouteProgress((i - 1) / 100));
  });
  it("handles duplicate waypoints, invalid progress and endpoints", () => {
    const route: [number, number][] = [[0, -5.3], [0, -5.3], [0, -0.3]];
    expect(sampleRouteByDistance(route, Number.NaN).z).toBe(-5.3);
    expect(sampleRouteByDistance(route, 2).z).toBe(-0.3);
    expect(sampleRouteByDistance(route, 0.5).rotation).toBeCloseTo(0);
    expect(sampleRouteByDistance([[1, 2], [1, 2]], 0.5)).toMatchObject({ x: 1, z: 2, rotation: 0 });
  });
  it("keeps constant travel distance between samples outside the ramps", () => {
    const route: [number, number][] = [[0, 0], [0.5, 0], [0.5, 2], [0.5, 5]];
    const a = sampleRouteByDistance(route, 0.3);
    const b = sampleRouteByDistance(route, 0.4);
    const c = sampleRouteByDistance(route, 0.5);
    expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeCloseTo(0.55);
    expect(Math.hypot(c.x - b.x, c.z - b.z)).toBeCloseTo(0.55);
  });
});
