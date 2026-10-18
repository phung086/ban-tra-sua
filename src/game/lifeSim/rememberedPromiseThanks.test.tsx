import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerScene } from '../../components/CustomerScene';
import { createInitialState, nextDay } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import { askRememberedCustomerAboutComplaint, checkRememberedPromiseCup,
  greetRememberedCustomer, promiseRememberedCorrection } from './rememberedCustomer';
import { canThankAfterPromise, hasThankedAfterPromise, keptPromiseOnReturn,
  thankAfterPromise } from './rememberedThanks';

const order: NonNullable<GameState['currentOrder']> = {
  id: 'kept-cup-day-two', customerId: 'miu', size: 'M',
  base: 'classic-milk-tea', sugar: 25, ice: 50, topping: 'none',
  targetFill: 80, targetShake: 60, price: 20000,
};

function nextVisit(): GameState {
  const initial = createInitialState();
  const dayTwo: GameState = {
    ...initial, day: 2, phase: 'open', targetOrders: 1,
    city: { ...initial.city, day: 2, minutes: 850, energy: 50 },
    reviews: [{
      id: 'kept-review', customerId: 'miu', customerName: 'Miu', day: 1,
      stars: 2, score: 45, text: 'Topping chưa đúng đơn',
      replyStyle: 'sweet', replyText: 'Mình xin lỗi',
    }],
    relationshipRewardIds: ['review-care:kept-review:1:message', 'review-followup:kept-review:remember'],
    currentOrder: order,
  };
  const discussed = askRememberedCustomerAboutComplaint(greetRememberedCustomer(dayTwo));
  const promised = promiseRememberedCorrection(discussed);
  const prepared = {
    ...promised, draft: {
      ...promised.draft, base: 'classic-milk-tea' as const, size: 'M' as const,
      topping: 'none' as const, sugar: 25, ice: 50, fill: 80, shake: 60, sealed: false,
    },
  };
  const checked = checkRememberedPromiseCup(prepared);
  const ready = { ...checked, draft: { ...checked.draft, sealed: true } };
  const delivered = deliverDrink(ready, true, PLACES[deliveryFor(order)], order.id);
  expect(delivered.phase).toBe('summary');
  expect(delivered.storyLog[0].title).toBe('Khách quen hài lòng');
  const slept = nextDay(delivered);
  expect(slept.day).toBe(3);
  expect(slept.city.day).toBe(3);
  return { ...slept, phase: 'open', currentOrder: { ...order, id: 'day-three-return' },
    city: { ...slept.city, minutes: 850, energy: 50 } };
}

const render = (game: GameState) =>
  renderToStaticMarkup(createElement(CustomerScene, { game, onGame: () => {} }));
afterEach(() => vi.unstubAllGlobals());

describe('NPC kept promise after real delivery and nextDay sleep', () => {
  it('offers an optional check-in once, with exact costs, persistent memory and no money change', () => {
    const returned = nextVisit();
    expect(keptPromiseOnReturn(returned)?.day).toBe(2);
    expect(canThankAfterPromise(returned)).toBe(false);
    const greeted = greetRememberedCustomer(returned);
    expect(canThankAfterPromise(greeted)).toBe(true);
    expect(render(greeted)).toContain('Hỏi thăm sau lần giữ lời');
    const asked = thankAfterPromise(greeted);
    expect(asked.cash).toBe(greeted.cash);
    expect(asked.currentOrder).toEqual(greeted.currentOrder);
    expect(asked.city.minutes).toBe(greeted.city.minutes + 2);
    expect(asked.city.energy).toBe(greeted.city.energy - 1);
    expect(asked.city.goodwill).toBe(greeted.city.goodwill + 1);
    expect(asked.customerBond.miu).toBe((greeted.customerBond.miu ?? 0) + 1);
    expect(hasThankedAfterPromise(asked)).toBe(true);
    expect(thankAfterPromise(asked)).toBe(asked);
    expect(render(asked)).toContain('Đã hỏi thăm. Khách ghi nhận tiệm đã giữ lời');
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(asked);
    const restored = loadGame();
    expect(restored.relationshipRewardIds.filter(id => id === 'remembered-thanks:kept-cup-day-two')).toHaveLength(1);
    expect(restored.storyLog.filter(item => item.id === 'remembered-thanks:kept-cup-day-two')).toHaveLength(1);
    expect(thankAfterPromise(restored)).toBe(restored);
    expect(canThankAfterPromise({ ...restored, currentOrder: { ...order, id: 'another-visit' } })).toBe(false);
  });

  it('never rewards an unchecked cup, an unresolved newer complaint, or exhausted/late players', () => {
    const greeted = greetRememberedCustomer(nextVisit());
    const tired = { ...greeted, city: { ...greeted.city, energy: 0 } };
    const late = { ...greeted, city: { ...greeted.city, minutes: 1259 } };
    expect(canThankAfterPromise(tired)).toBe(false);
    expect(canThankAfterPromise(late)).toBe(false);
    expect(thankAfterPromise(tired)).toBe(tired);
    expect(thankAfterPromise(late)).toBe(late);
    const unchecked = { ...greeted, relationshipRewardIds: greeted.relationshipRewardIds.filter(id => !id.startsWith('remembered-cup-check:')) };
    expect(keptPromiseOnReturn(unchecked)).toBeNull();
    const newerComplaint = {
      ...greeted, day: 4, city: { ...greeted.city, day: 4 },
      storyLog: [{
        id: 'remembered-service:newer-broken', customerId: 'miu', customerName: 'Miu',
        title: 'Khách quen góp ý thêm', text: 'Ly hôm nay sai topping.', day: 3, rewardFans: 0,
      }, ...greeted.storyLog],
    };
    expect(keptPromiseOnReturn(newerComplaint)).toBeNull();
    expect(canThankAfterPromise(newerComplaint)).toBe(false);
  });
});
