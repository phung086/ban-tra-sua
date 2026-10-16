import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerScene } from '../../components/CustomerScene';
import { createInitialState } from '../engine';
import { loadGame, saveGame } from '../storage';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import type { GameState, Review } from '../types';
import { canGreetRememberedCustomer, greetRememberedCustomer, hasRememberedLowSugar } from './rememberedCustomer';

const complaint: Review = {
  id: 'return-1', customerId: 'miu', customerName: 'Miu',
  day: 1, stars: 2, score: 45, text: 'Trà hơi ngọt',
  replyStyle: 'sweet', replyText: 'Mình xin ghi nhận nhé!',
};

function returningCustomer(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 2, phase: 'open',
    city: { ...initial.city, day: 2, minutes: 850, energy: 50 },
    reviews: [complaint],
    relationshipRewardIds: [
      'review-care:return-1:1:message',
      'review-followup:return-1:remember',
    ],
    currentOrder: {
      id: 'return-order', customerId: 'miu', size: 'M',
      base: 'classic-milk-tea', sugar: 25, ice: 50, topping: 'none',
      targetFill: 80, targetShake: 60, price: 20000,
    },
  };
}

const render = (game: GameState) =>
  renderToStaticMarkup(createElement(CustomerScene, { game, onGame: () => {} }));

afterEach(() => vi.unstubAllGlobals());

describe('remembered customer at the real tea counter', () => {
  it('does not infer preferences from a complaint without explicit follow-up consent', () => {
    const state = returningCustomer();
    const noConsent = { ...state, relationshipRewardIds: ['review-care:return-1:1:message'] };
    expect(hasRememberedLowSugar(noConsent, 'miu')).toBe(false);
    expect(render(noConsent)).not.toContain('Nhớ khách thích ít ngọt');
    expect(hasRememberedLowSugar(state, 'miu')).toBe(true);
    expect(hasRememberedLowSugar(state, 'nam')).toBe(false);
  });

  it('renders the actual requested sugar level and optional greeting', () => {
    const html = render(returningCustomer());
    expect(html).toContain('Nhớ khách thích ít ngọt');
    expect(html).toContain('Khách đặt 25% đường');
    expect(html).toContain('Chào khách quen');
  });

  it('spends time and energy once, without changing money or the requested drink', () => {
    const state = returningCustomer();
    const greeted = greetRememberedCustomer(state);
    expect(greeted).not.toBe(state);
    expect(greeted.city.minutes).toBe(852);
    expect(greeted.city.energy).toBe(49);
    expect(greeted.city.goodwill).toBe(state.city.goodwill + 1);
    expect(greeted.customerBond.miu).toBe(state.customerBond.miu + 1);
    expect(greeted.cash).toBe(state.cash);
    expect(greeted.currentOrder).toEqual(state.currentOrder);
    expect(greetRememberedCustomer(greeted)).toBe(greeted);
    expect(render(greeted)).toContain('Đã chào khách theo sở thích');
    expect(render(greeted)).toContain('Ồ, tiệm còn nhớ mình!');
    expect(render(greeted)).toContain('Hôm nay mình đặt 25% đường nhé.');
    expect(render(greeted)).toContain('aria-live="polite"');
    expect(render(state)).not.toContain('Ồ, tiệm còn nhớ mình!');
  });

  it('shows real saved delivery feedback when the customer returns on a later day', () => {
    const original = returningCustomer();
    const prepared = greetRememberedCustomer({
      ...original,
      draft: { ...original.draft, base: 'classic-milk-tea', size: 'M',
        topping: 'black-pearl', sugar: 25, ice: 50, fill: 80, shake: 60, sealed: true },
    });
    const order = prepared.currentOrder!;
    const served = deliverDrink(prepared, true, PLACES[deliveryFor(order)], order.id);
    expect(served.storyLog[0].text).toContain('Topping chưa đúng đơn');
    const later = {
      ...served, day: 3, phase: 'open' as const,
      city: { ...served.city, day: 3 },
      currentOrder: { ...order, id: 'return-order-next-day' },
    };
    expect(render(later)).toContain('Lần giao trước (ngày 2)');
    expect(render(later)).toContain('Topping chưa đúng đơn');
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    });
    saveGame(later);
    expect(render(loadGame())).toContain('Topping chưa đúng đơn');
  });

  it('treats tea with too little sugar as a complaint, not a low-sugar preference, after reload', () => {
    const original = returningCustomer();
    const state = { ...original, reviews: [{ ...complaint, text: 'Trà ít đường quá' }] };
    expect(render(state)).toContain('Nhớ góp ý của khách quen');
    expect(render(state)).not.toContain('Nhớ khách thích ít ngọt');
    const greeted = greetRememberedCustomer(state);
    expect(greeted.notice).toContain('Bạn nhớ góp ý trước đây');
    expect(greeted.currentOrder).toEqual(state.currentOrder);
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    });
    saveGame(greeted);
    const restored = loadGame();
    expect(render(restored)).toContain('Nhớ góp ý của khách quen');
    expect(render(restored)).not.toContain('Nhớ khách thích ít ngọt');
  });

  it('survives save/reload and never blocks normal service when tired', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    });
    const greeted = greetRememberedCustomer(returningCustomer());
    saveGame(greeted);
    const restored = loadGame();
    expect(hasRememberedLowSugar(restored, 'miu')).toBe(true);
    expect(greetRememberedCustomer(restored)).toBe(restored);
    expect(render(restored)).toContain('Đã chào khách theo sở thích');
    const tired = { ...returningCustomer(), city: { ...returningCustomer().city, energy: 0 } };
    expect(canGreetRememberedCustomer(tired)).toBe(false);
    expect(greetRememberedCustomer(tired)).toBe(tired);
    expect(render(tired)).toContain('Không đủ năng lượng');
    expect(render(tired)).toContain('Khách đặt 25% đường');
  });
});
