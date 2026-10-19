import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { chooseBreakfast, motherCallMemory, wakeMorning } from './morning';
import { EveningCarePanel } from '../../components/life/EveningCarePanel';
import {
  canChooseEveningMother, chooseEveningMother, getEveningMotherCallback,
  getEveningMotherChoice,
} from './eveningMother';

function finishedShift() {
  const game = createInitialState();
  return {
    ...game, phase: 'summary' as const,
    summary: {
      day: game.day, eventName: game.event.name, orders: 1,
      perfectOrders: 0, bestCombo: 0, revenue: 0,
      ingredientCost: 0, wasteCost: 0, profit: 0,
      averageScore: 80, fansGained: 0, researchGained: 0,
    },
  };
}

describe('after-shift check-in with mother Mai', () => {
  const storage = new Map<string, string>();
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders playable choices in the existing end-of-shift UI', () => {
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: finishedShift(), onGame: () => undefined,
    }));
    expect(html).toContain('Gọi mẹ Mai sau ca');
    expect(html).toContain('Gọi mẹ kể chuyện bán trà');
    expect(html).toContain('Nhắn mẹ đã về an toàn');
    expect(html).toContain('Cất điện thoại và nghỉ');
  });

  it('calls once, consumes time/energy, and saves a bond memory without spending money', () => {
    const game = finishedShift();
    const after = chooseEveningMother(game, 'call');
    expect(after.cash).toBe(game.cash);
    expect(after.city.minutes).toBe(game.city.minutes + 8);
    expect(after.city.energy).toBe(game.city.energy - 1);
    expect(motherCallMemory(after).bond).toBe(motherCallMemory(game).bond + 2);
    expect(getEveningMotherChoice(after)).toBe('call');
    expect(chooseEveningMother(after, 'call')).toBe(after);
    expect(chooseEveningMother(after, 'text')).toBe(after);
    saveGame(after);
    const reloaded = loadGame();
    expect(getEveningMotherChoice(reloaded)).toBe('call');
    expect(motherCallMemory(reloaded).bond).toBe(motherCallMemory(after).bond);
    expect(reloaded.relationshipRewardIds.filter(id => id === 'evening-mother-mai-1-call')).toHaveLength(1);
    expect(renderToStaticMarkup(createElement(EveningCarePanel, {
      game: reloaded, onGame: () => undefined,
    }))).toContain('Đã chọn');
  });

  it('wakes with the matching next-day reply and keeps it across reload', () => {
    const chosen = chooseEveningMother(finishedShift(), 'text');
    saveGame(chosen);
    const asleep = nextDay(loadGame());
    expect(getEveningMotherCallback(asleep)).toBeNull();
    const awake = wakeMorning(asleep);
    expect(getEveningMotherCallback(awake)).toContain('đã đọc tin nhắn');
    expect(renderToStaticMarkup(createElement(EveningCarePanel, {
      game: awake, onGame: () => undefined,
    }))).toContain('Tin nhắn của mẹ Mai sáng hôm sau');
    const breakfast = chooseBreakfast(awake, 'skip');
    saveGame(breakfast);
    expect(getEveningMotherCallback(loadGame())).toContain('đã đọc tin nhắn');
    expect(getEveningMotherCallback(nextDay(breakfast))).toBeNull();
  });

  it('offers a free no-energy fallback at the time limit and does not block sleep', () => {
    const game = finishedShift();
    const late = { ...game, cash: 0, city: { ...game.city, minutes: 1260, energy: 0 } };
    expect(canChooseEveningMother(late, 'call')).toBe(false);
    expect(canChooseEveningMother(late, 'text')).toBe(false);
    expect(canChooseEveningMother(late, 'rest')).toBe(true);
    const rested = chooseEveningMother(late, 'rest');
    expect(rested.cash).toBe(0);
    expect(rested.city.minutes).toBe(1260);
    expect(rested.city.energy).toBe(0);
    expect(getEveningMotherCallback(wakeMorning(nextDay(rested)))).toBeNull();
  });

  it('rejects stale, invalid or non-summary actions without mutating the save', () => {
    const game = finishedShift();
    const stale = { ...game, summary: { ...game.summary, day: game.day - 1 } };
    const bad = { ...game, city: { ...game.city, minutes: Number.NaN } };
    const prep = { ...game, phase: 'prep' as const };
    expect(chooseEveningMother(stale, 'call')).toBe(stale);
    expect(chooseEveningMother(bad, 'rest')).toBe(bad);
    expect(chooseEveningMother(prep, 'text')).toBe(prep);
    expect(chooseEveningMother(game, 'unknown' as 'call')).toBe(game);
  });

  it('reacts to skipped breakfast without overwriting the morning call', () => {
    const game = finishedShift();
    const skipped = { ...game, morning: { ...game.morning, breakfast: 'skip' as const } };
    const after = chooseEveningMother(skipped, 'call');
    expect(after.notice).toContain('nhớ ăn uống');
    expect(after.city.stories.choices).toContain('family-mother-mai:evening:1:listen');
    expect(after.morning.motherCall).toBe(skipped.morning.motherCall);
  });
});
