import { describe, expect, it } from 'vitest';
import { applyBlink, blinkOpenness } from './blinkMotion';

describe('QC-05 character blink easing', () => {
  it('closes quickly and opens gradually without a one-frame pop', () => {
    const start = 3.7 - 0.22;
    expect(blinkOpenness(start, 0, true)).toBeCloseTo(1);
    expect(blinkOpenness(start + 0.22 * 0.43, 0, true)).toBeCloseTo(0.12);
    expect(blinkOpenness(3.7, 0, true)).toBeCloseTo(1);
    let previous = blinkOpenness(start, 0, true);
    for (let i = 1; i <= 9; i++) {
      const next = blinkOpenness(start + i / 30, 0, true);
      expect(next).toBeGreaterThanOrEqual(0.12 - 1e-9);
      expect(next).toBeLessThanOrEqual(1);
      expect(Math.abs(next - previous)).toBeLessThan(0.6);
      previous = next;
    }
  });

  it('keeps separate deterministic blink rhythms per actor', () => {
    expect(blinkOpenness(3.57, 0, true)).not.toBeCloseTo(blinkOpenness(3.57, 0.65, true));
    expect(blinkOpenness(3.57, 0.65, true)).toBe(blinkOpenness(3.57, 0.65, true));
  });

  it('restores original mesh scale when reduced motion is enabled', () => {
    const eyes = [
      { scale: { y: 0 }, userData: { blinkHeight: 0.016 } },
      { scale: { y: 0 }, userData: { blinkHeight: 0.014 } },
    ];
    applyBlink(eyes, 3.7 - 0.22 * 0.57, 0, true);
    expect(eyes[0].scale.y).toBeLessThan(0.016);
    applyBlink(eyes, 3.7 - 0.22 * 0.57, 0, false);
    expect(eyes.map(eye => eye.scale.y)).toEqual([0.016, 0.014]);
  });

  it('keeps negative timestamps and invalid inputs finite and bounded', () => {
    for (const time of [-100, -1, 0, 100, Number.NaN, Infinity]) {
      for (const seed of [-10, 0.25, 12, Number.NaN]) {
        const value = blinkOpenness(time, seed, true);
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0.12 - 1e-9);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });
});
