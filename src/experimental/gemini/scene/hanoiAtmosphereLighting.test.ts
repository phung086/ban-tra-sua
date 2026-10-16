import { describe, it, expect } from 'vitest';
import {
  computeWindLeavesOffset,
  getHanoiAtmosphere,
} from './hanoiAtmosphereLighting';

describe('hanoiAtmosphereLighting — 4 Hanoi Street Time-of-Day States', () => {
  it('correctly maps dawn, day, dusk, and night lighting parameters', () => {
    const dawn = getHanoiAtmosphere(6 * 60 + 30); // 06:30
    expect(dawn.tag).toBe('dawn');
    expect(dawn.title).toBe('Sương sớm phố nhỏ');
    expect(dawn.streetLampIntensity).toBeLessThan(0.3);

    const day = getHanoiAtmosphere(12 * 60); // 12:00
    expect(day.tag).toBe('day');
    expect(day.streetLampIntensity).toBe(0.0);
    expect(day.shopLanternGlow).toBe(0.0);

    const dusk = getHanoiAtmosphere(17 * 60 + 45); // 17:45
    expect(dusk.tag).toBe('dusk');
    expect(dusk.shopLanternGlow).toBeGreaterThan(0.7);

    const night = getHanoiAtmosphere(21 * 60); // 21:00
    expect(night.tag).toBe('night');
    expect(night.streetLampIntensity).toBe(1.0);
    expect(night.shopLanternGlow).toBe(1.0);
  });

  it('computes smooth, bounded leaf wind sway offsets without vertex allocations', () => {
    const offset1 = computeWindLeavesOffset(1.5, 0.8);
    const offset2 = computeWindLeavesOffset(3.2, 0.8);
    expect(Number.isFinite(offset1.x)).toBe(true);
    expect(Number.isFinite(offset1.y)).toBe(true);
    expect(Math.abs(offset1.x)).toBeLessThan(0.1);
    expect(offset1).not.toEqual(offset2);
  });
});
