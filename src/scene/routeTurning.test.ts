import { describe, expect, it } from 'vitest';
import { sampleRouteByDistance } from './routePacing';

const angleGap = (a: number, b: number) =>
  Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

describe('QC-06 NPC corner orientation', () => {
  it('turns toward a 90-degree corner before arrival without changing the route', () => {
    const path: [number, number][] = [[0, 0], [0, 3], [3, 3]];
    const before = sampleRouteByDistance(path, 2.8 / 6);
    const corner = sampleRouteByDistance(path, 0.5);
    const after = sampleRouteByDistance(path, 3.2 / 6);
    expect(before.x).toBe(0);
    expect(before.z).toBeCloseTo(2.8);
    expect(corner).toMatchObject({ x: 0, z: 3 });
    expect(after.x).toBeCloseTo(0.2);
    expect(after.z).toBe(3);
    expect(before.rotation).toBeGreaterThan(0);
    expect(before.rotation).toBeLessThan(Math.PI / 4);
    expect(corner.rotation).toBeCloseTo(Math.PI / 4);
    expect(after.rotation).toBeGreaterThan(Math.PI / 4);
    expect(after.rotation).toBeLessThan(Math.PI / 2);
  });
  it('does not snap its heading through 45, 90, or 180-degree corners', () => {
    const paths: [number, number][][] = [
      [[0, 0], [0, 3], [3, 6]],
      [[0, 0], [0, 3], [3, 3]],
      [[0, 0], [0, 3], [0, 0]],
    ];
    for (const path of paths) {
      let previous = sampleRouteByDistance(path, 0).rotation;
      for (let frame = 1; frame <= 240; frame++) {
        const current = sampleRouteByDistance(path, frame / 240).rotation;
        expect(angleGap(current, previous)).toBeLessThan(0.2);
        previous = current;
      }
    }
  });
  it('handles short corners, duplicate waypoints and reduced-motion static routes', () => {
    const path: [number, number][] = [[0, 0], [0, .15], [.15, .15], [.15, .3]];
    for (let i = 0; i <= 100; i++) {
      expect(Number.isFinite(sampleRouteByDistance(path, i / 100).rotation)).toBe(true);
    }
    expect(sampleRouteByDistance([[0, -5.3], [0, -5.3], [0, -.3]], .5).rotation).toBe(0);
    expect(sampleRouteByDistance([[0, -5.3], [0, -.3]], Number.NaN).z).toBe(-5.3);
  });
});
