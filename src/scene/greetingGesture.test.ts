import { describe, expect, it } from "vitest";
import { greetingGesture } from "./greetingGesture";

describe("QC-05 customer greeting beat", () => {
  it("starts and ends with a neutral arm pose", () => {
    for (const time of [-10, 0, 1.6, 2.7, 3, Number.NaN, Infinity])
      expect(greetingGesture(time, "miu")).toBe(0);
  });

  it("raises, holds, and lowers instead of popping between poses", () => {
    const sample = (time: number) => greetingGesture(time, "miu");
    expect(sample(1.61)).toBeLessThan(0.05);
    expect(sample(1.9)).toBeGreaterThan(0.65);
    expect(sample(2.5)).toBeGreaterThan(0.45);
    expect(sample(2.69)).toBeLessThan(0.02);
    const frames = Array.from({ length: 34 }, (_, i) => sample(1.6 + i / 30));
    expect(Math.max(...frames.slice(1).map((value, i) => Math.abs(value - frames[i])))).toBeLessThan(0.4);
  });

  it("keeps characters distinct without randomness or render-frame state", () => {
    expect(greetingGesture(2.1, "miu")).not.toBe(greetingGesture(2.1, "bo"));
    expect(greetingGesture(2.1, "miu")).toBe(greetingGesture(2.1, "miu"));
  });

  it("remains bounded across the whole greeting window", () => {
    for (const id of ["miu", "bo", "nana", "", "👋"])
      for (let i = 0; i <= 110; i++) {
        const value = greetingGesture(1.6 + i / 100, id);
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1.05);
      }
  });
});
