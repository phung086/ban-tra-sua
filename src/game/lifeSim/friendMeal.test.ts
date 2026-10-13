import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { chooseFriendMeal, friendMealForDay } from './friendMeal';

function ready() {
  return chooseBreakfast(wakeMorning(createInitialState()), 'skip');
}

describe('Thao playable invitation and split bill', () => {
  it('charges exactly half the bill and updates real game state', () => {
    const game = ready();
    const result = chooseFriendMeal(game, 'split');
    expect(result.cash).toBe(game.cash - 26000);
    expect(result.city.minutes).toBe(game.city.minutes + 35);
    expect(result.city.energy).toBe(game.city.energy - 3);
    expect(result.morning.satiety).toBe(game.morning.satiety + 25);
    expect(result.customerBond['friend-thao']).toBe(1);
    expect(result.city.journal[0]).toContain('26.000');
    expect(friendMealForDay(result)).toBe('split');
    expect(chooseFriendMeal(result, 'host')).toBe(result);
  });

  it('lets the player host only after confirming the full amount', () => {
    const game = ready();
    const result = chooseFriendMeal(game, 'host');
    expect(result.cash).toBe(game.cash - 52000);
    expect(result.customerBond['friend-thao']).toBe(2);
    expect(result.notice).toContain('lần sau');
  });

  it('never overdrafts and always offers a free way to decline', () => {
    const game = { ...ready(), cash: 0 };
    const blocked = chooseFriendMeal(game, 'host');
    expect(blocked.cash).toBe(0);
    expect(friendMealForDay(blocked)).toBeNull();
    const declined = chooseFriendMeal(blocked, 'decline');
    expect(declined.cash).toBe(0);
    expect(friendMealForDay(declined)).toBe('decline');
    expect(chooseFriendMeal(declined, 'split')).toBe(declined);
  });

  it('remembers the choice across JSON reload and on the following day', () => {
    const first = chooseFriendMeal(ready(), 'split');
    const saved = JSON.parse(JSON.stringify(first)) as typeof first;
    expect(friendMealForDay(saved)).toBe('split');
    expect(chooseFriendMeal(saved, 'split')).toBe(saved);
    const tomorrow = chooseBreakfast(wakeMorning(nextDay(saved)), 'skip');
    expect(friendMealForDay(tomorrow)).toBeNull();
    const later = chooseFriendMeal(tomorrow, 'decline');
    expect(later.notice).toContain('nhớ lần');
    expect(later.relationshipRewardIds).toHaveLength(first.relationshipRewardIds.length + 1);
  });

  it('does not allow a bill before breakfast or during an open shift', () => {
    const start = createInitialState();
    expect(chooseFriendMeal(start, 'split')).toBe(start);
    const readyGame = ready();
    const opened = startDay(readyGame);
    expect(chooseFriendMeal(opened, 'split')).toBe(opened);
  });
});
