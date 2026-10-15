import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../engine';
import { deliverDrink, deliveryFor, PLACES } from '../service';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import { greetRememberedCustomer, keepRememberedPreferencePrivate } from './rememberedCustomer';

function returning(): GameState {
  const initial = createInitialState();
  return {
    ...initial, day: 2, phase: 'open',
    city: { ...initial.city, day: 2, minutes: 850, energy: 50 },
    reviews: [{
      id: 'r1', customerId: 'miu', customerName: 'Miu', day: 1,
      stars: 2, score: 45, text: 'Trà ngọt', replyStyle: 'sweet',
      replyText: 'Đã ghi nhận',
    }],
    relationshipRewardIds: ['review-care:r1:1:message', 'review-followup:r1:remember'],
    currentOrder: {
      id: 'return-serve-1', customerId: 'miu', size: 'M',
      base: 'classic-milk-tea', sugar: 25, ice: 50,
      topping: 'none', targetFill: 80, targetShake: 60, price: 20000,
    },
    draft: {
      ...initial.draft, base: 'classic-milk-tea', size: 'M',
      topping: 'none', sugar: 25, ice: 50, fill: 80, shake: 60, sealed: true,
    },
  };
}

function serve(state: GameState) {
  const order = state.currentOrder!;
  return deliverDrink(state, true, PLACES[deliveryFor(order)], order.id);
}

afterEach(() => vi.unstubAllGlobals());

describe('remembered NPC callback on actual delivery', () => {
  it('persists one callback and does not charge additional resources', () => {
    const before = greetRememberedCustomer(returning());
    const after = serve(before);
    expect(after.served).toBe(before.served + 1);
    expect(after.lastScore).toBeGreaterThanOrEqual(80);
    expect(after.notice).toContain('Tiệm còn nhớ mình');
    expect(after.city.minutes).toBe(before.city.minutes);
    expect(after.city.energy).toBe(before.city.energy);
    expect(after.relationshipRewardIds).toContain('remembered-service:return-serve-1');
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
    saveGame(after);
    const restored = loadGame();
    expect(restored.storyLog[0].text).toContain('Ly này vừa miệng');
    expect(restored.relationshipRewardIds.filter(id => id === 'remembered-service:return-serve-1')).toHaveLength(1);
  });

  it('respects privacy and flags an incorrect topping even at high score', () => {
    const quiet = serve(keepRememberedPreferencePrivate(returning()));
    expect(quiet.notice).toContain('Ly hôm nay vừa miệng');
    expect(quiet.notice).not.toContain('Tiệm còn nhớ mình');
    const greeted = greetRememberedCustomer(returning());
    const wrong = serve({ ...greeted, draft: { ...greeted.draft, topping: 'black-pearl' } });
    expect(wrong.lastScore).toBeGreaterThanOrEqual(80);
    expect(wrong.storyLog[0].title).toBe('Khách quen góp ý thêm');
    expect(wrong.notice).toContain('Topping chưa đúng đơn');
  });

  it('flags incorrect fill or shake despite a high score, but tolerates small deviations', () => {
    const greeted = greetRememberedCustomer(returning());
    const underfilled = serve({ ...greeted, draft: { ...greeted.draft, fill: 0 } });
    expect(underfilled.lastScore).toBeGreaterThanOrEqual(80);
    expect(underfilled.notice).toContain('Lượng trà trong ly chưa đúng yêu cầu');
    expect(underfilled.storyLog[0].title).toBe('Khách quen góp ý thêm');

    const underShaken = serve({ ...greeted, draft: { ...greeted.draft, shake: 0 } });
    expect(underShaken.lastScore).toBeGreaterThanOrEqual(80);
    expect(underShaken.notice).toContain('Độ lắc chưa đúng yêu cầu');

    const closeEnough = serve({ ...greeted, draft: { ...greeted.draft, fill: 70, shake: 50 } });
    expect(closeEnough.storyLog[0].title).toBe('Khách quen hài lòng');
  });

  it('never creates callback without consent or a real delivery', () => {
    const noGreeting = serve(returning());
    expect(noGreeting.relationshipRewardIds).not.toContain('remembered-service:return-serve-1');
    const greeted = greetRememberedCustomer(returning());
    const blocked = deliverDrink(greeted, false, PLACES.counter, greeted.currentOrder!.id);
    expect(blocked.served).toBe(greeted.served);
    expect(blocked.relationshipRewardIds).not.toContain('remembered-service:return-serve-1');
  });
});
