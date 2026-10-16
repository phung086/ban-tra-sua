import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, hydrateMorning, prepareLunch, wakeMorning } from './morning';

function afterBreakfast(cash?: number) {
  const base = createInitialState();
  return chooseBreakfast(wakeMorning(cash === undefined ? base : { ...base, cash }), 'skip');
}

describe('optional lunch preparation', () => {
  it('charges once and updates satiety, game time, and journal', () => {
    const before = afterBreakfast();
    const after = prepareLunch(before, 'lunchbox');
    expect(after.cash).toBe(before.cash - 16000);
    expect(after.city.minutes).toBe(before.city.minutes + 15);
    expect(after.morning.satiety).toBe(before.morning.satiety + 12);
    expect(after.morning.lunchPrep).toBe('lunchbox');
    expect(after.city.journal[0]).toContain('cơm hộp');
    expect(prepareLunch(after, 'lunchbox')).toBe(after);
    expect(prepareLunch(after, 'water')).toBe(after);
  });

  it('provides a free choice with zero cash and never blocks the shop', () => {
    const before = afterBreakfast(0);
    const blocked = prepareLunch(before, 'lunchbox');
    expect(blocked.cash).toBe(0);
    expect(blocked.morning.lunchPrep).toBeNull();
    const water = prepareLunch(blocked, 'water');
    expect(water.cash).toBe(0);
    expect(water.city.minutes).toBe(before.city.minutes + 2);
    expect(startDay(water).phase).toBe('open');
    expect(startDay(before).phase).toBe('open');
  });

  it('hydrates old v3 morning saves without a lunch field', () => {
    const before = afterBreakfast();
    const old = JSON.parse(JSON.stringify(before.morning));
    delete old.lunchPrep;
    const migrated = hydrateMorning(old, { day: before.day, city: before.city }, 'prep');
    expect(migrated.step).toBe('finished');
    expect(migrated.lunchPrep).toBeNull();
    const after = prepareLunch({ ...before, morning: migrated }, 'lunchbox');
    const restored = hydrateMorning(JSON.parse(JSON.stringify(after.morning)),
      { day: after.day, city: after.city }, 'prep');
    expect(restored.lunchPrep).toBe('lunchbox');
    expect(prepareLunch({ ...after, morning: restored }, 'water').cash).toBe(after.cash);
  });

  it('resets the optional choice next day and disallows shopping mid-shift', () => {
    const packed = prepareLunch(afterBreakfast(), 'water');
    const open = startDay(packed);
    expect(prepareLunch(open, 'lunchbox')).toBe(open);
    const next = nextDay(packed);
    expect(next.morning.lunchPrep).toBeNull();
    expect(next.morning.step).toBe('asleep');
  });
});
