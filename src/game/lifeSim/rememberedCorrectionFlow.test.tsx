import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomerScene } from '../../components/CustomerScene';
import { createInitialState } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import { askRememberedCustomerAboutComplaint, getUnresolvedRememberedComplaint, greetRememberedCustomer } from './rememberedCustomer';

function returning(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 3, phase: 'open',
    city: { ...initial.city, day: 3, minutes: 850, energy: 50 },
    reviews: [{
      id: 'care-1', customerId: 'miu', customerName: 'Miu', day: 1,
      stars: 2, score: 45, text: 'Topping chưa đúng đơn',
      replyStyle: 'sweet', replyText: 'Tiệm xin lỗi',
    }],
    relationshipRewardIds: ['review-care:care-1:1:message', 'review-followup:care-1:remember'],
    currentOrder: {
      id: 'return-3', customerId: 'miu', size: 'M', base: 'classic-milk-tea',
      sugar: 25, ice: 50, topping: 'none', targetFill: 80, targetShake: 60, price: 20000,
    },
    storyLog: [{
      id: 'remembered-service:day-2', customerId: 'miu', customerName: 'Miu',
      title: 'Khách quen góp ý thêm', text: 'Miu: Topping chưa đúng đơn.',
      day: 2, rewardFans: 0,
    }],
  };
}

function ready(correct: boolean): GameState {
  const greeted = greetRememberedCustomer(returning());
  const clarified = askRememberedCustomerAboutComplaint(greeted);
  return {
    ...clarified,
    draft: {
      ...clarified.draft, base: 'classic-milk-tea', size: 'M',
      topping: correct ? 'none' : 'black-pearl',
      sugar: 25, ice: 50, fill: 80, shake: 60, sealed: true,
    },
  };
}

function serve(game: GameState): GameState {
  const order = game.currentOrder!;
  return deliverDrink(game, true, PLACES[deliveryFor(order)], order.id);
}

afterEach(() => vi.unstubAllGlobals());

describe('NPC feedback context: live counter, delivery, next-day memory', () => {
  it('lets the player clarify a topping complaint, deliver a corrected tea and persist the thank-you', () => {
    const prepared = ready(true);
    const html = renderToStaticMarkup(createElement(CustomerScene, { game: prepared, onGame: () => {} }));
    expect(html).toContain('Nhớ góp ý của khách quen');
    expect(html).not.toContain('Nhớ khách thích ít ngọt');
    expect(html).toContain('Đã hỏi kỹ góp ý cũ');
    const order = prepared.currentOrder!;
    expect(deliverDrink(prepared, false, PLACES[deliveryFor(order)], order.id).served).toBe(prepared.served);
    const delivered = serve(prepared);
    expect(delivered.served).toBe(prepared.served + 1);
    expect(delivered.notice).toContain('Cảm ơn tiệm đã hỏi kỹ');
    expect(delivered.storyLog[0].title).toBe('Khách quen hài lòng');
    expect(delivered.relationshipRewardIds.filter(id => id === 'remembered-service:return-3')).toHaveLength(1);
    expect(delivered.cash).toBeGreaterThanOrEqual(prepared.cash);
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(delivered);
    const restored = loadGame();
    expect(restored.storyLog[0].text).toContain('Cảm ơn tiệm đã hỏi kỹ');
    expect(restored.relationshipRewardIds.filter(id => id === 'remembered-service:return-3')).toHaveLength(1);
    expect(serve(delivered)).toBe(delivered);
  });

  it('does not thank a wrong remake; the complaint remains actionable next day', () => {
    const wrong = serve(ready(false));
    expect(wrong.storyLog[0].title).toBe('Khách quen góp ý thêm');
    expect(wrong.notice).toContain('Topping chưa đúng đơn');
    expect(wrong.notice).not.toContain('Cảm ơn tiệm đã hỏi kỹ');
    const next = returning();
    const dayFour: GameState = {
      ...next, day: 4, city: { ...next.city, day: 4 },
      storyLog: wrong.storyLog, relationshipRewardIds: wrong.relationshipRewardIds,
      currentOrder: { ...next.currentOrder!, id: 'return-4' },
    };
    expect(getUnresolvedRememberedComplaint(dayFour)?.day).toBe(3);
    const corrected = serve({
      ...greetRememberedCustomer(dayFour),
      draft: { ...next.draft, base: 'classic-milk-tea', size: 'M',
        topping: 'none', sugar: 25, ice: 50, fill: 80, shake: 60, sealed: true },
    });
    expect(corrected.storyLog[0].title).toBe('Khách quen hài lòng');
    expect(corrected.notice).toContain('Lần trước mình có góp ý');
    const fifth: GameState = {
      ...dayFour, day: 5, city: { ...dayFour.city, day: 5 },
      storyLog: corrected.storyLog, relationshipRewardIds: corrected.relationshipRewardIds,
      currentOrder: { ...dayFour.currentOrder!, id: 'return-5' },
    };
    expect(getUnresolvedRememberedComplaint(fifth)).toBeNull();
  });

  it('reads the latest dated feedback even when imported save logs are out of order', () => {
    const base = returning();
    const dayFour: GameState = {
      ...base, day: 4, city: { ...base.city, day: 4 },
      currentOrder: { ...base.currentOrder!, id: 'shuffled-4' },
      storyLog: [
        { id: 'remembered-service:old', customerId: 'miu', customerName: 'Miu',
          title: 'Khách quen hài lòng', text: 'Ly vừa miệng.', day: 2, rewardFans: 0 },
        { id: 'remembered-service:new', customerId: 'miu', customerName: 'Miu',
          title: 'Khách quen góp ý thêm', text: 'Topping chưa đúng đơn.', day: 3, rewardFans: 0 },
      ],
    };
    expect(getUnresolvedRememberedComplaint(dayFour)?.day).toBe(3);
    const asked = askRememberedCustomerAboutComplaint(greetRememberedCustomer(dayFour));
    expect(asked.storyLog[0].title).toBe('Khách quen kể kỹ góp ý');
    expect(asked.storyLog[0].text).toContain('Topping chưa đúng đơn');
  });
});
