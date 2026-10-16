import type { GameState } from "./types";

/** Hand-authored daily scene; future closing scenarios can join this table. */
const CLOSING_SCENARIOS = [
  {
    id: "quiet-shift-cleanup",
    day: 8,
    title: "Dọn quầy cuối ngày",
    description: "Một ngày yên ả vừa hết. Ngày mai khách vội sẽ ghé: dành thời gian làm sạch quầy hay nghỉ sớm?",
  },
] as const;

export const CLEANING_SUPPLY_COST = 3000;

export function getClosingScenario(day: number) {
  return CLOSING_SCENARIOS.find(scenario => scenario.day === day) ?? null;
}

export function getCounterPatienceAdjustment(state: Pick<GameState, "day" | "counterCondition">): number {
  if (!getClosingScenario(state.day - 1)) return 0;
  if (state.counterCondition === "fresh") return 10;
  if (state.counterCondition === "untidy") return -10;
  return 0;
}
