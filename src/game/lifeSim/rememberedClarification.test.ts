import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../engine';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import {
  askRememberedCustomerAboutComplaint,
  canAskRememberedCustomerAboutComplaint,
  greetRememberedCustomer,
  hasAskedRememberedCustomerAboutComplaint,
  keepRememberedPreferencePrivate,
} from './rememberedCustomer';

function returning(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 3, phase: 'open',
    city: { ...initial.city, day: 3, minutes: 850, energy: 50 },
    reviews: [{
      id: 'care-1', customerId: 'miu', customerName: 'Miu', day: 1,
      stars: 2, score: 45, text: 'Trà quá ngọt',
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

afterEach(() => vi.unstubAllGlobals());

describe('returning customer clarification', () => {
  it('allows first-return consented feedback to be clarified once without rewriting the order', () => {
    const original = returning();
    const firstReturn = { ...original, storyLog: [] };
    const greeted = greetRememberedCustomer(firstReturn);
    expect(canAskRememberedCustomerAboutComplaint(greeted)).toBe(true);
    const asked = askRememberedCustomerAboutComplaint(greeted);
    expect(asked.storyLog[0].text).toContain('Trà quá ngọt');
    expect(asked.city.minutes).toBe(greeted.city.minutes + 3);
    expect(asked.city.energy).toBe(greeted.city.energy - 1);
    expect(asked.currentOrder).toEqual(greeted.currentOrder);
    expect(askRememberedCustomerAboutComplaint(asked)).toBe(asked);
  });

  it('costs time and energy once, preserves the order and survives save/reload', () => {
    const before = returning();
    expect(canAskRememberedCustomerAboutComplaint(before)).toBe(false);
    const greeted = greetRememberedCustomer(before);
    expect(canAskRememberedCustomerAboutComplaint(greeted)).toBe(true);
    const asked = askRememberedCustomerAboutComplaint(greeted);
    expect(asked.city.minutes).toBe(greeted.city.minutes + 3);
    expect(asked.city.energy).toBe(greeted.city.energy - 1);
    expect(asked.city.goodwill).toBe(greeted.city.goodwill + 1);
    expect(asked.customerBond.miu).toBe(greeted.customerBond.miu + 1);
    expect(asked.cash).toBe(greeted.cash);
    expect(asked.currentOrder).toEqual(greeted.currentOrder);
    expect(asked.storyLog[0].title).toBe('Khách quen kể kỹ góp ý');
    expect(asked.storyLog[0].text).toContain('Topping chưa đúng đơn');
    expect(askRememberedCustomerAboutComplaint(asked)).toBe(asked);

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(asked);
    const restored = loadGame();
    expect(hasAskedRememberedCustomerAboutComplaint(restored)).toBe(true);
    expect(canAskRememberedCustomerAboutComplaint(restored)).toBe(false);
    expect(restored.storyLog[0].text).toContain('Topping chưa đúng đơn');
  });

  it('respects privacy and never asks without sufficient energy', () => {
    const before = returning();
    expect(canAskRememberedCustomerAboutComplaint(keepRememberedPreferencePrivate(before))).toBe(false);
    const tired = greetRememberedCustomer({
      ...before, city: { ...before.city, energy: 1 },
    });
    expect(canAskRememberedCustomerAboutComplaint(tired)).toBe(false);
  });
});
