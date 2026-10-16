import { describe, expect, it } from "vitest";
import { advancePour, finishPourAtRelease, pourCue, pourCuePulse } from "./pourControl";

describe("pour-zone transition feedback", () => {
  it("distinguishes approach, release and overshoot", () => {
    expect(pourCue(68, 80)).toBe("approaching");
    expect(pourCue(75, 80)).toBe("release");
    expect(pourCue(85, 80)).toBe("release");
    expect(pourCue(86, 80)).toBe("over");
  });
  it("only emits feedback when entering a new useful zone", () => {
    expect(pourCuePulse("filling", "approaching")).toBe("tap");
    expect(pourCuePulse("approaching", "approaching")).toBeNull();
    expect(pourCuePulse("approaching", "release")).toBe("good");
    expect(pourCuePulse("release", "release")).toBeNull();
    expect(pourCuePulse("release", "over")).toBeNull();
  });
  it("detects the target reached by a release before the next frame", () => {
    const start = 73.5;
    const stopped = finishPourAtRelease(start, 1000, 1080, "careful");
    expect(pourCue(start, 80)).toBe("approaching");
    expect(pourCue(stopped, 80)).toBe("release");
  });
  it("pours equal amounts at 30 and 60 FPS under normal foreground timing", () => {
    const simulate = (fps: number) => Array.from({ length: fps })
      .reduce<number>(fill => advancePour(fill, 1000 / fps, "careful"), 0);
    expect(simulate(30)).toBeCloseTo(simulate(60), 8);
  });
});
