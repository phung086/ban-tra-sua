import { describe, it, expect } from "vitest";
import {
  chooseBreakfast,
  initMorningWake,
  openShopShutter,
  sweepSidewalk,
} from "./morningWakeEngine";

describe("morningWakeEngine — Hanoi Morning Wake-up & Day Start Routine", () => {
  it("initializes morning baseline with higher energy if slept early last night", () => {
    const early = initMorningWake({ day: 2, currentCash: 120000, sleptEarly: true });
    const late = initMorningWake({ day: 2, currentCash: 120000, sleptEarly: false });
    expect(early.energy).toBeGreaterThan(late.energy);
    expect(early.shutterOpened).toBe(false);
    expect(early.readyToOpenShop).toBe(false);
  });

  it("applies breakfast energy and satiety bonus while deducting cash accurately", () => {
    let state = initMorningWake({ day: 3, currentCash: 100000 });
    const result = chooseBreakfast(state, "banh_mi_pate");
    expect(result.success).toBe(true);
    expect(result.state.currentCash).toBe(100000 - 22000);
    expect(result.state.energy).toBe(state.energy + 25);
    expect(result.state.satiety).toBe(state.satiety + 45);
    expect(result.state.breakfastConsumed).toBe(true);
  });

  it("becomes ready to open shop once shutter is open, sidewalk swept, and breakfast eaten", () => {
    let state = initMorningWake({ day: 1, currentCash: 50000 });
    state = openShopShutter(state);
    state = sweepSidewalk(state);
    expect(state.readyToOpenShop).toBe(false);

    state = chooseBreakfast(state, "self_cook").state;
    expect(state.readyToOpenShop).toBe(true);
  });
});
