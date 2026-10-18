import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, hydrateMorning, prepareLunch, wakeMorning } from './morning';
import { canEatPackedLunch, eatPackedLunch } from './packedLunch';
import { takeShiftBreak } from './shiftNeeds';

function preparedShift() {
  const awake = wakeMorning(createInitialState());
  const fed = chooseBreakfast(awake, 'skip');
  return startDay(prepareLunch(fed, 'lunchbox'));
}

describe('prepared lunchbox during tea service', () => {
  it('charges only at home, then consumes exactly once at the counter', () => {
    const open = preparedShift();
    expect(open.cash).toBe(204000);
    expect(canEatPackedLunch(open)).toBe(true);
    const eaten = eatPackedLunch(open);
    expect(eaten.cash).toBe(open.cash);
    expect(eaten.city.minutes).toBe(open.city.minutes + 10);
    expect(eaten.city.energy).toBe(Math.min(100, open.city.energy + 4));
    expect(eaten.morning.satiety).toBe(open.morning.satiety + 30);
    expect(eaten.morning.shiftBreakOrder).toBe(open.served);
    expect(eaten.city.journal[0]).toContain('cơm hộp');
    expect(canEatPackedLunch(eaten)).toBe(false);
    expect(eatPackedLunch(eaten)).toBe(eaten);
  });

  it('keeps the eaten flag through a v3 reload and resets on the next day', () => {
    const eaten = eatPackedLunch(preparedShift());
    const saved = JSON.parse(JSON.stringify(eaten)) as typeof eaten;
    saved.morning = hydrateMorning(saved.morning, { day: saved.day, city: saved.city }, 'open');
    expect(canEatPackedLunch(saved)).toBe(false);
    expect(eatPackedLunch(saved)).toBe(saved);
    const tomorrow = nextDay({ ...saved, phase: 'summary' });
    expect(tomorrow.morning.lunchPrep).toBeNull();
    expect(canEatPackedLunch(tomorrow)).toBe(false);
  });

  it('does not grant a second break for the same customer or without a lunchbox', () => {
    const open = preparedShift();
    const rested = takeShiftBreak({ ...open, city: { ...open.city, energy: 80 } }, 'rest');
    expect(canEatPackedLunch(rested)).toBe(false);
    expect(eatPackedLunch(rested)).toBe(rested);
    expect(canEatPackedLunch({ ...open, morning: { ...open.morning, lunchPrep: 'water' } })).toBe(false);
    expect(canEatPackedLunch({ ...open, currentOrder: null })).toBe(false);
    expect(canEatPackedLunch({ ...open, city: { ...open.city, minutes: 1255 } })).toBe(false);
    expect(canEatPackedLunch({ ...open, city: { ...open.city, energy: NaN } })).toBe(false);
  });
});
