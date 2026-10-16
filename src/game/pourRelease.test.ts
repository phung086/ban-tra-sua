import { describe, expect, it } from "vitest";
import { advancePour, finishPourAtRelease } from "./pourControl";

describe("manual pour release latency", () => {
  it("counts an 80ms tap even if RAF has not run", () => {
    expect(finishPourAtRelease(0, 1000, 1080, "careful")).toBeCloseTo(2.08);
    expect(finishPourAtRelease(0, 1000, 1080, "quick")).toBeCloseTo(4.16);
  });
  it("adds only time since the last animation frame", () => {
    const afterFrame = advancePour(0, 60, "careful");
    expect(finishPourAtRelease(afterFrame, 1060, 1080, "careful")).toBeCloseTo(2.08);
  });
  it("preserves progress across consecutive presses", () => {
    const first = finishPourAtRelease(0, 100, 180, "careful");
    expect(finishPourAtRelease(first, 300, 380, "careful")).toBeCloseTo(4.16);
  });
  it("never grants time for a missing or reversed timestamp", () => {
    expect(finishPourAtRelease(20, null, 500, "quick")).toBe(20);
    expect(finishPourAtRelease(20, 600, 500, "quick")).toBe(20);
    expect(finishPourAtRelease(20, 100, Number.NaN, "quick")).toBe(20);
  });
  it("caps delayed releases at 100ms and never overfills", () => {
    expect(finishPourAtRelease(0, 100, 10100, "quick")).toBeCloseTo(5.2);
    expect(finishPourAtRelease(99, 100, 180, "quick")).toBe(100);
  });
});
