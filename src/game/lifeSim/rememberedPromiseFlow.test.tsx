import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerScene } from '../../components/CustomerScene';
import { createInitialState } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import {
  askRememberedCustomerAboutComplaint, canPromiseRememberedCorrection,
  getUnresolvedRememberedComplaint, greetRememberedCustomer,
  hasPromisedRememberedCorrection, promiseRememberedCorrection,
} from './rememberedCustomer';

function returning(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 3, phase: 'open',
    city: { ...initial.city, day: 3, minutes: 850, energy: 50 },
    reviews: [{
      id: 'promise-review', customerId: 'miu', customerName: 'Miu', day: 1,
      stars: 2, score: 45, text: 'Topping chưa đúng đơn',
      replyStyle: 'sweet', replyText: 'Tiệm xin lỗi',
    }],
    relationshipRewardIds: [
      'review-care:promise-review:1:message',
      'review-followup:promise-review:remember',
    ],
    currentOrder: {
      id: 'promise-order', customerId: 'miu', size: 'M',
      base: 'classic-milk-tea', sugar: 25, ice: 50,
      topping: 'none', targetFill: 80, targetShake: 60, price: 20000,
    },
  };
}

function asked(): GameState {
  return askRememberedCustomerAboutComplaint(greetRememberedCustomer(returning()));
}

function prepare(game: GameState, correct: boolean): GameState {
  return {
    ...game,
    draft: {
      ...game.draft, base: 'classic-milk-tea', size: 'M',
      topping: correct ? 'none' : 'black-pearl',
      sugar: 25, ice: 50, fill: 80, shake: 60, sealed: true,
    },
  };
}

function serve(game: GameState): GameState {
  const order = game.currentOrder!;
  return deliverDrink(game, true, PLACES[deliveryFor(order)], order.id);
}

const render = (game: GameState) =>
  renderToStaticMarkup(createElement(CustomerScene, { game, onGame: () => {} }));

afterEach(() => vi.unstubAllGlobals());

describe('remembered customer: optional promise with consequences', () => {
  it('offers the promise only after a real clarification, charges time once and survives reload', () => {
    const initial = returning();
    expect(canPromiseRememberedCorrection(initial)).toBe(false);
    const discussed = asked();
    expect(canPromiseRememberedCorrection(discussed)).toBe(true);
    expect(render(discussed)).toContain('Hứa kiểm tra kỹ');
    const promised = promiseRememberedCorrection(discussed);
    expect(promised.city.minutes).toBe(discussed.city.minutes + 1);
    expect(promised.city.energy).toBe(discussed.city.energy);
    expect(promised.cash).toBe(discussed.cash);
    expect(promised.currentOrder).toEqual(discussed.currentOrder);
    expect(promiseRememberedCorrection(promised)).toBe(promised);
    expect(render(promised)).toContain('Đã hứa kiểm tra kỹ');
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(promised);
    const restored = loadGame();
    expect(hasPromisedRememberedCorrection(restored)).toBe(true);
    expect(canPromiseRememberedCorrection(restored)).toBe(false);
  });

  it('rewards keeping the promise on real delivery, without modifying the order or money', () => {
    const discussed = asked();
    const baseline = serve(prepare(discussed, true));
    const promised = prepare(promiseRememberedCorrection(discussed), true);
    const delivered = serve(promised);
    expect(delivered.served).toBe(promised.served + 1);
    expect(delivered.storyLog[0].title).toBe('Khách quen hài lòng');
    expect(delivered.storyLog[0].text).toContain('Tiệm đã giữ lời kiểm tra kỹ');
    expect(delivered.customerBond.miu).toBe((baseline.customerBond.miu ?? 0) + 1);
    expect(delivered.city.goodwill).toBe(baseline.city.goodwill + 1);
    expect(delivered.cash).toBe(baseline.cash);
    expect(serve(delivered)).toBe(delivered);
    const dayFour: GameState = {
      ...delivered, day: 4, phase: 'open',
      city: { ...delivered.city, day: 4 },
      currentOrder: { ...promised.currentOrder!, id: 'promise-next-day' },
    };
    expect(getUnresolvedRememberedComplaint(dayFour)).toBeNull();
  });

  it('makes a broken promise visible to the NPC next day without double penalties', () => {
    const discussed = asked();
    const baseline = serve(prepare(discussed, false));
    const promised = prepare(promiseRememberedCorrection(discussed), false);
    const delivered = serve(promised);
    expect(delivered.storyLog[0].title).toBe('Khách quen góp ý thêm');
    expect(delivered.storyLog[0].text).toContain('đã hứa kiểm tra kỹ nhưng vẫn làm sai');
    expect(delivered.customerBond.miu).toBe(Math.max(0, (baseline.customerBond.miu ?? 0) - 1));
    expect(delivered.city.goodwill).toBe(Math.max(0, baseline.city.goodwill - 1));
    expect(delivered.cash).toBe(baseline.cash);
    expect(serve(delivered)).toBe(delivered);
    const dayFour: GameState = {
      ...delivered, day: 4, phase: 'open',
      city: { ...delivered.city, day: 4 },
      currentOrder: { ...promised.currentOrder!, id: 'promise-next-day' },
    };
    expect(getUnresolvedRememberedComplaint(dayFour)?.day).toBe(3);
  });
});
