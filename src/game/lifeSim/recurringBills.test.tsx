import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { EveningCarePanel } from '../../components/life/EveningCarePanel';
import {
  deferUtilitiesBill,
  getUtilitiesBillStatus,
  payUtilitiesBill,
  reserveUtilitiesBill,
  UTILITIES_BILL_AMOUNT,
  UTILITIES_DAILY_RESERVE,
} from './recurringBills';

function summaryForDay(day: number) {
  let game = createInitialState();
  for (let current = 1; current < day; current += 1) game = nextDay(game);
  return {
    ...game,
    phase: 'summary' as const,
    city: { ...game.city, minutes: 1260 },
    summary: {
      day: game.day, eventName: game.event.name, orders: 0,
      perfectOrders: 0, bestCombo: 0, revenue: 0,
      ingredientCost: 0, wasteCost: 0, profit: 0,
      averageScore: 0, fansGained: 0, researchGained: 0,
    },
  };
}

describe('recurring household utilities bill', () => {
  let saved: Map<string, string>;
  beforeEach(() => {
    saved = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows a clear budget preview and reserves money at most once per day', () => {
    const game = summaryForDay(1);
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game, onGame: () => undefined,
    }));
    expect(html).toContain('Hóa đơn điện nước');
    expect(html).toContain('150.000');
    expect(html).toContain('Để dành 5.000');
    const after = reserveUtilitiesBill(game);
    expect(after.cash).toBe(game.cash - UTILITIES_DAILY_RESERVE);
    expect(getUtilitiesBillStatus(after).reservedThisPeriod).toBe(UTILITIES_DAILY_RESERVE);
    expect(getUtilitiesBillStatus(after).reservedToday).toBe(true);
    expect(reserveUtilitiesBill(after)).toBe(after);
  });

  it('persists a daily reservation through the existing v3 save/reload path', () => {
    const reserved = reserveUtilitiesBill(summaryForDay(1));
    saveGame(reserved);
    const restored = loadGame();
    expect(restored.cash).toBe(reserved.cash);
    expect(getUtilitiesBillStatus(restored).reservedToday).toBe(true);
    expect(reserveUtilitiesBill(restored)).toBe(restored);
  });

  it('uses the reserved envelope before wallet cash and never charges twice', () => {
    const reservations = Array.from({ length: 30 }, (_, index) =>
      'utilities-reserve-1-' + (index + 1));
    const due = {
      ...summaryForDay(30),
      cash: 50_000,
      relationshipRewardIds: reservations,
    };
    const status = getUtilitiesBillStatus(due);
    expect(status.due).toBe(true);
    expect(status.amountDue).toBe(UTILITIES_BILL_AMOUNT);
    expect(status.reservedForDue).toBe(UTILITIES_BILL_AMOUNT);
    expect(status.shortfall).toBe(0);
    expect(status.canPay).toBe(true);
    const paid = payUtilitiesBill(due);
    expect(paid.cash).toBe(due.cash);
    expect(getUtilitiesBillStatus(paid).paid).toBe(true);
    expect(payUtilitiesBill(paid)).toBe(paid);
    saveGame(paid);
    expect(getUtilitiesBillStatus(loadGame()).paid).toBe(true);
  });

  it('offers a no-cost extension when a broke player reaches the due date', () => {
    const due = { ...summaryForDay(30), cash: 0 };
    expect(getUtilitiesBillStatus(due).canDefer).toBe(true);
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: due, onGame: () => undefined,
    }));
    expect(html).toContain('Xin gia hạn miễn phí');
    const deferred = deferUtilitiesBill(due);
    expect(deferred.cash).toBe(0);
    expect(getUtilitiesBillStatus(deferred).deferred).toBe(true);
    const nextDayState = nextDay(deferred);
    expect(nextDayState.day).toBe(31);
    expect(getUtilitiesBillStatus(nextDayState).due).toBe(true);
    expect(getUtilitiesBillStatus(nextDayState).amountDue).toBe(UTILITIES_BILL_AMOUNT);
  });

  it('requires a current post-shift summary and keeps the tea shop playable', () => {
    const game = summaryForDay(30);
    const prep = { ...game, phase: 'prep' as const };
    const stale = { ...game, summary: { ...game.summary!, day: game.day - 1 } };
    expect(reserveUtilitiesBill(prep)).toBe(prep);
    expect(payUtilitiesBill(prep)).toBe(prep);
    expect(deferUtilitiesBill(prep)).toBe(prep);
    expect(reserveUtilitiesBill(stale)).toBe(stale);
    expect(game.phase).toBe('summary');
    expect(game.cash).toBeGreaterThanOrEqual(0);
  });
});
