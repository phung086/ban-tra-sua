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
  greetRememberedCustomer, keepRememberedPreferencePrivate, hasRepeatedRememberedComplaint, getRememberedTrustStage,
  getRememberedSilentDelivery, getRememberedClarificationSource, getUnresolvedRememberedComplaint,
  getPreviousRememberedServiceFeedback,
  canApologizeForQuietDelivery, apologizeForQuietDelivery, hasApologizedForQuietDelivery,
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
    const initial = returning([
      'Khách quen góp ý thêm', 'Khách quen góp ý thêm',
    ]);
    expect(render(initial)).toContain('Chào khách quen · 2 phút · 1 năng lượng · chưa tăng thân thiết');
    const greeted = greetRememberedCustomer(initial);
    expect(hasRepeatedRememberedComplaint(greeted)).toBe(true);
    expect(greeted.customerBond).toEqual(initial.customerBond);
    expect(greeted.city.goodwill).toBe(initial.city.goodwill);
    expect(greeted.city.minutes).toBe(initial.city.minutes + 2);
    expect(greeted.city.energy).toBe(initial.city.energy - 1);
    expect(greetRememberedCustomer(greeted)).toBe(greeted);
    expect(render(greeted)).toContain('Cần giao đúng để lấy lại lòng tin');
    expect(render(greeted)).toContain('Hỏi kỹ lỗi lần trước · 3 phút · 1 năng lượng · chưa tăng thân thiết');
    expect(canOfferRememberedSample(greeted)).toBe(false);
    expect(render(greeted)).toContain('hai ly sai liên tiếp');
    expect(render(greeted)).toContain('Khách còn dè chừng');
    expect(render(greeted)).toContain('Mình vẫn nhớ hai ly trước đều sai');
    expect(render(greeted)).toContain('data-trust="guarded"');
    expect(render(greeted)).not.toContain('Mời khách thử trà mẫu · 3.000đ');
    const asked = askRememberedCustomerAboutComplaint(greeted);
    expect(asked.customerBond).toEqual(initial.customerBond);
    expect(asked.city.goodwill).toBe(initial.city.goodwill);
    expect(asked.city.minutes).toBe(greeted.city.minutes + 3);
    expect(asked.city.energy).toBe(greeted.city.energy - 1);
    expect(askRememberedCustomerAboutComplaint(asked)).toBe(asked);
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
    saveGame(asked);
    const guardedReload = loadGame();
    expect(guardedReload.customerBond).toEqual(initial.customerBond);
    expect(guardedReload.city.goodwill).toBe(initial.city.goodwill);
    expect(guardedReload.relationshipRewardIds).toContain('remembered-greeting:repeat-day-five');
    expect(guardedReload.relationshipRewardIds).toContain('remembered-clarify:repeat-day-five');
    saveGame(corrected);
    const reloaded = loadGame();
    const daySix = { ...reloaded, day: 6, phase: 'open' as const,
      city: { ...reloaded.city, day: 6 }, currentOrder: {
        ...returning([]).currentOrder!, id: 'repeat-day-six',
      } };
    expect(hasRepeatedRememberedComplaint(daySix)).toBe(false);
    expect(getRememberedTrustStage(daySix)).toBe('recovering');
    expect(render(daySix)).not.toContain('hai ly sai liên tiếp');
    expect(render(daySix)).toContain('Khách ghi nhận ly đúng đầu tiên');
    expect(render(daySix)).toContain('data-trust="recovering"');
    const nextGreeting = greetRememberedCustomer(daySix);
    expect(nextGreeting.customerBond.miu).toBe(daySix.customerBond.miu ?? 0);
    expect(nextGreeting.city.goodwill).toBe(daySix.city.goodwill);
    expect(nextGreeting.city.minutes).toBe(daySix.city.minutes + 2);
    expect(greetRememberedCustomer(nextGreeting)).toBe(nextGreeting);
    const secondCorrect = serve(nextGreeting, true);
    expect(secondCorrect.storyLog[0].text).toContain('Ly thứ hai đúng rồi');
    saveGame(secondCorrect);
    const secondReload = loadGame();
    const daySeven = { ...secondReload, day: 7, phase: 'open' as const,
      city: { ...secondReload.city, day: 7 }, currentOrder: {
        ...returning([]).currentOrder!, id: 'repeat-day-seven',
      } };
    expect(getRememberedTrustStage(daySeven)).toBe('open');
    expect(render(daySeven)).toContain('data-trust="reassured"');
    const openGreeting = greetRememberedCustomer(daySeven);
    expect(openGreeting.customerBond.miu).toBe((daySeven.customerBond.miu ?? 0) + 1);
    expect(openGreeting.city.goodwill).toBe(daySeven.city.goodwill + 1);
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
      currentOrder: { ...returning([]).currentOrder!, id: 'repeat-day-six' } };
    expect(hasRepeatedRememberedComplaint(later)).toBe(true);
    expect(canOfferRememberedSample(greetRememberedCustomer(later))).toBe(false);

    // One bad cup followed by a good cup never enters the guarded state.
    const singleComplaint = returning([
      'Khách quen hài lòng', 'Khách quen góp ý thêm',
    ]);
    expect(getRememberedTrustStage(singleComplaint)).toBe('open');
    // Two bad cups followed by one good cup remain in recovery.
    const recovered = returning([
      'Khách quen hài lòng', 'Khách quen góp ý thêm', 'Khách quen góp ý thêm',
    ]);
    expect(hasRepeatedRememberedComplaint(recovered)).toBe(false);
    expect(getRememberedTrustStage(recovered)).toBe('recovering');
    const setback = returning([
      'Khách quen góp ý thêm', 'Khách quen hài lòng',
      'Khách quen góp ý thêm', 'Khách quen góp ý thêm',
    ]);
    expect(getRememberedTrustStage(setback)).toBe('guarded');
    const fullyRepaired = returning([
      'Khách quen hài lòng', 'Khách quen hài lòng',
      'Khách quen góp ý thêm', 'Khách quen góp ý thêm',
    ]);
    expect(getRememberedTrustStage(fullyRepaired)).toBe('open');
    const reordered = { ...fullyRepaired, storyLog: [...fullyRepaired.storyLog].reverse() };
    expect(getRememberedTrustStage(reordered)).toBe('open');
    const single = greetRememberedCustomer(returning(['Khách quen góp ý thêm']));
    expect(canOfferRememberedSample(single)).toBe(true);
    expect(canPromiseRememberedCorrection(
      askRememberedCustomerAboutComplaint(single))).toBe(true);
  });
  it('remembers delivered cups without optional greeting and keeps quiet choice private', () => {
    const initial = returning([]);
    expect(render(initial)).toContain('Chào khách quen');
    const silentBad = serve(initial, false);
    expect(silentBad.relationshipRewardIds).not.toContain('remembered-service:repeat-day-five');
    expect(silentBad.relationshipRewardIds).toContain('remembered-outcome:miu:repeat-day-five:5:bad');
    expect(silentBad.relationshipRewardIds).not.toContain('remembered-greeting:repeat-day-five');
    expect(silentBad.storyLog).toEqual(initial.storyLog); // No unsolicited callback.

    const nextVisit: GameState = {
      ...silentBad, day: 6, phase: 'open',
      city: { ...silentBad.city, day: 6, minutes: 850, energy: 50 },
      currentOrder: { ...initial.currentOrder!, id: 'silent-day-six' },
    };
    const quiet = keepRememberedPreferencePrivate(nextVisit);
    expect(quiet.relationshipRewardIds).toContain('remembered-quiet:silent-day-six');
    expect(quiet.customerBond).toEqual(nextVisit.customerBond);
    const secondBad = serve(quiet, false);
    expect(secondBad.relationshipRewardIds).toContain('remembered-outcome:miu:silent-day-six:6:bad');

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(secondBad);
    const restored = loadGame();
    const daySeven: GameState = {
      ...restored, day: 7, phase: 'open',
      city: { ...restored.city, day: 7 },
      storyLog: [],
      currentOrder: { ...initial.currentOrder!, id: 'silent-day-seven' },
    };
    expect(getRememberedTrustStage(daySeven)).toBe('guarded');
    expect(render(daySeven)).toContain('data-trust="guarded"');
    expect(render(daySeven)).toContain('hai lần giao sai');
    expect(daySeven.relationshipRewardIds.filter(id =>
      id === 'remembered-outcome:miu:silent-day-six:6:bad')).toHaveLength(1);
  });

  it('keeps NPC distrust and partial repair after old story entries are pruned', () => {
    const first = serve(greetRememberedCustomer(returning([])), false);
    expect(first.relationshipRewardIds).toContain('remembered-outcome:miu:repeat-day-five:5:bad');
    const visit = (previous: GameState, day: number, id: string): GameState => ({
      ...previous, day, phase: 'open', city: { ...previous.city, day, minutes: 850, energy: 50 },
      currentOrder: { ...returning([]).currentOrder!, id },
    });
    const second = serve(greetRememberedCustomer(visit(first, 6, 'long-memory-day6')), false);
    expect(second.relationshipRewardIds).toContain('remembered-outcome:miu:long-memory-day6:6:bad');

    // The 24 visible journal entries may all belong to unrelated neighbors.
    const pruned: GameState = { ...second, storyLog: [] };
    const daySeven = visit(pruned, 7, 'long-memory-day7');
    expect(getRememberedTrustStage(daySeven)).toBe('guarded');
    expect(render(daySeven)).toContain('data-trust="guarded"');

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(daySeven);
    const reloaded = loadGame();
    expect(getRememberedTrustStage(reloaded)).toBe('guarded');
    const firstCorrect = serve(greetRememberedCustomer(reloaded), true);
    expect(firstCorrect.relationshipRewardIds).toContain('remembered-outcome:miu:long-memory-day7:7:good');
    saveGame(firstCorrect);
    const dayEight = visit(loadGame(), 8, 'long-memory-day8');
    expect(getRememberedTrustStage(dayEight)).toBe('recovering');
    expect(render(dayEight)).toContain('data-trust="recovering"');
    const secondCorrect = serve(greetRememberedCustomer(dayEight), true);
    saveGame(secondCorrect);
    const dayNine = visit(loadGame(), 9, 'long-memory-day9');
    expect(getRememberedTrustStage(dayNine)).toBe('open');
    expect(render(dayNine)).toContain('data-trust="open"');
  });

  it('recalls a silent cup on return without reopening an older complaint', () => {
    const silentGood = serve(returning(['Khách quen góp ý thêm']), true);
    expect(silentGood.storyLog[0].day).toBe(4);
    const revisit = (saved: GameState): GameState => ({
      ...saved, day: 6, phase: 'open',
      city: { ...saved.city, day: 6, minutes: 850, energy: 50 },
      currentOrder: { ...returning([]).currentOrder!, id: 'quiet-return-day6' },
    });
    const goodReturn = revisit(silentGood);
    expect(getRememberedSilentDelivery(goodReturn)).toEqual({ day: 5, correct: true });
    expect(getRememberedClarificationSource(goodReturn)).toBeNull();
    expect(getUnresolvedRememberedComplaint(goodReturn)).toBeNull();
    expect(render(goodReturn)).toContain('Ly đã đúng đơn');
    expect(render(goodReturn)).not.toContain('Lần giao trước (ngày 4)');

    const badReturn = revisit(serve(returning([]), false));
    expect(getRememberedSilentDelivery(badReturn)).toEqual({ day: 5, correct: false });
    expect(render(badReturn)).toContain('Ly chưa đúng đơn');
    expect(getRememberedClarificationSource(badReturn)?.text).toContain('Ly lần trước chưa đúng đơn');
    const asked = askRememberedCustomerAboutComplaint(greetRememberedCustomer(badReturn));
    expect(asked.storyLog[0].text).toContain('Ly lần trước chưa đúng đơn');

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(goodReturn);
    const reloaded = loadGame();
    expect(getRememberedSilentDelivery(reloaded)).toEqual({ day: 5, correct: true });
    expect(render(reloaded)).toContain('Ly đã đúng đơn');
    expect(getRememberedClarificationSource(reloaded)).toBeNull();
  });

  it('allows a direct apology without paid greeting, even with one energy, and saves the result', () => {
    const first = serve(returning([]), false);
    const revisit: GameState = {
      ...first, day: 6, phase: 'open',
      city: { ...first.city, day: 6, minutes: 850, energy: 1 },
      currentOrder: { ...returning([]).currentOrder!, id: 'direct-apology-day6' },
    };
    expect(canApologizeForQuietDelivery(revisit)).toBe(true);
    expect(render(revisit)).toContain('Xin lỗi vì ly giao sai · 2 phút · 1 năng lượng');
    const apologized = apologizeForQuietDelivery(revisit);
    expect(apologized.city.minutes).toBe(852);
    expect(apologized.city.energy).toBe(0);
    expect(apologized.customerBond).toEqual(revisit.customerBond);
    expect(apologized.city.goodwill).toBe(revisit.city.goodwill);
    expect(apologized.relationshipRewardIds).not.toContain('remembered-greeting:direct-apology-day6');
    expect(apologizeForQuietDelivery(apologized)).toBe(apologized);

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(apologized);
    const restored = loadGame();
    expect(hasApologizedForQuietDelivery(restored)).toBe(true);
    expect(canApologizeForQuietDelivery(restored)).toBe(false);
    expect(render(restored)).toContain('✓ Đã nhận lỗi.');
    const corrected = serve(restored, true);
    expect(corrected.storyLog[0].text).toContain('Khách ghi nhận lời xin lỗi và ly trà được sửa đúng đơn.');
    expect(corrected.relationshipRewardIds.filter(id =>
      id === 'remembered-quiet-apology:direct-apology-day6')).toHaveLength(1);

    const privateChoice = keepRememberedPreferencePrivate(revisit);
    expect(canApologizeForQuietDelivery(privateChoice)).toBe(false);
    expect(render(privateChoice)).not.toContain('Xin lỗi vì ly giao sai ·');
    expect(canApologizeForQuietDelivery({
      ...revisit, draft: { ...revisit.draft, sealed: true },
    })).toBe(false);
    expect(canApologizeForQuietDelivery({
      ...revisit, city: { ...revisit.city, minutes: 1259 },
    })).toBe(false);
  });

  it('lets the player apologize for a silent wrong cup, without instant trust or duplicate cost', () => {
    const first = serve(returning([]), false);
    const revisit: GameState = {
      ...first, day: 6, phase: 'open',
      city: { ...first.city, day: 6, minutes: 850, energy: 50 },
      currentOrder: { ...returning([]).currentOrder!, id: 'quiet-apology-day6' },
    };
    expect(canApologizeForQuietDelivery(revisit)).toBe(true); // Greeting is optional.
    const greeted = greetRememberedCustomer(revisit);
    expect(render(greeted)).toContain('Xin lỗi vì ly giao sai · 2 phút · 1 năng lượng');
    expect(canApologizeForQuietDelivery(greeted)).toBe(true);
    const apologized = apologizeForQuietDelivery(greeted);
    expect(hasApologizedForQuietDelivery(apologized)).toBe(true);
    expect(apologized.city.minutes).toBe(greeted.city.minutes + 2);
    expect(apologized.city.energy).toBe(greeted.city.energy - 1);
    expect(apologized.customerBond).toEqual(greeted.customerBond);
    expect(apologized.city.goodwill).toBe(greeted.city.goodwill);
    expect(apologizeForQuietDelivery(apologized)).toBe(apologized);
    expect(render(apologized)).toContain('✓ Đã nhận lỗi.');

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(apologized);
    const restored = loadGame();
    expect(hasApologizedForQuietDelivery(restored)).toBe(true);
    expect(canApologizeForQuietDelivery(restored)).toBe(false);
    const corrected = serve(restored, true);
    expect(corrected.storyLog[0].text).toContain('Khách ghi nhận lời xin lỗi và ly trà được sửa đúng đơn.');
    expect(corrected.relationshipRewardIds).toContain('remembered-outcome:miu:quiet-apology-day6:6:good');
    expect(corrected.relationshipRewardIds.filter(id =>
      id === 'remembered-quiet-apology:quiet-apology-day6')).toHaveLength(1);
    const nextVisit = {
      ...corrected, day: 7, phase: 'open' as const,
      city: { ...corrected.city, day: 7 },
      currentOrder: { ...revisit.currentOrder!, id: 'quiet-apology-day7' },
    };
    expect(canApologizeForQuietDelivery(nextVisit)).toBe(false);
  });

  it('remembers earlier deliveries on the same day and preserves distrust after reload', () => {
    const first = serve(returning([]), false);
    const revisit = (previous: GameState, id: string): GameState => ({
      ...previous, day: 5, phase: 'open',
      city: { ...previous.city, day: 5, minutes: 850, energy: 50 },
      currentOrder: { ...returning([]).currentOrder!, id },
    });
    const secondVisit = revisit(first, 'same-day-second');
    expect(getRememberedSilentDelivery(secondVisit)).toEqual({ day: 5, correct: false });
    expect(getRememberedClarificationSource(secondVisit)?.text).toContain('Ly lần trước chưa đúng đơn');
    expect(render(secondVisit)).toContain('Lần giao trước (ngày 5)');

    const second = serve(secondVisit, false);
    const thirdVisit = revisit(second, 'same-day-third');
    expect(getRememberedTrustStage(thirdVisit)).toBe('guarded');
    expect(render(thirdVisit)).toContain('data-trust="guarded"');
    const guardedGreeting = greetRememberedCustomer(thirdVisit);
    expect(guardedGreeting.customerBond).toEqual(thirdVisit.customerBond);
    expect(guardedGreeting.city.goodwill).toBe(thirdVisit.city.goodwill);

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
    saveGame(thirdVisit);
    expect(getRememberedTrustStage(loadGame())).toBe('guarded');
    expect(getRememberedSilentDelivery(loadGame())).toEqual({ day: 5, correct: false });

    const spoken = serve(greetRememberedCustomer(returning([])), false);
    const spokenReturn = revisit(spoken, 'same-day-spoken-return');
    expect(getPreviousRememberedServiceFeedback(spokenReturn)?.title).toBe('Khách quen góp ý thêm');
  });

});
