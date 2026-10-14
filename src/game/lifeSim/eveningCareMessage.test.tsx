import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { wakeMorning } from './morning';
import { canChooseEveningCare, chooseEveningCare, getEveningCareCallback, getEveningCareChoice, hasUnresolvedHaPromise } from './eveningCare';
import { EveningCarePanel } from '../../components/life/EveningCarePanel';
import type { GameState } from '../types';

function summary(game: GameState): GameState {
  return { ...game, phase: 'summary', summary: {
    day: game.day, eventName: game.event.name, orders: 1, perfectOrders: 0,
    bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0,
    profit: 0, averageScore: 80, fansGained: 0, researchGained: 0,
  } };
}

function missedPromise(): GameState {
  const helped = chooseEveningCare(summary(createInitialState()), 'help');
  const day3 = summary(nextDay(summary(nextDay(helped))));
  const postponed = chooseEveningCare(day3, 'postpone');
  const day4 = chooseEveningCare(summary(nextDay(postponed)), 'rest');
  return summary(nextDay(day4));
}

describe('Ha: late apology by message', () => {
  let saved: Map<string, string>;
  beforeEach(() => {
    saved = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('offers a zero-time apology after closing, with persistent next-morning response', () => {
    const day5 = missedPromise();
    const late = { ...day5, cash: 0, city: { ...day5.city, minutes: 1260, energy: 0 } };
    expect(canChooseEveningCare(late, 'apologize')).toBe(false);
    expect(canChooseEveningCare(day5, 'message')).toBe(false);
    expect(canChooseEveningCare({ ...day5, city: { ...day5.city, minutes: 1255 } }, 'message')).toBe(false);
    expect(canChooseEveningCare({ ...day5, city: { ...day5.city, minutes: 1256 } }, 'message')).toBe(true);
    expect(canChooseEveningCare(late, 'message')).toBe(true);
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: late, onGame: () => undefined,
    }));
    expect(html).toContain('Hà đang chờ một lời xin lỗi');
    expect(html).toContain('Nhắn xin lỗi Hà vì lỡ hẹn');
    const after = chooseEveningCare(late, 'message');
    expect(after.cash).toBe(0);
    expect(after.city.minutes).toBe(1260);
    expect(after.city.energy).toBe(0);
    expect(after.city.goodwill).toBe(late.city.goodwill);
    expect(after.storyLog.filter(item => item.id === 'evening-ha-5-message')).toHaveLength(1);
    saveGame(after);
    const reloaded = loadGame();
    expect(reloaded.relationshipRewardIds.filter(id => id === 'evening-ha-5-message')).toHaveLength(1);
    expect(chooseEveningCare(reloaded, 'message')).toBe(reloaded);
    expect(chooseEveningCare(reloaded, 'rest')).toBe(reloaded);
    expect(getEveningCareCallback(nextDay(reloaded))).toBeNull();
    const morning = wakeMorning(nextDay(reloaded));
    expect(getEveningCareCallback(morning)).toContain('Mình nhận được lời xin lỗi');
    saveGame(morning);
    expect(getEveningCareCallback(loadGame())).toContain('Mình nhận được lời xin lỗi');
  });

  it('lets a tired player rest without earning trust for an unaddressed missed promise', () => {
    const day5 = missedPromise();
    const rested = chooseEveningCare(day5, 'rest');
    expect(rested.city.energy).toBe(Math.min(100, day5.city.energy + 6));
    expect(rested.city.goodwill).toBe(day5.city.goodwill);
    expect(rested.storyLog[0].text).toContain('Hà vẫn chưa biết');
    expect(chooseEveningCare(rested, 'rest')).toBe(rested);
    expect(getEveningCareCallback(wakeMorning(nextDay(rested)))).toContain('mình đợi bạn');
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: day5, onGame: () => undefined,
    }));
    expect(html).toContain('+0 thiện cảm');
    const ordinary = summary(createInitialState());
    expect(chooseEveningCare(ordinary, 'rest').city.goodwill).toBe(ordinary.city.goodwill + 1);
  });

  it('does not call a paid dinner on the rescheduled day a missed promise', () => {
    const helped = chooseEveningCare(summary(createInitialState()), 'help');
    const day3 = summary(nextDay(summary(nextDay(helped))));
    const day4 = summary(nextDay(chooseEveningCare(day3, 'postpone')));
    const dinner = chooseEveningCare(day4, 'dinner');
    expect(canChooseEveningCare(summary(nextDay(dinner)), 'message')).toBe(false);
    expect(canChooseEveningCare(summary(nextDay(dinner)), 'apologize')).toBe(false);
  });

  it('offers one day-six reconciliation after a real apology and remembers it after reload', () => {
    const missed = missedPromise();
    const day5 = { ...missed, city: { ...missed.city, minutes: 1260, energy: 0 } };
    const message = chooseEveningCare(day5, 'message');
    const day6 = summary(nextDay(message));
    expect(canChooseEveningCare(day6, 'reconcile')).toBe(true);
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: day6, onGame: () => undefined,
    }));
    expect(html).toContain('Ghé Hà sau lời xin lỗi');
    const before = { ...day6, city: { ...day6.city, minutes: 1245, energy: 2 } };
    const after = chooseEveningCare(before, 'reconcile');
    expect(after.cash).toBe(before.cash);
    expect(after.city.minutes).toBe(1255);
    expect(after.city.energy).toBe(0);
    expect(after.city.goodwill).toBe(before.city.goodwill + 1);
    saveGame(after);
    const reloaded = loadGame();
    expect(getEveningCareChoice(reloaded)).toBe('reconcile');
    expect(chooseEveningCare(reloaded, 'reconcile')).toBe(reloaded);
    expect(reloaded.relationshipRewardIds.filter(id => id === 'evening-ha-6-reconcile')).toHaveLength(1);
    expect(getEveningCareCallback(wakeMorning(nextDay(reloaded)))).toContain('gặp lại vui ghê');
  });

  it('keeps rest available but blocks reconciliation when too tired, too late or not apologetic', () => {
    const day5 = missedPromise();
    const message = chooseEveningCare({ ...day5, city: { ...day5.city, minutes: 1260 } }, 'message');
    const day6 = summary(nextDay(message));
    const exhausted = { ...day6, city: { ...day6.city, energy: 1 } };
    const late = { ...day6, city: { ...day6.city, minutes: 1251 } };
    expect(canChooseEveningCare(exhausted, 'reconcile')).toBe(false);
    expect(canChooseEveningCare(late, 'reconcile')).toBe(false);
    expect(canChooseEveningCare(exhausted, 'rest')).toBe(true);
    const disabledHtml = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: exhausted, onGame: () => undefined,
    }));
    expect(disabledHtml).toContain('Ghé Hà sau lời xin lỗi');
    expect(disabledHtml).toContain('không đủ thời gian hoặc sức');
    expect(disabledHtml).toMatch(/disabled[^>]*>\s*<strong>🌿 Ghé Hà sau lời xin lỗi/);
    const withoutApology = summary(nextDay(chooseEveningCare(day5, 'rest')));
    expect(canChooseEveningCare(withoutApology, 'reconcile')).toBe(false);
    expect(canChooseEveningCare(summary(nextDay(day6)), 'reconcile')).toBe(false);
  });

  it('allows a one-time late repair on day six after resting through the apology', () => {
    const day5 = chooseEveningCare(missedPromise(), 'rest');
    const day6 = summary(nextDay(day5));
    expect(hasUnresolvedHaPromise(day6)).toBe(true);
    expect(canChooseEveningCare(day6, 'repair')).toBe(true);
    const panel = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: day6, onGame: () => undefined,
    }));
    expect(panel).toContain('Ghé Hà xin lỗi muộn');
    const before = { ...day6, cash: 0, city: { ...day6.city, minutes: 1230, energy: 2 } };
    const after = chooseEveningCare(before, 'repair');
    expect(after.cash).toBe(0);
    expect(after.city.minutes).toBe(1245);
    expect(after.city.energy).toBe(0);
    expect(after.city.goodwill).toBe(before.city.goodwill);
    saveGame(after);
    const loaded = loadGame();
    expect(getEveningCareChoice(loaded)).toBe('repair');
    expect(chooseEveningCare(loaded, 'repair')).toBe(loaded);
    expect(loaded.relationshipRewardIds.filter(id => id === 'evening-ha-6-repair')).toHaveLength(1);
    expect(getEveningCareCallback(wakeMorning(nextDay(loaded)))).toContain('vui vì hôm qua');
    expect(canChooseEveningCare(summary(nextDay(loaded)), 'repair')).toBe(false);
  });

  it('preserves the free rest route when late repair is unaffordable in time or energy', () => {
    const day5 = chooseEveningCare(missedPromise(), 'rest');
    const day6 = summary(nextDay(day5));
    const tired = { ...day6, city: { ...day6.city, energy: 1 } };
    const late = { ...day6, city: { ...day6.city, minutes: 1246 } };
    expect(canChooseEveningCare(tired, 'repair')).toBe(false);
    expect(canChooseEveningCare(late, 'repair')).toBe(false);
    expect(canChooseEveningCare(tired, 'rest')).toBe(true);
    expect(renderToStaticMarkup(createElement(EveningCarePanel, {
      game: tired, onGame: () => undefined,
    }))).toContain('Hà sẽ không ép bạn');
    const day5Apology = chooseEveningCare(missedPromise(), 'apologize');
    expect(canChooseEveningCare(summary(nextDay(day5Apology)), 'repair')).toBe(false);
  });

  it('does not offer a false apology without a missed promise or after the window', () => {
    const day1 = summary(createInitialState());
    expect(canChooseEveningCare(day1, 'message')).toBe(false);
    expect(renderToStaticMarkup(createElement(EveningCarePanel, {
      game: day1, onGame: () => undefined,
    }))).not.toContain('Nhắn xin lỗi Hà vì lỡ hẹn');
    const day6 = summary(nextDay(missedPromise()));
    expect(canChooseEveningCare(day6, 'message')).toBe(false);
  });
});
