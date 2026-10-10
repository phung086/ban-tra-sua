import { describe, expect, it } from "vitest";
import { getCustomerWaitingLine } from "./customerWaitingDialogue";

describe("NPC dialogue while waiting for tea", () => {
  it("mentions a specific customer's real schedule", () => {
    expect(getCustomerWaitingLine("miu", "restless")).toContain("ca");
    expect(getCustomerWaitingLine("nana", "restless")).toContain("lớp");
    expect(getCustomerWaitingLine("lyly", "restless")).toContain("ánh sáng");
  });

  it("changes tone as patience runs out", () => {
    const greeting = getCustomerWaitingLine("bo", "delighted");
    const hurried = getCustomerWaitingLine("bo", "restless");
    const upset = getCustomerWaitingLine("bo", "upset");
    expect(new Set([greeting, hurried, upset]).size).toBe(3);
    expect(upset).toContain("đợi lâu");
  });

  it("has readable dialogue for all five moods", () => {
    for (const mood of ["delighted", "happy", "neutral", "restless", "upset"] as const) {
      expect(getCustomerWaitingLine("duc", mood).length).toBeGreaterThan(10);
    }
  });

  it("does not require a recognized customer ID", () => {
    expect(getCustomerWaitingLine("future-neighbor", "neutral")).toContain("trà");
  });

  it("is deterministic across repeated renders and reloads", () => {
    expect(getCustomerWaitingLine("khanh", "neutral"))
      .toBe(getCustomerWaitingLine("khanh", "neutral"));
  });
});
