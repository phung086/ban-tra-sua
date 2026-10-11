import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { BREAKFAST_OPTIONS, chooseBreakfast, createMorning, hydrateMorning, wakeMorning } from './morning';

const gameWithSeed = (seed = 'stable-test-city') => {
  const game = createInitialState();
  game.morning = createMorning({ day: game.day, city: game.city }, seed);
  return game;
};

describe('playable morning routine', () => {
  it('generates a reproducible wake-up day from the saved world seed', () => {
    const initial = gameWithSeed();
    const same = createMorning({ day: initial.day, city: initial.city }, 'stable-test-city');
    expect(initial.morning).toEqual(same);
    expect(['on-time','snoozed','overslept']).toContain(initial.morning.plan.wakeVariant);
  });

  it('advances the real city clock on waking and does not wake a second time', () => {
    const game = gameWithSeed();
    const awake = wakeMorning(game);
    expect(awake.morning.step).toBe('awake');
    expect(awake.city.minutes).toBe(game.morning.plan.wakeMinute);
    expect(wakeMorning(awake)).toBe(awake);
  });

  it('pays for breakfast once, increments game time and records a journal entry', () => {
    const awake = wakeMorning(gameWithSeed());
    const result = chooseBreakfast(awake, 'street');
    expect(result.cash).toBe(awake.cash-BREAKFAST_OPTIONS.street.cost);
    expect(result.city.minutes).toBe(awake.city.minutes+10);
    expect(result.morning.breakfast).toBe('street');
    expect(result.morning.satiety).toBe(70);
    expect(result.city.journal[0]).toContain('bánh mì');
    expect(chooseBreakfast(result,'street')).toBe(result);
    expect(chooseBreakfast(result,'cook')).toBe(result);
  });

  it('has a free choice when money is insufficient, without allowing debt', () => {
    const awake = wakeMorning({ ...gameWithSeed(), cash: 0 });
    const blocked = chooseBreakfast(awake,'cook');
    expect(blocked.cash).toBe(0);
    expect(blocked.morning.step).toBe('awake');
    const free = chooseBreakfast(blocked,'skip');
    expect(free.cash).toBe(0);
    expect(free.morning.step).toBe('finished');
    expect(free.morning.satiety).toBe(30);
  });

  it('reloads the exact same decision and does not replay payment', () => {
    const bought = chooseBreakfast(wakeMorning(gameWithSeed()), 'cook');
    const saved = JSON.parse(JSON.stringify(bought.morning)) as unknown;
    const restored = hydrateMorning(saved,{ day:bought.day, city:bought.city },'prep');
    expect(restored).toEqual(bought.morning);
    expect(chooseBreakfast({ ...bought, morning: restored },'cook').cash).toBe(bought.cash);
  });

  it('adapts old v3 saves without interrupting an already open tea shift', () => {
    const old = gameWithSeed();
    expect(hydrateMorning(undefined, { day:old.day, city:old.city }, 'prep').step).toBe('asleep');
    const opened = startDay(old);
    const restored = hydrateMorning(undefined,{day:opened.day,city:opened.city},'open');
    expect(restored.step).toBe('finished');
  });

  it('starts the next day with a fresh morning and retains the same world identity', () => {
    const first = chooseBreakfast(wakeMorning(gameWithSeed()),'skip');
    const second = nextDay(first);
    expect(second.morning.day).toBe(2);
    expect(second.morning.worldSeed).toBe(first.morning.worldSeed);
    expect(second.morning.step).toBe('asleep');
    expect(second.morning.breakfast).toBeNull();
    expect(second.morning.plan.day).toBe(second.city.day);
  });
});
