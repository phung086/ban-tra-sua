import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { wakeMorning } from './morning';
import { UtilityBillPanel } from '../../components/life/UtilityBillPanel';
import { UTILITY_BILL_VND, canChooseUtilityBill, chooseUtilityBill, oldestUnpaidUtilityBill, utilityBillMorningMessage, utilityBillWasDeferred } from './utilityBill';

function finishedDay(day = 14) {
  const game = createInitialState();
  return { ...game, day, phase: 'summary' as const, cash: 50000,
    city: { ...game.city, minutes: 1000, energy: 50 },
    summary: { day, eventName: game.event.name, orders: 1, perfectOrders: 0,
      bestCombo: 0, revenue: 50000, ingredientCost: 0, wasteCost: 0,
      profit: 50000, averageScore: 80, fansGained: 0, researchGained: 0 } };
}
describe('utility bill gameplay', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the first invoice after the day-14 shift, not before', () => {
    const due = finishedDay();
    const html = renderToStaticMarkup(createElement(UtilityBillPanel, { game: due, onGame: () => undefined }));
    expect(html).toContain('Thanh toán ngay');
    expect(html).toContain('Nhắn hẹn thanh toán');
    expect(html).toContain('32.000');
    expect(oldestUnpaidUtilityBill({ ...due, phase: 'prep' })).toBeNull();
    expect(oldestUnpaidUtilityBill(finishedDay(13))).toBeNull();
  });

  it('pays exactly once and remembers it after sleep and save/reload', () => {
    const before = finishedDay();
    const paid = chooseUtilityBill(before, 'pay');
    expect(paid.cash).toBe(before.cash - UTILITY_BILL_VND);
    expect(paid.dailyCost).toBe(before.dailyCost + UTILITY_BILL_VND);
    expect(paid.summary?.profit).toBe(before.summary!.profit - UTILITY_BILL_VND);
    expect(paid.city.minutes).toBe(1005);
    expect(paid.city.energy).toBe(49);
    expect(chooseUtilityBill(paid, 'pay')).toBe(paid);
    saveGame(paid);
    const loaded = loadGame();
    expect(oldestUnpaidUtilityBill(loaded)).toBeNull();
    const morning = wakeMorning(nextDay(loaded));
    expect(utilityBillMorningMessage(morning)).toContain('đã thanh toán đủ');
    expect(renderToStaticMarkup(createElement(UtilityBillPanel, { game: morning, onGame: () => undefined }))).toContain('Sổ chi tiêu');
  });

  it('can defer at zero cash and pay later after waking with no late fee', () => {
    const base = finishedDay();
    const broke = { ...base, cash: 0, city: { ...base.city, energy: 0, minutes: 1260 } };
    expect(canChooseUtilityBill(broke, 'pay')).toBe(false);
    expect(canChooseUtilityBill(broke, 'defer')).toBe(true);
    const deferred = chooseUtilityBill(broke, 'defer');
    expect(deferred.cash).toBe(0);
    expect(utilityBillWasDeferred(deferred, 14)).toBe(true);
    expect(chooseUtilityBill(deferred, 'defer')).toBe(deferred);
    saveGame(deferred);
    const morning = wakeMorning(nextDay(loadGame()));
    expect(oldestUnpaidUtilityBill(morning)).toBe(14);
    expect(utilityBillMorningMessage(morning)).toContain('chưa thanh toán');
    const ready = { ...morning, cash: 40000, city: { ...morning.city, energy: 30, minutes: 500 } };
    const paid = chooseUtilityBill(ready, 'pay');
    expect(paid.cash).toBe(8000);
    expect(oldestUnpaidUtilityBill(paid)).toBeNull();
  });

  it('allows sleeping without any decision and settles oldest bill first', () => {
    const tomorrow = wakeMorning(nextDay(finishedDay()));
    expect(oldestUnpaidUtilityBill(tomorrow)).toBe(14);
    expect(canChooseUtilityBill(tomorrow, 'defer')).toBe(false);
    const day28 = finishedDay(28);
    const first = chooseUtilityBill(day28, 'pay');
    expect(oldestUnpaidUtilityBill(first)).toBe(28);
    const second = chooseUtilityBill({ ...first, cash: 50000 }, 'pay');
    expect(oldestUnpaidUtilityBill(second)).toBeNull();
  });

  it('rejects malformed values, stale summary, unknown choice and sleeping payment', () => {
    const base = finishedDay();
    const bad = { ...base, cash: Number.NaN };
    expect(chooseUtilityBill(bad, 'pay')).toBe(bad);
    const stale = { ...base, summary: { ...base.summary, day: 13 } };
    expect(chooseUtilityBill(stale, 'pay')).toBe(stale);
    expect(chooseUtilityBill(base, 'other' as 'pay')).toBe(base);
    expect(canChooseUtilityBill(nextDay(base), 'pay')).toBe(false);
  });
});
