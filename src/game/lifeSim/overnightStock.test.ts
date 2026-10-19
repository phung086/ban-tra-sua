import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { RESTOCK_ITEMS } from '../content';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { wakeMorning } from './morning';
import { OvernightStockPanel } from '../../components/life/OvernightStockPanel';
import {
  canChooseOvernightStock, chooseOvernightStock, getOvernightStockCallback,
  getOvernightStockChoice,
} from './overnightStock';
import type { GameState } from '../types';

function finishedShift(): GameState {
  const initial = createInitialState();
  const inventory = { ...initial.inventory };
  for (const item of RESTOCK_ITEMS) if (item.perishable) inventory[item.key] = 0;
  inventory.blackPearl = 4;
  return {
    ...initial, phase: 'summary', cash: 20000, dailyCost: 1000,
    city: { ...initial.city, minutes: 1100, energy: 30 },
    inventory,
    freshness: { ...initial.freshness, blackPearl: 17 },
    summary: {
      day: 1, eventName: 'Ngày dịu dàng', orders: 4, perfectOrders: 1,
      bestCombo: 1, revenue: 40000, ingredientCost: 1000, wasteCost: 0,
      profit: 39000, averageScore: 90, fansGained: 0, researchGained: 0,
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('playable overnight stock preservation', () => {
  it('charges once and preserves near-expired topping through the real nextDay decay', () => {
    const baseline = finishedShift();
    expect(nextDay(baseline).inventory.blackPearl).toBe(0);
    const cared = chooseOvernightStock(baseline, 'chill');
    expect(cared.cash).toBe(17000);
    expect(cared.dailyCost).toBe(4000);
    expect(cared.summary?.profit).toBe(36000);
    expect(cared.city.minutes).toBe(1110);
    expect(cared.city.energy).toBe(28);
    expect(cared.freshness.blackPearl).toBe(29);
    expect(chooseOvernightStock(cared, 'sort')).toBe(cared);
    expect(chooseOvernightStock(cared, 'chill')).toBe(cared);
    const tomorrow = nextDay(cared);
    expect(tomorrow.day).toBe(2);
    expect(tomorrow.inventory.blackPearl).toBe(4);
    expect(tomorrow.freshness.blackPearl).toBe(7);
    expect(getOvernightStockChoice(tomorrow, 1)).toBe('chill');
    expect(getOvernightStockCallback(tomorrow)).toBeNull();
    expect(getOvernightStockCallback(wakeMorning(tomorrow))).toMatch(/bảo quản kỹ/);
  });

  it('offers a free fallback when short on money, energy or time', () => {
    const poor = { ...finishedShift(), cash: 0, city: { ...finishedShift().city, energy: 1, minutes: 1258 } };
    expect(canChooseOvernightStock(poor, 'chill')).toBe(false);
    expect(canChooseOvernightStock(poor, 'sort')).toBe(false);
    expect(canChooseOvernightStock(poor, 'leave')).toBe(true);
    const rested = chooseOvernightStock(poor, 'leave');
    expect(rested.cash).toBe(0);
    expect(rested.city.minutes).toBe(1258);
    expect(nextDay(rested).inventory.blackPearl).toBe(0);
    expect(chooseOvernightStock(createInitialState(), 'chill')).toEqual(createInitialState());
  });

  it('cannot claim care with empty perishable stock or outside a completed shift', () => {
    const finished = finishedShift();
    const empty = { ...finished, inventory: { ...finished.inventory, blackPearl: 0 } };
    expect(canChooseOvernightStock(empty, 'chill')).toBe(false);
    expect(canChooseOvernightStock(empty, 'sort')).toBe(false);
    expect(canChooseOvernightStock(empty, 'leave')).toBe(true);
    expect(canChooseOvernightStock({ ...finished, summary: null }, 'chill')).toBe(false);
  });

  it('persists choice, cash and freshness across save/reload, then sleep/wake', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    });
    const saved = chooseOvernightStock(finishedShift(), 'chill');
    saveGame(saved);
    const loaded = loadGame();
    expect(getOvernightStockChoice(loaded)).toBe('chill');
    expect(loaded.cash).toBe(17000);
    expect(loaded.freshness.blackPearl).toBe(29);
    expect(chooseOvernightStock(loaded, 'chill')).toBe(loaded);
    const tomorrow = nextDay(loaded);
    saveGame(tomorrow);
    const reloaded = loadGame();
    expect(reloaded.day).toBe(2);
    expect(reloaded.inventory.blackPearl).toBe(4);
    expect(getOvernightStockCallback(wakeMorning(reloaded))).toMatch(/bảo quản kỹ/);
  });

  it('renders a real accessible summary choice and morning callback', () => {
    const game = finishedShift();
    const html = renderToStaticMarkup(createElement(OvernightStockPanel, { game, onGame: () => {} }));
    expect(html).toContain('Bảo quản nguyên liệu qua đêm');
    expect(html).toContain('Thêm đá, cất topping');
    expect(html).toContain('3.000');
    const selected = chooseOvernightStock(game, 'sort');
    const done = renderToStaticMarkup(createElement(OvernightStockPanel, { game: selected, onGame: () => {} }));
    expect(done).toContain('Đã chọn:');
    expect(done).not.toContain('Thêm đá, cất topping');
    const morning = wakeMorning(nextDay(selected));
    const callback = renderToStaticMarkup(createElement(OvernightStockPanel, { game: morning, onGame: () => {} }));
    expect(callback).toContain('Nhật ký kho sáng nay');
  });
});
