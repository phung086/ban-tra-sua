import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerScene } from '../../components/CustomerScene';
import { createInitialState, nextDay } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import {
  askRememberedCustomerAboutComplaint, checkRememberedPromiseCup,
  getPreviousRememberedServiceFeedback, getRememberedClarificationSource,
  getRememberedPromiseCupCheck, getUnresolvedRememberedComplaint,
  greetRememberedCustomer, promiseRememberedCorrection,
} from './rememberedCustomer';

function returning(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 3, phase: 'open', targetOrders: 1,
    city: { ...initial.city, day: 3, minutes: 850, energy: 50 },
    reviews: [{
      id: 'verification-review', customerId: 'miu', customerName: 'Miu',
      day: 1, stars: 2, score: 45, text: 'Topping chưa đúng đơn',
      replyStyle: 'sweet', replyText: 'Tiệm xin lỗi',
    }],
    relationshipRewardIds: [
      'review-care:verification-review:1:message',
      'review-followup:verification-review:remember',
    ],
    currentOrder: {
      id: 'verification-order', customerId: 'miu', size: 'M',
      base: 'classic-milk-tea', sugar: 25, ice: 50,
      topping: 'none', targetFill: 80, targetShake: 60, price: 20000,
    },
    draft: {
      ...initial.draft, base: 'classic-milk-tea', size: 'M',
      sugar: 25, ice: 50, topping: 'none', fill: 80, shake: 60, sealed: false,
    },
  };
}

function promised(): GameState {
  return promiseRememberedCorrection(
    askRememberedCustomerAboutComplaint(greetRememberedCustomer(returning())));
}

function serve(game: GameState): GameState {
  const order = game.currentOrder!;
  return deliverDrink(
    { ...game, draft: { ...game.draft, sealed: true } },
    true, PLACES[deliveryFor(order)], order.id,
  );
}

function nextVisit(game: GameState): GameState {
  const tomorrow = nextDay(game);
  expect(tomorrow.day).toBe(4);
  return {
    ...tomorrow, phase: 'open',
    currentOrder: { ...returning().currentOrder!, id: 'verification-next-visit' },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('promised cup verification across real delivery and next-day save', () => {
  it('does not invent a kept promise or give trust for a sealed cup that was never checked', () => {
    const initial = promised();
    const sealed = { ...initial, draft: { ...initial.draft, sealed: true } };
    const ui = renderToStaticMarkup(createElement(CustomerScene, { game: sealed, onGame: () => {} }));
    expect(ui).toContain('Đã dập nắp khi chưa soát ly');
    const baseline = serve(askRememberedCustomerAboutComplaint(greetRememberedCustomer(returning())));
    const delivered = serve(initial);
    expect(delivered.phase).toBe('summary');
    expect(delivered.storyLog[0].title).toBe('Khách quen hài lòng');
    expect(delivered.storyLog[0].text).toContain('bỏ qua bước soát ly');
    expect(delivered.storyLog[0].text).not.toContain('đã giữ lời kiểm tra kỹ');
    expect(delivered.customerBond.miu).toBe(baseline.customerBond.miu);
    expect(delivered.city.goodwill).toBe(baseline.city.goodwill);
    expect(delivered.cash).toBe(baseline.cash);
    expect(deliverDrink(delivered, true, PLACES[deliveryFor(initial.currentOrder!)], initial.currentOrder!.id)).toBe(delivered);

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(nextDay(delivered));
    const restored = loadGame();
    expect(restored.day).toBe(4);
    expect(restored.storyLog[0].text).toContain('bỏ qua bước soát ly');
    const visit = { ...restored, phase: 'open' as const,
      currentOrder: { ...initial.currentOrder!, id: 'verification-next-visit' } };
    expect(getPreviousRememberedServiceFeedback(visit)?.title).toBe('Khách quen hài lòng');
    expect(getRememberedClarificationSource(visit)).toBeNull();
  });

  it('rewards a real check before sealing and persists the result across reload', () => {
    const baseline = serve(askRememberedCustomerAboutComplaint(greetRememberedCustomer(returning())));
    const initial = promised();
    const checked = checkRememberedPromiseCup(initial);
    expect(getRememberedPromiseCupCheck(checked)).toBe('ready');
    expect(checked.city.minutes).toBe(initial.city.minutes + 2);
    expect(checked.city.energy).toBe(initial.city.energy - 1);
    expect(checkRememberedPromiseCup(checked)).toBe(checked);
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(checked);
    const restored = loadGame();
    expect(getRememberedPromiseCupCheck(restored)).toBe('ready');
    const delivered = serve(restored);
    expect(delivered.storyLog[0].text).toContain('đã giữ lời kiểm tra kỹ');
    expect(delivered.customerBond.miu).toBe((baseline.customerBond.miu ?? 0) + 1);
    expect(delivered.city.goodwill).toBe(baseline.city.goodwill + 1);
    expect(delivered.cash).toBe(baseline.cash);
    expect(getUnresolvedRememberedComplaint(nextVisit(delivered))).toBeNull();
  });

  it('lets the player fix a detected topping mistake before delivery, but penalizes a remaining error', () => {
    const initial = promised();
    const wrong = { ...initial, draft: { ...initial.draft, topping: 'black-pearl' as const } };
    const checked = checkRememberedPromiseCup(wrong);
    expect(getRememberedPromiseCupCheck(checked)).toBe('fix');
    expect(checked.notice).toContain('Topping chưa đúng đơn');
    const fixed = { ...checked, draft: { ...checked.draft, topping: 'none' as const } };
    const corrected = serve(fixed);
    expect(corrected.storyLog[0].title).toBe('Khách quen hài lòng');
    expect(corrected.storyLog[0].text).toContain('đã giữ lời kiểm tra kỹ');

    const broken = serve(checked);
    expect(broken.storyLog[0].title).toBe('Khách quen góp ý thêm');
    expect(broken.storyLog[0].text).toContain('đã hứa kiểm tra kỹ nhưng vẫn làm sai');
    expect(broken.city.goodwill).toBeLessThan(corrected.city.goodwill);
    expect(getUnresolvedRememberedComplaint(nextVisit(broken))?.day).toBe(3);
  });
});
