import { describe, expect, it } from "vitest";
import { emptyDraft, getDrinkCoachingTip } from "./engine";
import type { Order } from "./types";

const order: Order = {
  id: "feedback-test", customerId: "test-customer", size: "M",
  base: "classic-milk-tea", sugar: 50, ice: 50, topping: "none",
  targetFill: 80, targetShake: 60, price: 25000,
};

describe("drink preparation coaching", () => {
  it("recognizes a correctly prepared and sealed drink", () => {
    expect(getDrinkCoachingTip(order, { ...emptyDraft(), sealed: true }))
      .toContain("Công thức chuẩn");
  });

  it("prioritizes wrong tea base over minor sugar mismatch", () => {
    expect(getDrinkCoachingTip(order, {
      ...emptyDraft("peach-tea"), sugar: 60, sealed: true,
    })).toContain("nền trà");
  });

  it("explains how to correct excess sugar", () => {
    expect(getDrinkCoachingTip(order, {
      ...emptyDraft(), sugar: 100, sealed: true,
    })).toContain("Giảm đường");
  });

  it("catches an unsealed drink even if all measurements match", () => {
    expect(getDrinkCoachingTip(order, emptyDraft()))
      .toContain("Đậy kín");
  });

  it("prioritizes wrong topping over missing seal", () => {
    expect(getDrinkCoachingTip(order, {
      ...emptyDraft(), topping: "black-pearl",
    })).toContain("topping");
  });
});
