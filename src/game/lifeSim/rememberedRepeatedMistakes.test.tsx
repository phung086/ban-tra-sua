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
  greetRememberedCustomer, hasRepeatedRememberedComplaint,
} from './rememberedCustomer';
import { canOfferRememberedSample } from './rememberedSample';

type Result = 'Khách quen góp ý thêm' | 'Khách quen hài lòng';
function returning(results: Result[]): GameState {
  const base = createInitialState();
  return {
    ...base, day: 5, phase: 'open', cash: 210000,
    city: { ...base.city, day: 5, minutes: 850, energy: 50 },
    reviews: [{ id: 'repeat-review', customerId: 'miu', customerName: 'Miu',
      day: 1, stars: 2, score: 45, text: 'Sai topping',
      replyStyle: 'sweet', replyText: 'Mình xin lỗi' }],
    relationshipRewardIds: [
      'review-care:repeat-review:1:message', 'review-followup:repeat-review:remember',
      ...results.map((_, i) => 'remembered-service:repeat-' + (4 - i)),
    ],
    storyLog: results.map((title, i) => ({
      id: 'remembered-service:repeat-' + (4 - i), customerId: 'miu',
      customerName: 'Miu', title, text: title, day: 4 - i, rewardFans: 0,
    })),
    currentOrder: { id: 'repeat-day-five', customerId: 'miu', size: 'M',
      base: 'classic-milk-tea', sugar: 25, ice: 50, topping: 'none',
      targetFill: 80, targetShake: 60, price: 20000 },
  };
}
const render = (game: GameState) =>
  renderToStaticMarkup(createElement(CustomerScene, { game, onGame: () => {} }));
function serve(game: GameState, correct: boolean): GameState {
  const ready: GameState = { ...game, draft: {
    ...game.draft, base: 'classic-milk-tea', size: 'M', sugar: 25, ice: 50,
    topping: correct ? 'none' : 'black-pearl', fill: 80, shake: 60, sealed: true,
  } };
  const order = ready.currentOrder!;
  return deliverDrink(ready, true, PLACES[deliveryFor(order)], order.id);
}
afterEach(() => vi.unstubAllGlobals());

describe('NPC remembers repeated incorrect cups across days', () => {
  it('refuses another sample or empty promise after two bad deliveries, but permits a real sale', () => {
    const greeted = greetRememberedCustomer(returning([
      'Khách quen góp ý thêm', 'Khách quen góp ý thêm',
    ]));
    expect(hasRepeatedRememberedComplaint(greeted)).toBe(true);
    expect(canOfferRememberedSample(greeted)).toBe(false);
    expect(render(greeted)).toContain('hai ly sai liên tiếp');
    expect(render(greeted)).not.toContain('Mời khách thử trà mẫu · 3.000đ');
    const asked = askRememberedCustomerAboutComplaint(greeted);
    expect(canPromiseRememberedCorrection(asked)).toBe(false);
    expect(render(asked)).toContain('chưa muốn nghe lời hứa kiểm tra mới');
    const beforeCash = asked.cash;
    const corrected = serve(asked, true);
    expect(corrected.served).toBe(asked.served + 1);
    expect(corrected.cash).toBeGreaterThanOrEqual(beforeCash);
    expect(corrected.storyLog[0].title).toBe('Khách quen hài lòng');
    expect(corrected.storyLog[0].text).toContain('Hai lần trước ly đều sai');
    expect(corrected.relationshipRewardIds.filter(id =>
      id === 'remembered-service:repeat-day-five')).toHaveLength(1);

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(corrected);
    const reloaded = loadGame();
    const daySix = { ...reloaded, day: 6, phase: 'open' as const,
      city: { ...reloaded.city, day: 6 }, currentOrder: {
        ...reloaded.currentOrder!, id: 'repeat-day-six',
      } };
    expect(hasRepeatedRememberedComplaint(daySix)).toBe(false);
    expect(render(daySix)).not.toContain('hai ly sai liên tiếp');
  });

  it('a third incorrect cup keeps the consequence; one satisfied delivery breaks the streak', () => {
    const bad = greetRememberedCustomer(returning([
      'Khách quen góp ý thêm', 'Khách quen góp ý thêm',
    ]));
    const wrong = serve(bad, false);
    expect(wrong.storyLog[0].title).toBe('Khách quen góp ý thêm');
    expect(wrong.storyLog[0].text).toContain('hai ly sai liên tiếp');
    const later = { ...wrong, day: 6, phase: 'open' as const,
      city: { ...wrong.city, day: 6 },
      currentOrder: { ...wrong.currentOrder!, id: 'repeat-day-six' } };
    expect(hasRepeatedRememberedComplaint(later)).toBe(true);
    expect(canOfferRememberedSample(greetRememberedCustomer(later))).toBe(false);

    const recovered = returning([
      'Khách quen hài lòng', 'Khách quen góp ý thêm',
    ]);
    expect(hasRepeatedRememberedComplaint(recovered)).toBe(false);
    const single = greetRememberedCustomer(returning(['Khách quen góp ý thêm']));
    expect(canOfferRememberedSample(single)).toBe(true);
    expect(canPromiseRememberedCorrection(
      askRememberedCustomerAboutComplaint(single))).toBe(true);
  });
});
