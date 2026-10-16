import { describe, expect, it } from "vitest";
import { pourCue, pourVerdict } from "./pourControl";

describe("pour release feedback", () => {
  it("marks the target window for an actionable release", () => {
    expect(pourCue(69, 80)).toBe("approaching");
    expect(pourCue(78, 80)).toBe("release");
    expect(pourVerdict(78, 80)).toBe("perfect");
    expect(pourCue(86, 80)).toBe("over");
  });
});
