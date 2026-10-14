import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { chooseBreakfast, wakeMorning } from './morning';
import { EveningCarePanel } from '../../components/life/EveningCarePanel';
import {
  canChooseEveningCare, chooseEveningCare, getEveningCareCallback, getEveningCareChoice,
} from './eveningCare';

function finishedShift() {
  const game = createInitialState();
  return {
    ...game,
    phase: 'summary' as const,
    summary: {
      day: game.day, eventName: game.event.name, orders: 1,
      perfectOrders: 0, bestCombo: 0, revenue: 0,
      ingredientCost: 0, wasteCost: 0, profit: 0,
      averageScore: 80, fansGained: 0, researchGained: 0,
    },
  };
}

describe('evening with neighbor Ha', () => {
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

  it('renders three actual choices on the post-shift screen', () => {
    const game = finishedShift();
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game, onGame: () => undefined,
    }));
    expect(html).toContain('Hà rủ ghé quán cơm');
    expect(html).toContain('Ăn cơm tối');
    expect(html).toContain('Giúp Hà dọn quán');
    expect(html).toContain('Nhắn Hà rồi về nghỉ');
    expect(html).toContain('22.000');
  });

  it('charges dinner exactly once, persists through save and delivers a next-day reply', () => {
    const game = finishedShift();
    const after = chooseEveningCare(game, 'dinner');
    expect(after.cash).toBe(game.cash - 22000);
    expect(after.city.minutes).toBe(game.city.minutes + 20);
    expect(after.city.energy).toBe(Math.min(100, game.city.energy + 12));
    expect(after.city.goodwill).toBe(game.city.goodwill + 2);
    expect(game.cash).toBeGreaterThan(after.cash);
    saveGame(after);
    const loaded = loadGame();
    expect(getEveningCareChoice(loaded)).toBe('dinner');
    expect(chooseEveningCare(loaded, 'dinner')).toBe(loaded);
    expect(chooseEveningCare(loaded, 'help')).toBe(loaded);
    const tomorrow = wakeMorning(nextDay(loaded));
    expect(getEveningCareCallback(tomorrow)).toContain('Hôm qua ăn được không');
    expect(renderToStaticMarkup(createElement(EveningCarePanel, {
      game: tomorrow, onGame: () => undefined,
    }))).toContain('LỜI NHẮN SAU MỘT ĐÊM');
  });

  it('supports helping without payment and respects energy and clock limits', () => {
    const game = finishedShift();
    const tired = { ...game, cash: 0, city: { ...game.city, energy: 3 } };
    expect(canChooseEveningCare(tired, 'help')).toBe(false);
    const rested = { ...game, cash: 0, city: { ...game.city, energy: 10 } };
    const after = chooseEveningCare(rested, 'help');
    expect(after.cash).toBe(0);
    expect(after.city.energy).toBe(6);
    expect(after.city.goodwill).toBe(rested.city.goodwill + 3);
    const late = { ...rested, city: { ...rested.city, minutes: 1250 } };
    expect(canChooseEveningCare(late, 'help')).toBe(false);
    expect(canChooseEveningCare(late, 'rest')).toBe(true);
  });

  it('never softlocks a broke exhausted player at closing time', () => {
    const game = finishedShift();
    const late = { ...game, cash: 0, city: { ...game.city, minutes: 1260, energy: 0 } };
    const after = chooseEveningCare(late, 'rest');
    expect(after.cash).toBe(0);
    expect(after.city.minutes).toBe(1260);
    expect(after.city.energy).toBe(6);
    expect(getEveningCareChoice(after)).toBe('rest');
    expect(getEveningCareCallback(wakeMorning(nextDay(after)))).toContain('Nghỉ được là tốt');
  });

  it('rejects incomplete shifts, stale summaries and malformed numeric state', () => {
    const game = finishedShift();
    const prep = { ...game, phase: 'prep' as const };
    const stale = { ...game, summary: { ...game.summary, day: game.day - 1 } };
    const broken = { ...game, cash: Number.NaN };
    expect(chooseEveningCare(prep, 'rest')).toBe(prep);
    expect(chooseEveningCare(stale, 'rest')).toBe(stale);
    expect(chooseEveningCare(broken, 'rest')).toBe(broken);
    expect(chooseEveningCare(game, 'unknown' as 'rest')).toBe(game);
  });

  it('does not show a callback before the next morning or two days later', () => {
    const game = chooseEveningCare(finishedShift(), 'rest');
    expect(getEveningCareCallback(game)).toBeNull();
    const day2 = wakeMorning(nextDay(game));
    expect(getEveningCareCallback(day2)).not.toBeNull();
    expect(getEveningCareCallback(nextDay(day2))).toBeNull();
  });
  it('waits for wake and preserves Ha\'s reply across breakfast and reload', () => {
    const chosen = chooseEveningCare(finishedShift(), 'help');
    saveGame(chosen);
    const asleep = nextDay(loadGame());
    expect(asleep.morning.step).toBe('asleep');
    expect(getEveningCareCallback(asleep)).toBeNull();
    expect(renderToStaticMarkup(createElement(EveningCarePanel, {
      game: asleep, onGame: () => undefined,
    }))).not.toContain('LỜI NHẮN SAU MỘT ĐÊM');

    const awake = wakeMorning(asleep);
    expect(getEveningCareCallback(awake)).toContain('đóng quán kịp giờ');
    const breakfast = chooseBreakfast(awake, 'skip');
    saveGame(breakfast);
    const reloaded = loadGame();
    expect(reloaded.morning.step).toBe('finished');
    expect(getEveningCareCallback(reloaded)).toContain('đóng quán kịp giờ');
    expect(reloaded.cash).toBe(chosen.cash);
    expect(reloaded.relationshipRewardIds.filter(id => id === 'evening-ha-1-help')).toHaveLength(1);
  });

  it('unlocks a free thank-you meal two days after helping, then remembers it across reload', () => {
    const helped = chooseEveningCare(finishedShift(), 'help');
    const secondDay = nextDay(helped);
    const secondSummary = {
      ...secondDay,
      phase: 'summary' as const,
      summary: { ...finishedShift().summary!, day: 2 },
    };
    expect(canChooseEveningCare(secondSummary, 'thanks')).toBe(false);
    const thirdDay = nextDay(secondSummary);
    const thirdSummary = {
      ...thirdDay,
      phase: 'summary' as const,
      summary: { ...finishedShift().summary!, day: 3 },
      cash: 0,
      city: { ...thirdDay.city, energy: 40, minutes: 1100 },
    };
    expect(canChooseEveningCare(thirdSummary, 'thanks')).toBe(true);
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: thirdSummary, onGame: () => undefined,
    }));
    expect(html).toContain('Nhận suất cơm Hà cảm ơn');
    expect(html).toContain('Hà nhớ lời hẹn cơm');
    const claimed = chooseEveningCare(thirdSummary, 'thanks');
    expect(claimed.cash).toBe(0);
    expect(claimed.city.minutes).toBe(1115);
    expect(claimed.city.energy).toBe(50);
    expect(claimed.city.goodwill).toBe(thirdSummary.city.goodwill + 2);
    expect(getEveningCareChoice(claimed)).toBe('thanks');
    expect(chooseEveningCare(claimed, 'thanks')).toBe(claimed);
    expect(chooseEveningCare(claimed, 'dinner')).toBe(claimed);
    saveGame(claimed);
    const reloaded = loadGame();
    expect(chooseEveningCare(reloaded, 'thanks')).toBe(reloaded);
    expect(reloaded.relationshipRewardIds.filter(id => id === 'evening-ha-3-thanks')).toHaveLength(1);
    expect(getEveningCareCallback(wakeMorning(nextDay(reloaded)))).toContain('Có qua có lại');
  });

  it('hides thank-you meal without prior help and preserves late-hour fallback', () => {
    const day2 = nextDay(finishedShift());
    const day3 = nextDay(day2);
    const summary = {
      ...day3,
      phase: 'summary' as const,
      summary: { ...finishedShift().summary!, day: 3 },
    };
    expect(canChooseEveningCare(summary, 'thanks')).toBe(false);
    expect(renderToStaticMarkup(createElement(EveningCarePanel, {
      game: summary, onGame: () => undefined,
    }))).not.toContain('Nhận suất cơm Hà cảm ơn');
    const helped = chooseEveningCare(finishedShift(), 'help');
    const thirdDay = nextDay(nextDay(helped));
    const late = {
      ...thirdDay,
      phase: 'summary' as const,
      summary: { ...finishedShift().summary!, day: 3 },
      cash: 0,
      city: { ...thirdDay.city, minutes: 1260, energy: 0 },
    };
    expect(canChooseEveningCare(late, 'thanks')).toBe(false);
    expect(canChooseEveningCare(late, 'rest')).toBe(true);
  });

});
