import type { BaseId, GameState, Size } from './types';

export type ShiftPlan = 'regular' | 'rush';
export const RUSH_UNLOCK_DAY = 9;

/** Two familiar commuters arrive first during a chosen rush shift.
 * Use existing customers, with real impatient service timing and no new save data.
 * Alternating order prevents the same opening conversation every day.
 */
export function getRushOfficeCustomerId(
  state: Pick<GameState, 'day' | 'shiftPlan' | 'targetOrders'>,
  orderIndex: number,
): 'bo' | 'duc' | null {
  if (state.day < RUSH_UNLOCK_DAY || state.shiftPlan !== 'rush'
      || state.targetOrders < 2 || !Number.isInteger(orderIndex)
      || orderIndex < 0 || orderIndex > 1) return null;
  const firstIsBo = state.day % 2 === 1;
  return orderIndex === 0 ? (firstIsBo ? 'bo' : 'duc') : (firstIsBo ? 'duc' : 'bo');
}

/** Personalization is a real recipe constraint, not only NPC dialogue.
 * Day-specific arrival order can change while each regular keeps their taste.
 */
export interface RushCommuterRequest {
  customerId: 'bo' | 'duc';
  sugar?: number;
  ice?: number;
  hint: string;
}

const COMMUTER_REQUESTS: Record<RushCommuterRequest['customerId'], Omit<RushCommuterRequest, 'customerId'>> = {
  bo: { sugar: 30, hint: 'Bơ: 30% đường' },
  duc: { ice: 0, hint: 'Đức: không đá' },
};

export function getRushCommuterRequest(
  state: Pick<GameState, 'day' | 'shiftPlan' | 'targetOrders'>,
  orderIndex: number,
): RushCommuterRequest | null {
  const customerId = getRushOfficeCustomerId(state, orderIndex);
  return customerId ? { customerId, ...COMMUTER_REQUESTS[customerId] } : null;
}

/** Commuters order their favorites when those recipes are unlocked.
 * Locked favorites must not bypass the progression system.
 */
export function getRushCommuterPreferredBase(
  state: Pick<GameState, 'day' | 'shiftPlan' | 'targetOrders'>,
  orderIndex: number,
  favorite: BaseId | undefined,
  unlockedBases: readonly BaseId[],
): BaseId | null {
  return getRushOfficeCustomerId(state, orderIndex) && favorite && unlockedBases.includes(favorite)
    ? favorite
    : null;
}

/** Rush customers join the line sooner; normal shifts retain the original pace. */
export function getShiftQueueSpacingMs(
  state: Pick<GameState, 'day' | 'shiftPlan'>,
  regularSpacingMs: number,
): number {
  if (state.day < RUSH_UNLOCK_DAY || state.shiftPlan !== 'rush') return regularSpacingMs;
  return Math.max(1000, Math.round(regularSpacingMs * 0.7));
}

/** The existing day-demand curve plus an optional, player-chosen challenge. */
export function targetOrdersFor(day: number, demandBonus: number, plan: ShiftPlan = 'regular'): number {
  const base = Math.max(4, 5 + Math.min(5, Math.floor((day - 1) / 2)) + demandBonus);
  return base + (day >= RUSH_UNLOCK_DAY && plan === 'rush' ? 2 : 0);
}

/** Rush orders have an alternating, predictable M/L mix. The first size
 * alternates by day, so players can prepare exact cup stock without knowing
 * future recipes. Normal shifts retain their existing random size selection.
 */
export function getRushOrderSize(
  state: Pick<GameState, 'day' | 'shiftPlan' | 'targetOrders'>,
  orderIndex: number,
): Size | null {
  if (state.day < RUSH_UNLOCK_DAY || state.shiftPlan !== 'rush'
      || !Number.isInteger(orderIndex) || orderIndex < 0
      || !Number.isInteger(state.targetOrders) || orderIndex >= state.targetOrders) return null;
  return (orderIndex + state.day - 1) % 2 === 0 ? 'M' : 'L';
}

export function getRushCupRequirements(
  state: Pick<GameState, 'day' | 'shiftPlan' | 'targetOrders'>,
): { cupsM: number; cupsL: number } {
  if (state.day < RUSH_UNLOCK_DAY || state.shiftPlan !== 'rush'
      || !Number.isInteger(state.targetOrders) || state.targetOrders <= 0) {
    return { cupsM: 0, cupsL: 0 };
  }
  const cupsM = state.day % 2 === 1
    ? Math.ceil(state.targetOrders / 2) : Math.floor(state.targetOrders / 2);
  return { cupsM, cupsL: state.targetOrders - cupsM };
}

/** Exact per-size stock gate for a rush shift, not merely the total number
 * of cups. Recipes and toppings remain random and are NOT guaranteed here.
 */
export function getRushCupShortageBySize(state: GameState) {
  const required = getRushCupRequirements(state);
  const available = (count: number) => Math.floor(Math.max(0, Number.isFinite(count) ? count : 0));
  return {
    cupsM: Math.max(0, required.cupsM - available(state.inventory.cupsM)),
    cupsL: Math.max(0, required.cupsL - available(state.inventory.cupsL)),
  };
}

export function getRushCupShortage(state: GameState): number {
  const missing = getRushCupShortageBySize(state);
  return missing.cupsM + missing.cupsL;
}

export function chooseShiftPlan(state: GameState, plan: ShiftPlan): GameState {
  if (state.phase !== 'prep' || state.day < RUSH_UNLOCK_DAY || (plan !== 'regular' && plan !== 'rush')) return state;
  const targetOrders = targetOrdersFor(state.day, state.event.demandBonus, plan);
  return {
    ...state,
    shiftPlan: plan,
    targetOrders,
    notice: plan === 'rush'
      ? `Đã nhận ca đông khách: ${targetOrders} ly. Đạt điểm trung bình 80 để nhận thưởng 20.000 ₫ và 2 fan.`
      : `Đã chọn ca thường: ${targetOrders} ly. Bạn có thể kiểm kho trước khi mở cửa.`,
  };
}

/** Paid once by the existing end-of-shift transition, never on selection. */
export function completionBonus(
  plan: ShiftPlan | undefined,
  day: number,
  served: number,
  targetOrders: number,
  scoreTotal: number,
): { cash: number; fans: number } {
  if (day < RUSH_UNLOCK_DAY || plan !== 'rush' || served < targetOrders || targetOrders <= 0
      || !Number.isFinite(scoreTotal) || scoreTotal / served < 80) return { cash: 0, fans: 0 };
  return { cash: 20000, fans: 2 };
}

/** The rush summary must not round 79.9 up to a misleading rewarded 80.
 * Keep regular-shift legacy display unchanged.
 */
export function getShiftDisplayAverage(
  plan: ShiftPlan | undefined,
  day: number,
  served: number,
  scoreTotal: number,
): number {
  if (served <= 0 || !Number.isFinite(scoreTotal)) return 0;
  const average = scoreTotal / served;
  return day >= RUSH_UNLOCK_DAY && plan === 'rush'
    ? Math.floor(average * 10) / 10
    : Math.round(average);
}

/** Live progress uses the same quality threshold as the end-of-day payout.
 * It is presentation-only and never awards money or mutates the game.
 */
export function getRushShiftProgress(state: Pick<GameState,
  'day' | 'shiftPlan' | 'served' | 'targetOrders' | 'dailyScoreTotal'>) {
  if (state.day < RUSH_UNLOCK_DAY || state.shiftPlan !== 'rush') return null;
  const served = Math.max(0, Math.min(state.targetOrders, Math.floor(state.served)));
  const remaining = Math.max(0, state.targetOrders - served);
  // Round down for display: 79.95 must not look like a rewarded 80.
  const average = served > 0 && Number.isFinite(state.dailyScoreTotal)
    ? getShiftDisplayAverage(state.shiftPlan, state.day, served, state.dailyScoreTotal) : null;
  const requiredAverage = remaining > 0 && Number.isFinite(state.dailyScoreTotal)
    ? Math.max(0, Math.ceil((80 * state.targetOrders - state.dailyScoreTotal) / remaining)) : null;
  const bonus = completionBonus(state.shiftPlan, state.day, served, state.targetOrders, state.dailyScoreTotal);
  return { served, remaining, average, requiredAverage, bonusEarned: bonus.cash > 0 };
}
