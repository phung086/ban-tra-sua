import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import { beginBreakfastCooking, finishBreakfastCooking, isCookingBreakfast, getBreakfastCookingHeat, canBeginBreakfastCooking } from './breakfastCooking';

const ready = () => {
  const game = wakeMorning(createInitialState());
  return { ...game, city: { ...game.city, energy: 50 } };
};

describe('playable home cooking', () => {
  it('prepares without paying twice, then offers a filling slow meal', () => {
    const game = ready();
    const prep = beginBreakfastCooking(game);
    expect(prep.cash).toBe(game.cash);
    expect(prep.city.minutes).toBe(game.city.minutes + 5);
    expect(beginBreakfastCooking(prep)).toBe(prep);
    const saved = JSON.parse(JSON.stringify(prep)) as typeof prep;
    const loaded = { ...saved, morning: hydrateMorning(saved.morning, { day: saved.day, city: saved.city }, 'prep') };
    expect(isCookingBreakfast(loaded)).toBe(true);
    const done = finishBreakfastCooking(loaded, 'gentle');
    expect(done.cash).toBe(game.cash - 14000);
    expect(done.city.minutes).toBe(game.city.minutes + 25);
    expect(done.morning.satiety).toBe(90);
    expect(getBreakfastCookingHeat(done)).toBe('gentle');
    expect(finishBreakfastCooking(done, 'gentle')).toBe(done);
  });

  it('cooks quickly with less satiety and preserves the choice after reload', () => {
    const game = ready();
    const done = finishBreakfastCooking(beginBreakfastCooking(game), 'quick');
    expect(done.city.minutes).toBe(game.city.minutes + 15);
    expect(done.city.energy).toBe(game.city.energy + 1);
    expect(done.morning.satiety).toBe(65);
    expect(getBreakfastCookingHeat(JSON.parse(JSON.stringify(done)))).toBe('quick');
  });

  it('always permits a free fallback and rejects impossible cooking', () => {
    const game = ready();
    expect(canBeginBreakfastCooking({ ...game, cash: 0 })).toBe(false);
    expect(canBeginBreakfastCooking({ ...game, city: { ...game.city, minutes: 1250 } })).toBe(false);
    const prep = beginBreakfastCooking(game);
    const skipped = chooseBreakfast(prep, 'skip');
    expect(skipped.cash).toBe(game.cash);
    expect(skipped.morning.step).toBe('finished');
    expect(isCookingBreakfast(skipped)).toBe(false);
    expect(nextDay(skipped).morning.breakfast).toBeNull();
  });

  it('keeps a finished cooking command idempotent after a save-shaped reload', () => {
    const game = ready();
    const done = finishBreakfastCooking(beginBreakfastCooking(game), 'gentle');
    expect(done.lifeSimEventLedger).toContain(`day:${game.day}:breakfast:finish-gentle`);

    const restored = JSON.parse(JSON.stringify(done)) as typeof done;
    const replay = finishBreakfastCooking(restored, 'gentle');
    expect(replay).toBe(restored);
    expect(replay.cash).toBe(done.cash);
    expect(replay.city.minutes).toBe(done.city.minutes);
  });

});
