import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ShiftBreakPanel } from '../../components/life/ShiftBreakPanel';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import {
  applyShiftFatigue, canTakeShiftBreak, takeShiftBreak,
} from './shiftNeeds';

const ready = (breakfast: 'cook' | 'street' | 'skip' = 'skip') => {
  const awake = wakeMorning(createInitialState());
  return startDay(chooseBreakfast(awake, breakfast));
};

describe('playable between-order recovery', () => {
  it('shows both actions in the mounted shift-break UI', () => {
    const game = ready();
    const html = renderToStaticMarkup(createElement(ShiftBreakPanel, {
      game, onGame: () => undefined,
    }));
    expect(html).toContain('Giữ sức giữa ca bán trà');
    expect(html).toContain('Ăn chuối');
    expect(html).toContain('Ngồi nghỉ');
    expect(html).toContain('Độ no 30/100');
  });

  it('computes less fatigue for a filling breakfast', () => {
    const full = ready('cook');
    const hungry = ready('skip');
    const fullAfter = applyShiftFatigue(full);
    const hungryAfter = applyShiftFatigue(hungry);
    expect(fullAfter.morning.satiety).toBe(full.morning.satiety - 8);
    expect(hungryAfter.morning.satiety).toBe(hungry.morning.satiety - 8);
    expect(fullAfter.city.energy).toBe(full.city.energy - 1);
    expect(hungryAfter.city.energy).toBe(hungry.city.energy - 4);
  });

  it('charges a snack only once per order and preserves that decision after save/reload', () => {
    const game = ready('skip');
    const eaten = takeShiftBreak(game, 'snack');
    expect(eaten.cash).toBe(game.cash - 9000);
    expect(eaten.city.minutes).toBe(game.city.minutes + 5);
    expect(eaten.morning.satiety).toBe(54);
    const loaded = JSON.parse(JSON.stringify(eaten)) as typeof eaten;
    loaded.morning = hydrateMorning(loaded.morning, { day: loaded.day, city: loaded.city }, 'open');
    expect(canTakeShiftBreak(loaded, 'snack')).toBe(false);
    expect(takeShiftBreak(loaded, 'snack')).toBe(loaded);
    expect(takeShiftBreak(loaded, 'rest')).toBe(loaded);
  });

  it('allows a free rest even when the player cannot afford a snack', () => {
    const game = ready('skip');
    const tired = { ...game, cash: 0, city: { ...game.city, energy: 30 } };
    expect(canTakeShiftBreak(tired, 'snack')).toBe(false);
    expect(canTakeShiftBreak(tired, 'rest')).toBe(true);
    const rested = takeShiftBreak(tired, 'rest');
    expect(rested.cash).toBe(0);
    expect(rested.city.energy).toBe(36);
    expect(rested.city.minutes).toBe(tired.city.minutes + 12);
  });

  it('rejects duplicate breaks and resets the allowance the next day', () => {
    const game = ready('skip');
    const rested = takeShiftBreak(game, 'snack');
    const tomorrow = nextDay(rested);
    expect(tomorrow.morning.shiftBreakOrder).toBeUndefined();
    expect(canTakeShiftBreak(tomorrow, 'snack')).toBe(false);
    expect(takeShiftBreak(tomorrow, 'snack')).toBe(tomorrow);
    const late = { ...game, city: { ...game.city, minutes: 1259 } };
    expect(canTakeShiftBreak(late, 'rest')).toBe(false);
    expect(applyShiftFatigue(tomorrow)).toBe(tomorrow);
  });

  it('refuses corrupt numeric state instead of subtracting NaN', () => {
    const game = ready('skip');
    const invalid = { ...game, city: { ...game.city, energy: Number.NaN } };
    expect(canTakeShiftBreak(invalid, 'rest')).toBe(false);
    expect(takeShiftBreak(invalid, 'rest')).toBe(invalid);
  });

  it.todo('deduct satiety and energy only after successful physical delivery in service.ts');
});
