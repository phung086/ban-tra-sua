import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ShiftBreakPanel } from '../../components/life/ShiftBreakPanel';
import { createInitialState, nextDay, startDay, updateDraft } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { chooseBreakfast, hydrateMorning, prepareLunch, wakeMorning } from './morning';
import { canDrinkPackedWater, drinkPackedWater } from './packedWater';

function waterShift() {
  const awake = wakeMorning(createInitialState());
  const prepared = prepareLunch(chooseBreakfast(awake, 'skip'), 'water');
  const open = startDay(prepared);
  return { ...open, cash: 0, city: { ...open.city, energy: 40 } };
}

const render = (game: ReturnType<typeof waterShift>) =>
  renderToStaticMarkup(createElement(ShiftBreakPanel, { game, onGame: () => {} }));

describe('packed water: home → active tea shift → next day', () => {
  it('offers a touch-friendly, zero-cash drink in the actual brewing UI', () => {
    const open = waterShift();
    expect(render(open)).toContain('Uống nước lọc mang theo');
    expect(render(open)).toContain('4 phút · miễn phí · +3 sức');
    expect(render(open)).toContain('Giao ly tiếp theo:');
    const drunk = drinkPackedWater(open);
    expect(render(drunk)).not.toContain('Uống nước lọc mang theo');
    expect(drunk.cash).toBe(0);
    expect(drunk.city.minutes).toBe(open.city.minutes + 4);
    expect(drunk.city.energy).toBe(43);
    expect(drunk.morning.satiety).toBe(open.morning.satiety);
    expect(drunk.morning.shiftBreakOrder).toBe(open.served);
    expect(drunk.city.journal[0]).toContain('Uống nước lọc');
  });

  it('is once per day, idempotent after v3 reload and resets on sleep', () => {
    const drunk = drinkPackedWater(waterShift());
    const restored = JSON.parse(JSON.stringify(drunk)) as typeof drunk;
    restored.morning = hydrateMorning(restored.morning, {
      day: restored.day, city: restored.city,
    }, 'open');
    expect(restored.morning.packedWaterDrunk).toBe(true);
    expect(canDrinkPackedWater(restored)).toBe(false);
    expect(drinkPackedWater(restored)).toBe(restored);
    const tomorrow = nextDay({ ...restored, phase: 'summary' });
    expect(tomorrow.morning.packedWaterDrunk).toBe(false);
    expect(tomorrow.morning.lunchPrep).toBeNull();
    expect(canDrinkPackedWater(tomorrow)).toBe(false);
  });

  it('cannot drink unprepared, twice for an order, at full energy or after curfew', () => {
    const open = waterShift();
    expect(canDrinkPackedWater(open)).toBe(true);
    expect(canDrinkPackedWater({ ...open, morning: {
      ...open.morning, lunchPrep: null,
    } })).toBe(false);
    expect(canDrinkPackedWater({ ...open, morning: {
      ...open.morning, shiftBreakOrder: open.served,
    } })).toBe(false);
    expect(canDrinkPackedWater({ ...open, city: {
      ...open.city, energy: 100,
    } })).toBe(false);
    expect(canDrinkPackedWater({ ...open, city: {
      ...open.city, minutes: 1257,
    } })).toBe(false);
    expect(canDrinkPackedWater({ ...open, city: {
      ...open.city, energy: Number.NaN,
    } })).toBe(false);
    expect(canDrinkPackedWater({ ...open, currentOrder: null })).toBe(false);
    const corrupted = { ...open, morning: {
      ...open.morning, packedWaterDrunk: true,
    } };
    expect(drinkPackedWater(corrupted)).toBe(corrupted);
  });

  it('recovered stamina carries into the next real, physically delivered tea', () => {
    const open = waterShift();
    const order = open.currentOrder!;
    const sealed = updateDraft(open, {
      size: order.size, base: order.base, topping: order.topping,
      sugar: order.sugar, ice: order.ice, fill: order.targetFill,
      shake: order.targetShake, sealed: true,
    });
    const atCustomer = PLACES[deliveryFor(order)];
    const withoutWater = deliverDrink(sealed, true, atCustomer, order.id);
    const withWater = deliverDrink(drinkPackedWater(sealed), true, atCustomer, order.id);
    expect(withWater.served).toBe(open.served + 1);
    expect(withWater.city.energy).toBe(withoutWater.city.energy + 3);
    expect(withWater.morning.satiety).toBe(withoutWater.morning.satiety);
    expect(withWater.cash).toBe(withoutWater.cash);
  });
});
