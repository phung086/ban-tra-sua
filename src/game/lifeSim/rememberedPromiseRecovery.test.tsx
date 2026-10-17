import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerScene } from '../../components/CustomerScene';
import { createInitialState } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import {
  apologizeForBrokenPromise, askRememberedCustomerAboutComplaint,
  canApologizeForBrokenPromise, getBrokenRememberedPromise,
  greetRememberedCustomer, hasApologizedForBrokenPromise,
  promiseRememberedCorrection,
} from './rememberedCustomer';

function returning(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 3, phase: 'open',
    city: { ...initial.city, day: 3, minutes: 850, energy: 50 },
    reviews: [{
      id: 'apology-review', customerId: 'miu', customerName: 'Miu',
      day: 1, stars: 2, score: 45, text: 'Topping chưa đúng đơn',
      replyStyle: 'sweet', replyText: 'Tiệm xin lỗi',
    }],
    relationshipRewardIds: [
      'review-care:apology-review:1:message',
      'review-followup:apology-review:remember',
    ],
    currentOrder: {
      id: 'promise-broken-day-3', customerId: 'miu', size: 'M',
      base: 'classic-milk-tea', sugar: 25, ice: 50,
      topping: 'none', targetFill: 80, targetShake: 60, price: 20000,
    },
  };
}

function prepared(game: GameState, correct: boolean): GameState {
  return {
    ...game,
    draft: {
      ...game.draft, base: 'classic-milk-tea', size: 'M',
      topping: correct ? 'none' : 'black-pearl',
      sugar: 25, ice: 50, fill: 80, shake: 60, sealed: true,
    },
  };
}

function deliver(game: GameState): GameState {
  const order = game.currentOrder!;
  return deliverDrink(game, true, PLACES[deliveryFor(order)], order.id);
}

function nextDay(game: GameState): GameState {
  return {
    ...game, day: game.day + 1, phase: 'open',
    city: { ...game.city, day: game.day + 1, minutes: 850, energy: 50 },
    currentOrder: { ...returning().currentOrder!, id: 'return-after-promise-' + (game.day + 1) },
  };
}

function discussed(): GameState {
  return askRememberedCustomerAboutComplaint(greetRememberedCustomer(returning()));
}

function brokenPromise(): GameState {
  return nextDay(deliver(prepared(promiseRememberedCorrection(discussed()), false)));
}

const render = (game: GameState) =>
  renderToStaticMarkup(createElement(CustomerScene, { game, onGame: () => {} }));

afterEach(() => vi.unstubAllGlobals());

describe('NPC remembers a broken promise and allows a one-time apology', () => {
  it('repairs trust at the real counter, persists once, and changes the next delivery dialogue', () => {
    const returned = brokenPromise();
    expect(getBrokenRememberedPromise(returned)?.day).toBe(3);
    expect(canApologizeForBrokenPromise(returned)).toBe(false);
    const greeted = greetRememberedCustomer(returned);
    expect(render(greeted)).toContain('Xin lỗi vì thất hứa');
    expect(canApologizeForBrokenPromise(greeted)).toBe(true);
    const repaired = apologizeForBrokenPromise(greeted);
    expect(repaired.city.minutes).toBe(greeted.city.minutes + 2);
    expect(repaired.city.energy).toBe(greeted.city.energy - 1);
    expect(repaired.city.goodwill).toBe(greeted.city.goodwill + 1);
    expect(repaired.customerBond.miu).toBe((greeted.customerBond.miu ?? 0) + 1);
    expect(repaired.cash).toBe(greeted.cash);
    expect(repaired.currentOrder).toEqual(greeted.currentOrder);
    expect(hasApologizedForBrokenPromise(repaired)).toBe(true);
    expect(apologizeForBrokenPromise(repaired)).toBe(repaired);
    expect(render(repaired)).toContain('Đã xin lỗi vì thất hứa');
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(repaired);
    const restored = loadGame();
    expect(hasApologizedForBrokenPromise(restored)).toBe(true);
    expect(restored.relationshipRewardIds.filter(id => id === 'remembered-apology:promise-broken-day-3')).toHaveLength(1);
    expect(restored.storyLog.filter(moment => moment.id === 'remembered-apology:promise-broken-day-3')).toHaveLength(1);
    expect(apologizeForBrokenPromise(restored)).toBe(restored);
    const served = deliver(prepared(restored, true));
    expect(served.storyLog[0].title).toBe('Khách quen hài lòng');
    expect(served.storyLog[0].text).toContain('Cảm ơn tiệm đã xin lỗi');
    expect(getBrokenRememberedPromise(nextDay(served))).toBeNull();
  });

  it('does not reward an unbroken promise, or allow apology when exhausted/too late', () => {
    expect(getBrokenRememberedPromise(returning())).toBeNull();
    const kept = nextDay(deliver(prepared(promiseRememberedCorrection(discussed()), true)));
    expect(getBrokenRememberedPromise(kept)).toBeNull();
    const withoutPromise = nextDay(deliver(prepared(discussed(), false)));
    expect(getBrokenRememberedPromise(withoutPromise)).toBeNull();
    const greeted = greetRememberedCustomer(brokenPromise());
    const tired = { ...greeted, city: { ...greeted.city, energy: 0 } };
    const late = { ...greeted, city: { ...greeted.city, minutes: 1259 } };
    expect(canApologizeForBrokenPromise(tired)).toBe(false);
    expect(canApologizeForBrokenPromise(late)).toBe(false);
    expect(apologizeForBrokenPromise(tired)).toBe(tired);
    expect(apologizeForBrokenPromise(late)).toBe(late);
  });

  it('keeps the complaint open if the next tea is still wrong', () => {
    const greeted = greetRememberedCustomer(brokenPromise());
    const wrong = deliver(prepared(apologizeForBrokenPromise(greeted), false));
    expect(wrong.storyLog[0].title).toBe('Khách quen góp ý thêm');
    expect(wrong.storyLog[0].text).toContain('Mình đã nghe lời xin lỗi, nhưng ly vẫn chưa đúng');
    expect(wrong.cash).toBeGreaterThanOrEqual(0);
  });
});
