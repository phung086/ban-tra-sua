import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerScene } from '../../components/CustomerScene';
import { createInitialState } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import {
  askRememberedCustomerAboutComplaint, canCheckRememberedPromiseCup,
  checkRememberedPromiseCup, getRememberedPromiseCupCheck,
  greetRememberedCustomer, promiseRememberedCorrection,
} from './rememberedCustomer';
import { getRememberedCupMismatch } from './rememberedCupCheck';

function returning(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 3, phase: 'open',
    city: { ...initial.city, day: 3, minutes: 850, energy: 50 },
    reviews: [{
      id: 'check-review', customerId: 'miu', customerName: 'Miu',
      day: 1, stars: 2, score: 45, text: 'Topping chưa đúng đơn',
      replyStyle: 'sweet', replyText: 'Tiệm xin lỗi',
    }],
    relationshipRewardIds: [
      'review-care:check-review:1:message',
      'review-followup:check-review:remember',
    ],
    currentOrder: {
      id: 'cup-check-order', customerId: 'miu', size: 'M',
      base: 'classic-milk-tea', sugar: 25, ice: 50,
      topping: 'none', targetFill: 80, targetShake: 60, price: 20000,
    },
  };
}

function promised(): GameState {
  return promiseRememberedCorrection(
    askRememberedCustomerAboutComplaint(greetRememberedCustomer(returning())));
}

function mixed(game: GameState, topping: 'none' | 'black-pearl' = 'none'): GameState {
  return {
    ...game,
    draft: {
      ...game.draft, base: 'classic-milk-tea', size: 'M',
      topping, sugar: 25, ice: 50, fill: 80, shake: 60, sealed: false,
    },
  };
}

const render = (game: GameState) =>
  renderToStaticMarkup(createElement(CustomerScene, { game, onGame: () => {} }));

afterEach(() => vi.unstubAllGlobals());

describe('promised customer cup check: real counter -> state -> save -> delivery', () => {
  it('charges time and energy once, persists, and confirms a corrected real delivery', () => {
    const before = mixed(promised());
    expect(canCheckRememberedPromiseCup(before)).toBe(true);
    expect(render(before)).toContain('Soát ly trước khi dập nắp');
    const checked = checkRememberedPromiseCup(before);
    expect(getRememberedPromiseCupCheck(checked)).toBe('ready');
    expect(checked.city.minutes).toBe(before.city.minutes + 2);
    expect(checked.city.energy).toBe(before.city.energy - 1);
    expect(checked.cash).toBe(before.cash);
    expect(checked.inventory).toEqual(before.inventory);
    expect(checked.currentOrder).toEqual(before.currentOrder);
    expect(checked.draft).toEqual(before.draft);
    expect(checkRememberedPromiseCup(checked)).toBe(checked);
    expect(render(checked)).toContain('Đã soát đúng công thức');
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
    saveGame(checked);
    const restored = loadGame();
    expect(getRememberedPromiseCupCheck(restored)).toBe('ready');
    expect(checkRememberedPromiseCup(restored)).toBe(restored);
    const order = restored.currentOrder!;
    const served = deliverDrink({
      ...restored, draft: { ...restored.draft, sealed: true },
    }, true, PLACES[deliveryFor(order)], order.id);
    expect(served.served).toBe(restored.served + 1);
    expect(served.storyLog[0].title).toBe('Khách quen hài lòng');
    expect(served.storyLog[0].text).toContain('Tiệm đã giữ lời kiểm tra kỹ');
  });

  it('spots the wrong topping and reacts after the player fixes the draft', () => {
    const wrong = mixed(promised(), 'black-pearl');
    const checked = checkRememberedPromiseCup(wrong);
    expect(getRememberedPromiseCupCheck(checked)).toBe('fix');
    expect(checked.notice).toContain('Topping chưa đúng đơn');
    expect(render(checked)).toContain('Ly hiện còn lỗi');
    const fixed = { ...checked, draft: { ...checked.draft, topping: 'none' as const } };
    expect(getRememberedCupMismatch(fixed.currentOrder!, fixed.draft)).toBeNull();
    expect(render(fixed)).toContain('Đã chỉnh đúng công thức sau lần soát');
    expect(checkRememberedPromiseCup(fixed)).toBe(fixed);
    const order = fixed.currentOrder!;
    const delivered = deliverDrink({
      ...fixed, draft: { ...fixed.draft, sealed: true },
    }, true, PLACES[deliveryFor(order)], order.id);
    expect(delivered.storyLog[0].title).toBe('Khách quen hài lòng');
  });

  it('does not offer free or premature checks; sealing and exhaustion block new checks', () => {
    const noPromise = mixed(returning());
    expect(canCheckRememberedPromiseCup(noPromise)).toBe(false);
    const early = promised();
    expect(canCheckRememberedPromiseCup(early)).toBe(false);
    const sealed = { ...mixed(early), draft: { ...mixed(early).draft, sealed: true } };
    const tired = { ...mixed(early), city: { ...early.city, energy: 0 } };
    const late = { ...mixed(early), city: { ...early.city, minutes: 1259 } };
    expect(canCheckRememberedPromiseCup(sealed)).toBe(false);
    expect(canCheckRememberedPromiseCup(tired)).toBe(false);
    expect(canCheckRememberedPromiseCup(late)).toBe(false);
    expect(checkRememberedPromiseCup(sealed)).toBe(sealed);
    expect(checkRememberedPromiseCup(tired)).toBe(tired);
    expect(checkRememberedPromiseCup(late)).toBe(late);
  });
});
