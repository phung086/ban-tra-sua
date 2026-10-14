import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { wakeMorning } from './morning';
import { chooseEveningCare } from './eveningCare';
import {
  canChooseHaPackaging, chooseHaPackaging, getHaPackagingCallback,
  getHaPackagingChoice, isHaPackagingDue,
} from './haPackaging';
import { EveningCarePanel } from '../../components/life/EveningCarePanel';
import type { GameState } from '../types';

function summary(game: GameState): GameState {
  return { ...game, phase: 'summary', summary: {
    day: game.day, eventName: game.event.name, orders: 1, perfectOrders: 0,
    bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0,
    profit: 0, averageScore: 80, fansGained: 0, researchGained: 0,
  } };
}

function daySeven(repair = false): GameState {
  const helped = chooseEveningCare(summary(createInitialState()), 'help');
  const postponed = chooseEveningCare(summary(nextDay(nextDay(helped))), 'postpone');
  const day4 = chooseEveningCare(summary(nextDay(postponed)), 'rest');
  const day5 = chooseEveningCare(summary(nextDay(day4)), repair ? 'rest' : 'apologize');
  const day6 = chooseEveningCare(summary(nextDay(day5)), repair ? 'repair' : 'reconcile');
  expect(day6.relationshipRewardIds).toContain(repair ? 'evening-ha-6-repair' : 'evening-ha-6-reconcile');
  return summary(nextDay(day6));
}

describe('Ha day-seven packaging and day-eight memory', () => {
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

  it('unlocks only after a real day-six reconciliation, through the actual evening UI', () => {
    const day7 = daySeven();
    expect(isHaPackagingDue(day7)).toBe(true);
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: day7, onGame: () => undefined,
    }));
    expect(html).toContain('Hà chuẩn bị cơm mang đi');
    expect(html).toContain('Mua giúp Hà hộp giấy');
    expect(html).toContain('Phụ Hà gấp hộp cơm');
    expect(html).toContain('12.000');
    const noRepair = { ...day7, relationshipRewardIds:
      day7.relationshipRewardIds.filter(id => id !== 'evening-ha-6-reconcile'),
      storyLog: day7.storyLog.filter(item => item.id !== 'evening-ha-6-reconcile') };
    expect(isHaPackagingDue(noRepair)).toBe(false);
    expect(canChooseHaPackaging(noRepair, 'buy')).toBe(false);
  });

  it('charges once for buying boxes, saves the decision and replies after waking on day eight', () => {
    const before = daySeven();
    const bought = chooseHaPackaging(before, 'buy');
    expect(bought.cash).toBe(before.cash - 12000);
    expect(bought.city.minutes).toBe(before.city.minutes + 10);
    expect(bought.city.energy).toBe(before.city.energy - 1);
    expect(bought.city.goodwill).toBe(before.city.goodwill + 2);
    expect(chooseHaPackaging(bought, 'buy')).toBe(bought);
    expect(chooseHaPackaging(bought, 'fold')).toBe(bought);
    saveGame(bought);
    const restored = loadGame();
    expect(getHaPackagingChoice(restored)).toBe('buy');
    expect(restored.relationshipRewardIds.filter(id => id === 'ha-packaging-7-buy')).toHaveLength(1);
    const asleep = nextDay(restored);
    expect(getHaPackagingCallback(asleep)).toBeNull();
    const awake = wakeMorning(asleep);
    expect(getHaPackagingCallback(awake)).toContain('vừa đủ cho mẻ cơm');
    expect(renderToStaticMarkup(createElement(EveningCarePanel, {
      game: awake, onGame: () => undefined,
    }))).toContain('Lời nhắn từ Hà');
    saveGame(awake);
    expect(getHaPackagingCallback(loadGame())).toContain('vừa đủ cho mẻ cơm');
    expect(getHaPackagingCallback(nextDay(awake))).toBeNull();
  });

  it('offers a zero-cash physical help route after a late repair', () => {
    const before = { ...daySeven(true), cash: 0, city: { ...daySeven(true).city, energy: 3 } };
    expect(canChooseHaPackaging(before, 'buy')).toBe(false);
    expect(canChooseHaPackaging(before, 'fold')).toBe(true);
    const after = chooseHaPackaging(before, 'fold');
    expect(after.cash).toBe(0);
    expect(after.city.energy).toBe(0);
    expect(after.city.goodwill).toBe(before.city.goodwill + 2);
    expect(getHaPackagingCallback(wakeMorning(nextDay(after)))).toContain('gấp hộp nhanh');
  });

  it('never softlocks a broke, exhausted player at closing time', () => {
    const day7 = daySeven();
    const late = { ...day7, cash: 0, city: { ...day7.city, minutes: 1260, energy: 0 } };
    expect(canChooseHaPackaging(late, 'buy')).toBe(false);
    expect(canChooseHaPackaging(late, 'fold')).toBe(false);
    expect(canChooseHaPackaging(late, 'rest')).toBe(true);
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: late, onGame: () => undefined,
    }));
    expect(html).toContain('Báo Hà rồi về nghỉ');
    expect(html).toContain('disabled');
    const rested = chooseHaPackaging(late, 'rest');
    expect(rested.cash).toBe(0);
    expect(rested.city.minutes).toBe(1260);
    expect(rested.city.energy).toBe(4);
    expect(rested.city.goodwill).toBe(late.city.goodwill);
    expect(getHaPackagingCallback(wakeMorning(nextDay(rested)))).toContain('tự lo được');
  });

  it('rejects invalid state, stale summary and repeated actions', () => {
    const day7 = daySeven();
    const stale = { ...day7, summary: { ...day7.summary!, day: 6 } };
    const malformed = { ...day7, city: { ...day7.city, minutes: Number.NaN } };
    const insufficient = { ...day7, cash: 0 };
    expect(chooseHaPackaging(stale, 'fold')).toBe(stale);
    expect(chooseHaPackaging(malformed, 'rest')).toBe(malformed);
    expect(chooseHaPackaging(insufficient, 'buy')).toBe(insufficient);
    expect(chooseHaPackaging(day7, 'unknown' as 'rest')).toBe(day7);
    expect(canChooseHaPackaging(nextDay(day7), 'rest')).toBe(false);
  });
});
