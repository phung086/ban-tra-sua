import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerScene } from '../../components/CustomerScene';
import { createInitialState } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import { greetRememberedCustomer } from './rememberedCustomer';
import {
  canOfferRememberedSample, hasOfferedRememberedSample,
  offerRememberedSample, REMEMBERED_SAMPLE_COST,
} from './rememberedSample';

function returning(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 4, phase: 'open', cash: 210000,
    city: { ...initial.city, day: 4, minutes: 850, energy: 50 },
    reviews: [{
      id: 'sample-review', customerId: 'miu', customerName: 'Miu',
      day: 1, stars: 2, score: 45, text: 'Topping chưa đúng đơn',
      replyStyle: 'sweet', replyText: 'Mình xin lỗi nhé',
    }],
    relationshipRewardIds: [
      'review-care:sample-review:1:message',
      'review-followup:sample-review:remember',
      'remembered-service:sample-complaint-day-three',
    ],
    storyLog: [{
      id: 'remembered-service:sample-complaint-day-three',
      customerId: 'miu', customerName: 'Miu',
      title: 'Khách quen góp ý thêm',
      text: 'Miu: Topping chưa đúng đơn.', day: 3, rewardFans: 0,
    }],
    currentOrder: {
      id: 'sample-day-four', customerId: 'miu', size: 'M',
      base: 'classic-milk-tea', sugar: 25, ice: 50,
      topping: 'none', targetFill: 80, targetShake: 60, price: 20000,
    },
  };
}

function prepared(game: GameState, correct: boolean): GameState {
  return {
    ...game, draft: {
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

const render = (game: GameState) =>
  renderToStaticMarkup(createElement(CustomerScene, { game, onGame: () => {} }));

afterEach(() => vi.unstubAllGlobals());

describe('NPC taste sample: cost now, trust only after correct delivery', () => {
  it('shows a real counter choice, charges once and persists across reload', () => {
    const initial = returning();
    expect(canOfferRememberedSample(initial)).toBe(false);
    const greeted = greetRememberedCustomer(initial);
    expect(render(greeted)).toContain('Mời khách thử trà mẫu');
    const offered = offerRememberedSample(greeted);
    expect(offered.cash).toBe(greeted.cash - REMEMBERED_SAMPLE_COST);
    expect(offered.city.minutes).toBe(greeted.city.minutes + 3);
    expect(offered.city.energy).toBe(greeted.city.energy - 1);
    expect(offered.city.goodwill).toBe(greeted.city.goodwill);
    expect(offered.customerBond.miu).toBe(greeted.customerBond.miu);
    expect(offered.currentOrder).toEqual(greeted.currentOrder);
    expect(hasOfferedRememberedSample(offered)).toBe(true);
    expect(offerRememberedSample(offered)).toBe(offered);
    expect(render(offered)).toContain('Đã mời thử trà mẫu');

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(offered);
    const restored = loadGame();
    expect(hasOfferedRememberedSample(restored)).toBe(true);
    expect(restored.cash).toBe(offered.cash);
    expect(offerRememberedSample(restored)).toBe(restored);
    expect(restored.storyLog.filter(log => log.id === 'remembered-sample:sample-day-four')).toHaveLength(1);
  });

  it('requires cash, energy, time and an unsealed cup; free fallback remains playable', () => {
    const greeted = greetRememberedCustomer(returning());
    for (const state of [
      { ...greeted, cash: REMEMBERED_SAMPLE_COST - 1 },
      { ...greeted, city: { ...greeted.city, energy: 0 } },
      { ...greeted, city: { ...greeted.city, minutes: 1258 } },
      { ...greeted, draft: { ...greeted.draft, sealed: true } },
    ]) {
      expect(canOfferRememberedSample(state)).toBe(false);
      expect(offerRememberedSample(state)).toBe(state);
      expect(render(state)).toContain('Không thể mời trà mẫu');
    }
  });

  it('awards trust only after real correct delivery; wrong cup cannot buy forgiveness', () => {
    const greeted = greetRememberedCustomer(returning());
    const offered = offerRememberedSample(greeted);
    const correctBaseline = deliver(prepared(greeted, true));
    const correct = deliver(prepared(offered, true));
    expect(correct.served).toBe(offered.served + 1);
    expect(correct.cash).toBe(correctBaseline.cash - REMEMBERED_SAMPLE_COST);
    expect(correct.city.goodwill).toBe(correctBaseline.city.goodwill + 1);
    expect(correct.customerBond.miu).toBe((correctBaseline.customerBond.miu ?? 0) + 1);
    expect(correct.storyLog[0].text).toContain('trà mẫu');
    expect(deliverDrink(correct, true, PLACES[deliveryFor(offered.currentOrder!)], offered.currentOrder!.id)).toBe(correct);

    const wrongBaseline = deliver(prepared(greeted, false));
    const wrong = deliver(prepared(offered, false));
    expect(wrong.city.goodwill).toBe(wrongBaseline.city.goodwill);
    expect(wrong.customerBond.miu).toBe(wrongBaseline.customerBond.miu);
    expect(wrong.storyLog[0].title).toBe('Khách quen góp ý thêm');
    expect(wrong.storyLog[0].text).toContain('trà mẫu');
  });
});
