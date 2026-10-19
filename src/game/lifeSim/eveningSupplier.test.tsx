import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { cityAction, getMarketOffers } from '../city';
import { loadGame, saveGame } from '../storage';
import { chooseBreakfast, wakeMorning } from './morning';
import { EveningSupplierPanel } from '../../components/life/EveningSupplierPanel';
import {
  canChooseSupplierEvening, chooseSupplierEvening, getSupplierEveningChoice,
  getSupplierMorningCallback, getSupplierReservationDiscount,
} from './eveningSupplier';

function finishedShift() {
  const game = createInitialState();
  return { ...game, phase: 'summary' as const, summary: {
    day: game.day, eventName: game.event.name, orders: 1, perfectOrders: 0,
    bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0, profit: 0,
    averageScore: 80, fansGained: 0, researchGained: 0,
  } };
}

describe('evening supplier reservation and next-day market', () => {
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

  it('renders three real post-shift choices with explicit non-refundable reservation cost', () => {
    const html = renderToStaticMarkup(createElement(EveningSupplierPanel, {
      game: finishedShift(), onGame: () => undefined,
    }));
    expect(html).toContain('Hẹn nguyên liệu với cô Hạnh');
    expect(html).toContain('Đặt giỏ nguyên liệu');
    expect(html).toContain('Nhắn hỏi thăm cô Hạnh');
    expect(html).toContain('Về nghỉ, không đặt hàng');
    expect(html).toContain('Không ghé mua thì mất phí giữ hàng');
  });

  it('reserves exactly once, survives save/sleep/reload, and actually discounts the next market purchase', () => {
    const game = finishedShift();
    const reserved = chooseSupplierEvening(game, 'reserve');
    expect(reserved.cash).toBe(game.cash - 2000);
    expect(reserved.city.minutes).toBe(game.city.minutes + 6);
    expect(reserved.city.energy).toBe(game.city.energy - 2);
    expect(reserved.city.goodwill).toBe(game.city.goodwill + 1);
    expect(reserved.city.stories.bonds.hanh).toBe((game.city.stories.bonds.hanh ?? 0) + 1);
    expect(chooseSupplierEvening(reserved, 'chat')).toBe(reserved);
    saveGame(reserved);
    const restored = loadGame();
    expect(getSupplierEveningChoice(restored)).toBe('reserve');
    const asleep = nextDay(restored);
    expect(getSupplierMorningCallback(asleep)).toBeNull();
    expect(getSupplierReservationDiscount(asleep)).toBe(6000);
    const awake = wakeMorning(asleep);
    expect(getSupplierMorningCallback(awake)).toContain('6.000');
    expect(getMarketOffers(awake)[0].cost).toBe(42000);
    const ready = chooseBreakfast(awake, 'skip');
    const purchased = cityAction(ready, { type: 'market', basket: 'full' }, { x: -26, z: -9 });
    expect(purchased.cash).toBe(ready.cash - 42000);
    expect(purchased.inventory.cupsM).toBe(ready.inventory.cupsM + 12);
    expect(purchased.city.errands).toContain('market');
    expect(cityAction(purchased, { type: 'market', basket: 'full' }, { x: -26, z: -9 }).cash).toBe(purchased.cash);
    saveGame(purchased);
    const reloaded = loadGame();
    expect(reloaded.cash).toBe(purchased.cash);
    expect(reloaded.city.errands).toContain('market');
    expect(reloaded.relationshipRewardIds.filter(id => id === 'evening-supplier-1-reserve')).toHaveLength(1);
  });

  it('offers a free fail-forward route at zero cash, zero energy and closing time', () => {
    const game = finishedShift();
    const broke = { ...game, cash: 0, city: { ...game.city, minutes: 1260, energy: 0 } };
    expect(canChooseSupplierEvening(broke, 'reserve')).toBe(false);
    expect(canChooseSupplierEvening(broke, 'chat')).toBe(false);
    expect(canChooseSupplierEvening(broke, 'rest')).toBe(true);
    const rested = chooseSupplierEvening(broke, 'rest');
    expect(rested.cash).toBe(0);
    expect(rested.city.minutes).toBe(1260);
    expect(getSupplierEveningChoice(rested)).toBe('rest');
    expect(getSupplierReservationDiscount(nextDay(rested))).toBe(0);
  });

  it('remembers a free conversation the next morning but never grants a price discount', () => {
    const game = finishedShift();
    const chatted = chooseSupplierEvening(game, 'chat');
    expect(chatted.cash).toBe(game.cash);
    expect(chatted.city.minutes).toBe(game.city.minutes + 2);
    const tomorrow = wakeMorning(nextDay(chatted));
    expect(getSupplierMorningCallback(tomorrow)).toContain('hỏi thăm');
    expect(getMarketOffers(tomorrow)[0].cost).toBe(48000);
    saveGame(tomorrow);
    expect(getSupplierMorningCallback(loadGame())).toContain('hỏi thăm');
  });

  it('does not leak discounts into day 8 or scripted day 10/11 offers', () => {
    const ids = ['evening-supplier-6-reserve', 'evening-supplier-9-reserve', 'market.day10.full'];
    expect(getSupplierReservationDiscount({ day: 7, relationshipRewardIds: ids })).toBe(6000);
    expect(getSupplierReservationDiscount({ day: 8, relationshipRewardIds: ids })).toBe(0);
    expect(getMarketOffers({ day: 10, relationshipRewardIds: ids })[0].cost).toBe(60000);
    expect(getMarketOffers({ day: 11, relationshipRewardIds: ids })[0].cost).toBe(44000);
  });

  it('rejects stale/invalid phase, numeric corruption, and repeated decisions', () => {
    const game = finishedShift();
    const stale = { ...game, summary: { ...game.summary!, day: 0 } };
    const invalid = { ...game, cash: Number.NaN };
    expect(chooseSupplierEvening(stale, 'reserve')).toBe(stale);
    expect(chooseSupplierEvening(invalid, 'reserve')).toBe(invalid);
    expect(chooseSupplierEvening({ ...game, phase: 'open' }, 'reserve').cash).toBe(game.cash);
    expect(chooseSupplierEvening(game, 'unknown' as 'reserve')).toBe(game);
    const day7 = { ...game, day: 7, summary: { ...game.summary!, day: 7 } };
    expect(canChooseSupplierEvening(day7, 'reserve')).toBe(false);
  });
});
