import { describe, expect, it } from "vitest";
import { getCustomerDeliveryLine, getDeliveryReactionMood } from "./customerDeliveryDialogue";

describe("customer delivery dialogue", () => {
  it("speaks in a bookshop customer's voice after a great drink", () => {
    expect(getCustomerDeliveryLine("miu", 96, "happy")).toContain("hiệu sách");
  });

  it("acknowledges a long wait even when the recipe is excellent", () => {
    expect(getCustomerDeliveryLine("bo", 98, "upset")).toContain("muộn giờ làm");
  });

  it("does not praise a bad drink regardless of the wait", () => {
    expect(getCustomerDeliveryLine("bo", 50, "upset")).toContain("Công thức hơi lệch");
  });

  it("uses a safe fallback for neighbors without custom lines", () => {
    expect(getCustomerDeliveryLine("neighbor-unknown", 92, "neutral"))
      .toContain("Ngon quá");
  });

  it("is deterministic for repeated inputs", () => {
    const line = getCustomerDeliveryLine("nana", 82, "happy");
    expect(getCustomerDeliveryLine("nana", 82, "happy")).toBe(line);
  });

  it("shows impatient body language when a good drink arrived late", () => {
    expect(getDeliveryReactionMood(97, "restless")).toBe("restless");
    expect(getDeliveryReactionMood(50, "delighted")).toBe("upset");
    expect(getDeliveryReactionMood(96, "happy")).toBe("delighted");
  });
});
