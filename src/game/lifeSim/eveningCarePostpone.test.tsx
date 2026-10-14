import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import type { GameState } from '../types';
import { EveningCarePanel } from '../../components/life/EveningCarePanel';
import { wakeMorning } from './morning';
import { canChooseEveningCare, chooseEveningCare, getEveningCareCallback, getEveningCareChoice } from './eveningCare';

function finished(game: GameState): GameState {
  return { ...game, phase: 'summary', summary: {
    day: game.day, eventName: game.event.name, orders: 1, perfectOrders: 0,
    bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0,
    profit: 0, averageScore: 80, fansGained: 0, researchGained: 0,
  } };
}

afterEach(() => vi.unstubAllGlobals());

describe('Ha invitation rescheduling', () => {
  it('offers a single explicit postponement, then a saved free meal on day four', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    });
    const helped = chooseEveningCare(finished(createInitialState()), 'help');
    const day3 = finished(nextDay(finished(nextDay(helped))));
    expect(day3.day).toBe(3);
    expect(canChooseEveningCare(day3, 'postpone')).toBe(true);
    const invite = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: day3, onGame: () => undefined,
    }));
    expect(invite).toContain('Hẹn Hà ngày mai');

    const postponed = chooseEveningCare(day3, 'postpone');
    expect(postponed.cash).toBe(day3.cash);
    expect(postponed.city.minutes).toBe(day3.city.minutes);
    expect(postponed.city.energy).toBe(day3.city.energy);
    expect(chooseEveningCare(postponed, 'postpone')).toBe(postponed);
    saveGame(postponed);
    const restored = loadGame();
    expect(getEveningCareChoice(restored)).toBe('postpone');

    const day4 = finished(nextDay(restored));
    expect(getEveningCareCallback(wakeMorning({ ...day4, phase: 'prep' }))).toContain('giữ phần cơm');
    expect(canChooseEveningCare(day4, 'thanks')).toBe(true);
    expect(canChooseEveningCare(day4, 'postpone')).toBe(false);
    const secondInvite = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: day4, onGame: () => undefined,
    }));
    expect(secondInvite).toContain('Nhận suất cơm Hà cảm ơn');
    expect(secondInvite).not.toContain('Hẹn Hà ngày mai');

    const claimed = chooseEveningCare(day4, 'thanks');
    expect(claimed.cash).toBe(day4.cash);
    expect(claimed.city.energy).toBe(Math.min(100, day4.city.energy + 10));
    saveGame(claimed);
    const reloaded = loadGame();
    expect(chooseEveningCare(reloaded, 'thanks')).toBe(reloaded);
    expect(reloaded.relationshipRewardIds.filter(id => id === 'evening-ha-4-thanks')).toHaveLength(1);
    expect(canChooseEveningCare(finished(nextDay(reloaded)), 'thanks')).toBe(false);
  });

  it('does not extend an unaccepted invitation or allow a second postponement', () => {
    const helped = chooseEveningCare(finished(createInitialState()), 'help');
    const day3 = finished(nextDay(finished(nextDay(helped))));
    const declined = chooseEveningCare(day3, 'rest');
    const day4 = finished(nextDay(declined));
    expect(canChooseEveningCare(day4, 'thanks')).toBe(false);
    expect(canChooseEveningCare(day4, 'postpone')).toBe(false);
    const uninvited = finished(nextDay(finished(nextDay(createInitialState()))));
    expect(canChooseEveningCare(uninvited, 'postpone')).toBe(false);
  });
});
