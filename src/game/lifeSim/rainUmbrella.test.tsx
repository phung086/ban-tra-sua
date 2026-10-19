import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { walkCity } from '../city';
import { loadGame, saveGame } from '../storage';
import { wakeMorning } from './morning';
import { RainUmbrellaPanel } from '../../components/life/RainUmbrellaPanel';
import {
  canChooseUmbrella, chooseUmbrella, getUmbrellaCallback, getUmbrellaChoice,
  hasUmbrellaToday, walkCityWithUmbrella,
} from './rainUmbrella';
import type { GameState } from '../types';

function beforeRain(): GameState {
  const game = nextDay(nextDay(createInitialState()));
  expect(game.day).toBe(3);
  return { ...game, phase: 'summary', closingCareChoice: 'skip',
    summary: { day: 3, eventName: game.event.name, orders: 1,
      perfectOrders: 0, bestCombo: 0, revenue: 0, ingredientCost: 0,
      wasteCost: 0, profit: 0, averageScore: 80, fansGained: 0, researchGained: 0 },
    city: { ...game.city, minutes: 1100, energy: 50 } };
}

describe('borrowed umbrella and rainy-day walk', () => {
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

  it('shows a real summary choice before rainy day only', () => {
    const game = beforeRain();
    const html = renderToStaticMarkup(createElement(RainUmbrellaPanel, { game, onGame: () => undefined }));
    expect(html).toContain('Chuẩn bị ô cho ngày mưa');
    expect(html).toContain('Nhờ bác Minh cho mượn ô');
    expect(canChooseUmbrella(game, 'borrow')).toBe(true);
    expect(canChooseUmbrella(nextDay(game), 'borrow')).toBe(false);
  });

  it('charges once and persists through save/reload', () => {
    const before = beforeRain();
    const chosen = chooseUmbrella(before, 'borrow');
    expect(chosen.cash).toBe(before.cash);
    expect(chosen.city.minutes).toBe(1105);
    expect(chosen.city.energy).toBe(49);
    expect(chosen.city.goodwill).toBe(before.city.goodwill + 1);
    expect(chooseUmbrella(chosen, 'borrow')).toBe(chosen);
    expect(chooseUmbrella(chosen, 'message')).toBe(chosen);
    saveGame(chosen);
    const restored = loadGame();
    expect(getUmbrellaChoice(restored)).toBe('borrow');
    expect(restored.relationshipRewardIds.filter(id => id === 'rain-umbrella:3:borrow')).toHaveLength(1);
  });

  it('halves walking stamina only; time and visits remain identical', () => {
    const baseline = beforeRain();
    const borrowed = wakeMorning(nextDay(chooseUmbrella(baseline, 'borrow')));
    const noUmbrella = wakeMorning(nextDay(chooseUmbrella(baseline, 'message')));
    expect(hasUmbrellaToday(borrowed)).toBe(true);
    const position = { x: 0, z: 3.15 }, distance = 10;
    const regular = walkCity(noUmbrella, distance, position);
    const protectedWalk = walkCityWithUmbrella(borrowed, distance, position);
    expect(protectedWalk.city.energy).toBeCloseTo(borrowed.city.energy - 0.6);
    expect(regular.city.energy).toBeCloseTo(noUmbrella.city.energy - 1.2);
    expect(protectedWalk.city.minutes).toBeCloseTo(regular.city.minutes);
    expect(protectedWalk.city.visited).toEqual(regular.city.visited);
    expect(protectedWalk.city.life.today.places).toEqual(regular.city.life.today.places);
    expect(hasUmbrellaToday(nextDay(borrowed))).toBe(false);
  });

  it('shows Minh memory after waking, not while asleep', () => {
    const asleep = nextDay(chooseUmbrella(beforeRain(), 'borrow'));
    expect(getUmbrellaCallback(asleep)).toBeNull();
    const awake = wakeMorning(asleep);
    expect(getUmbrellaCallback(awake)).toContain('đỡ mệt hơn một nửa');
    saveGame(awake);
    expect(getUmbrellaCallback(loadGame())).toContain('đỡ mệt hơn một nửa');
    expect(getUmbrellaCallback(nextDay(awake))).toBeNull();
  });

  it('has a free fail-forward path when exhausted or out of time', () => {
    const game = beforeRain();
    const tired = { ...game, cash: 0, city: { ...game.city, minutes: 1260, energy: 0 } };
    expect(canChooseUmbrella(tired, 'borrow')).toBe(false);
    expect(canChooseUmbrella(tired, 'message')).toBe(true);
    expect(chooseUmbrella(tired, 'message').cash).toBe(0);
    const stale = { ...game, summary: { ...game.summary!, day: 2 } };
    const corrupt = { ...game, city: { ...game.city, minutes: Number.NaN } };
    expect(chooseUmbrella(stale, 'borrow')).toBe(stale);
    expect(chooseUmbrella(corrupt, 'message')).toBe(corrupt);
    expect(chooseUmbrella(game, 'unknown' as 'borrow')).toBe(game);
  });
});
