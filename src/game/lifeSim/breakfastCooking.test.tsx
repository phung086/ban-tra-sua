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

  it('shows a clear notice and preserves gameplay state when a corrupt ledger blocks cooking', () => {
    const game = ready();
    const corrupt = {
      ...game,
      lifeSimEventLedger: ['not-an-event-key'] as unknown as string[],
    };

    const blockedStart = beginBreakfastCooking(corrupt);
    expect(blockedStart.notice).toContain('dữ liệu lưu không hợp lệ');
    expect(blockedStart.cash).toBe(corrupt.cash);
    expect(blockedStart.city).toBe(corrupt.city);
    expect(blockedStart.morning).toBe(corrupt.morning);
    expect(blockedStart.lifeSimEventLedger).toBe(corrupt.lifeSimEventLedger);
    expect(blockedStart.city.minutes).toBe(corrupt.city.minutes);
    expect(blockedStart.city.energy).toBe(corrupt.city.energy);
    expect(isCookingBreakfast(blockedStart)).toBe(false);

    const prepared = beginBreakfastCooking(game);
    const corruptPrepared = {
      ...prepared,
      lifeSimEventLedger: ['not-an-event-key'] as unknown as string[],
    };
    const blockedFinish = finishBreakfastCooking(corruptPrepared, 'gentle');
    expect(blockedFinish.notice).toContain('dữ liệu lưu không hợp lệ');
    expect(blockedFinish.cash).toBe(corruptPrepared.cash);
    expect(blockedFinish.city).toBe(corruptPrepared.city);
    expect(blockedFinish.morning).toBe(corruptPrepared.morning);
    expect(blockedFinish.lifeSimEventLedger).toBe(corruptPrepared.lifeSimEventLedger);
    expect(blockedFinish.city.minutes).toBe(corruptPrepared.city.minutes);
    expect(blockedFinish.city.energy).toBe(corruptPrepared.city.energy);
  });
});
