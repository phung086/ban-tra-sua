import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { wakeMorning } from './morning';
import { canChooseEveningCare, chooseEveningCare, getEveningCareCallback, hasMissedHaPromise } from './eveningCare';
import type { GameState } from '../types';

function endShift(game: GameState): GameState {
  return { ...game, phase: 'summary', summary: {
    day: game.day, eventName: game.event.name, orders: 1, perfectOrders: 0,
    bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0,
    profit: 0, averageScore: 80, fansGained: 0, researchGained: 0,
  } };
}
function invitation() {
  const helped = chooseEveningCare(endShift(createInitialState()), 'help');
  const day3 = endShift(nextDay(endShift(nextDay(helped))));
  return endShift(nextDay(chooseEveningCare(day3, 'postpone')));
}
describe('missed meal promise', () => {
  it('allows one apology and remembers it after sleep', () => {
    const day5 = endShift(nextDay(chooseEveningCare(invitation(), 'rest')));
    expect(hasMissedHaPromise(day5)).toBe(true);
    const after = chooseEveningCare(day5, 'apologize');
    expect(after.cash).toBe(day5.cash);
    expect(after.city.minutes).toBe(day5.city.minutes + 5);
    expect(after.city.goodwill).toBe(day5.city.goodwill + 1);
    expect(chooseEveningCare(after, 'apologize')).toBe(after);
    const saved = JSON.parse(JSON.stringify(after)) as GameState;
    expect(saved.relationshipRewardIds).toContain('evening-ha-5-apologize');
    expect(getEveningCareCallback(nextDay(saved))).toBeNull();
    expect(getEveningCareCallback(wakeMorning(nextDay(saved)))).toContain('báo mình sớm');
  });
  it('does not offer apology after claiming meal or outside the one-day window', () => {
    const claimed = endShift(nextDay(chooseEveningCare(invitation(), 'thanks')));
    expect(canChooseEveningCare(claimed, 'apologize')).toBe(false);
    const late = endShift(nextDay(invitation()));
    late.city.minutes = 1260;
    expect(canChooseEveningCare(late, 'apologize')).toBe(false);
    expect(canChooseEveningCare(late, 'rest')).toBe(true);
    expect(canChooseEveningCare(endShift(nextDay(late)), 'apologize')).toBe(false);
  });
});
