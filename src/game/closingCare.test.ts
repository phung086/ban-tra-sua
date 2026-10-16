import { afterEach, describe, expect, it, vi } from "vitest";
import { CUSTOMERS } from "./content";
import { getCustomerPatienceSeconds } from "./customerAi";
import { CLEANING_SUPPLY_COST, getClosingScenario } from "./closingCare";
import { chooseClosingCare, createInitialState, nextDay } from "./engine";
import { loadGame, saveGame } from "./storage";
import type { GameState } from "./types";

function finishedDayEight(): GameState {
  const initial = createInitialState();
  return {
    ...initial,
    day: 8,
    phase: "summary",
    cash: 20000,
    dailyCost: 9000,
    summary: {
      day: 8, eventName: "Ngày dịu dàng", orders: 5, perfectOrders: 2,
      bestCombo: 2, revenue: 75000, ingredientCost: 9000, wasteCost: 0,
      profit: 66000, averageScore: 91, fansGained: 3, researchGained: 4,
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("day 8 closing cleanup playable choice", () => {
  it("requires a real closing decision, only on the authored day", () => {
    const finished = finishedDayEight();
    expect(getClosingScenario(8)?.id).toBe("quiet-shift-cleanup");
    expect(getClosingScenario(7)).toBeNull();
    expect(nextDay(finished).day).toBe(8);
    const prep = createInitialState();
    expect(chooseClosingCare(prep, "clean")).toBe(prep);
    expect(nextDay({ ...finished, day: 7 }).day).toBe(8);
  });

  it("charges cleaning supplies once and makes customers more patient the next day", () => {
    const finished = finishedDayEight();
    const cleaned = chooseClosingCare(finished, "clean");
    expect(cleaned.cash).toBe(finished.cash - CLEANING_SUPPLY_COST);
    expect(cleaned.summary?.profit).toBe(finished.summary!.profit - CLEANING_SUPPLY_COST);
    expect(cleaned.summary?.closingCost).toBe(CLEANING_SUPPLY_COST);
    expect(chooseClosingCare(cleaned, "clean")).toBe(cleaned);
    expect(chooseClosingCare(cleaned, "skip")).toBe(cleaned);
    const tomorrow = nextDay(cleaned);
    expect(tomorrow.day).toBe(9);
    expect(tomorrow.closingCareChoice).toBeNull();
    expect(tomorrow.counterCondition).toBe("fresh");
    const customer = CUSTOMERS[0];
    const baseline = getCustomerPatienceSeconds({ ...tomorrow, counterCondition: "normal" }, customer);
    expect(getCustomerPatienceSeconds(tomorrow, customer)).toBe(baseline + 10);
    expect(nextDay(tomorrow).counterCondition).toBe("normal");
  });

  it("allows free basic cleanup, but customers become impatient sooner", () => {
    const finished = finishedDayEight();
    const skipped = chooseClosingCare(finished, "skip");
    expect(skipped.cash).toBe(finished.cash);
    expect(skipped.summary?.profit).toBe(finished.summary?.profit);
    const tomorrow = nextDay(skipped);
    const customer = CUSTOMERS[0];
    const baseline = getCustomerPatienceSeconds({ ...tomorrow, counterCondition: "normal" }, customer);
    expect(getCustomerPatienceSeconds(tomorrow, customer)).toBe(baseline - 10);
    expect(tomorrow.counterCondition).toBe("untidy");
  });

  it("survives save/reload without charging again or forgetting the choice", () => {
    const saved = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    });
    const cleaned = chooseClosingCare(finishedDayEight(), "clean");
    saveGame(cleaned);
    const restored = loadGame();
    expect(restored.closingCareChoice).toBe("clean");
    expect(restored.cash).toBe(cleaned.cash);
    expect(chooseClosingCare(restored, "clean").cash).toBe(cleaned.cash);
    expect(nextDay(restored).counterCondition).toBe("fresh");
  });

  it("provides a no-cost route when cash is too low", () => {
    const poor = { ...finishedDayEight(), cash: 100 };
    expect(chooseClosingCare(poor, "clean").cash).toBe(100);
    expect(chooseClosingCare(poor, "clean").closingCareChoice).toBeNull();
    expect(nextDay(chooseClosingCare(poor, "skip")).day).toBe(9);
  });
});
