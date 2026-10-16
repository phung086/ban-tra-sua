import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { callFather, chooseBreakfast, createMorning, hydrateMorning, wakeMorning } from './morning';

function ready() {
  const game = createInitialState();
  game.morning = createMorning({ day: game.day, city: game.city }, 'quang-test-seed');
  return chooseBreakfast(wakeMorning(game), 'skip');
}

describe('father Quang playable morning call', () => {
  it('lets the player listen for free, advancing time and bond exactly once', () => {
    const start = ready();
    const called = callFather(start, 'listen');
    expect(called.cash).toBe(start.cash);
    expect(called.city.minutes).toBe(start.city.minutes + 5);
    expect(called.customerBond['family-father-quang']).toBe(1);
    expect(called.morning.fatherCall).toBe('listen');
    expect(callFather(called, 'promise')).toBe(called);
  });

  it('remembers a promise on the next day', () => {
    const called = callFather(ready(), 'promise');
    expect(called.relationshipRewardIds).toContain('family-father-quang-sign');
    expect(called.customerBond['family-father-quang']).toBe(2);
    const next = nextDay(called);
    expect(next.morning.fatherCall).toBeNull();
    const later = callFather(chooseBreakfast(wakeMorning(next), 'skip'), 'listen');
    expect(later.notice).toContain('nhớ lời con hứa');
    expect(later.customerBond['family-father-quang']).toBe(3);
  });

  it('migrates old v3 mornings without losing the breakfast decision', () => {
    const game = ready();
    const saved = JSON.parse(JSON.stringify(game.morning));
    delete saved.fatherCall;
    const hydrated = hydrateMorning(saved, { day: game.day, city: game.city }, 'prep');
    expect(hydrated.breakfast).toBe('skip');
    expect(hydrated.fatherCall).toBeNull();
    const once = callFather({ ...game, morning: hydrated }, 'listen');
    const reloaded = hydrateMorning(JSON.parse(JSON.stringify(once.morning)), { day: once.day, city: once.city }, 'prep');
    expect(reloaded.fatherCall).toBe('listen');
    expect(callFather({ ...once, morning: reloaded }, 'listen')).toBeDefined();
    expect(callFather({ ...once, morning: reloaded }, 'listen').cash).toBe(once.cash);
  });

  it('blocks calls before breakfast or during a tea shift', () => {
    const game = createInitialState();
    expect(callFather(game, 'listen')).toBe(game);
    const readyGame = ready();
    const open = { ...readyGame, phase: 'open' as const };
    expect(callFather(open, 'promise')).toBe(open);
  });
});
