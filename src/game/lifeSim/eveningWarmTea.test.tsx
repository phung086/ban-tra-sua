import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { wakeMorning } from './morning';
import { EveningCarePanel } from '../../components/life/EveningCarePanel';
import { canChooseEveningTea, chooseEveningTea, getEveningTeaCallback, getEveningTeaChoice } from './eveningWarmTea';

function ready(day = 2) {
  let game = createInitialState();
  for (let i = 1; i < day; i++) game = nextDay(game);
  return { ...game, phase: 'summary' as const, summary: {
    day, eventName: game.event.name, orders: 1, perfectOrders: 0,
    bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0,
    profit: 0, averageScore: 80, fansGained: 0, researchGained: 0,
  }};
}
describe('warm tea after a completed shift', () => {
  let data: Map<string,string>;
  beforeEach(() => {
    data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => { data.set(k,v); },
      removeItem: (k: string) => { data.delete(k); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('renders actual choices in the existing evening panel', () => {
    const html = renderToStaticMarkup(createElement(EveningCarePanel, {
      game: ready(), onGame: () => undefined,
    }));
    expect(html).toContain('Trà ấm cuối ca');
    expect(html).toContain('Pha trà ấm cho bác Bình');
    expect(html).toContain('Hỏi thăm bác Bình');
    expect(html).toContain('Về nghỉ');
  });
  it('spends real stock once and remembers across save, sleep and wake', () => {
    const game = ready();
    const chosen = chooseEveningTea(game,'brew');
    expect(chosen.inventory.cupsM).toBe(game.inventory.cupsM-1);
    expect(chosen.inventory.classicMilkTea).toBe(game.inventory.classicMilkTea-1);
    expect(chosen.inventory.sugar).toBe(game.inventory.sugar-1);
    expect(chosen.city.minutes).toBe(game.city.minutes+8);
    expect(chosen.city.energy).toBe(game.city.energy-2);
    expect(chosen.city.goodwill).toBe(game.city.goodwill+2);
    expect(chosen.fans).toBe(game.fans+1);
    saveGame(chosen);
    const loaded = loadGame();
    expect(getEveningTeaChoice(loaded)).toBe('brew');
    expect(chooseEveningTea(loaded,'brew')).toBe(loaded);
    expect(chooseEveningTea(loaded,'talk')).toBe(loaded);
    const asleep = nextDay(loaded);
    expect(getEveningTeaCallback(asleep)).toBeNull();
    const awake = wakeMorning(asleep);
    expect(getEveningTeaCallback(awake)).toContain('trà ấm tối qua');
    saveGame(awake);
    expect(getEveningTeaCallback(loadGame())).toContain('trà ấm tối qua');
  });
  it('requires a real completed shift on the scheduled day', () => {
    const game = ready();
    const empty = { ...game, summary: { ...game.summary, orders: 0 } };
    expect(canChooseEveningTea(empty,'brew')).toBe(false);
    expect(chooseEveningTea(empty,'rest')).toBe(empty);
    expect(canChooseEveningTea(ready(3),'rest')).toBe(false);
    expect(canChooseEveningTea({ ...game, phase: 'open' as const },'rest')).toBe(false);
  });
  it('keeps a free rest route even at zero cash, energy and stock', () => {
    const game = ready();
    const tired = { ...game, cash: 0, city: { ...game.city, energy: 0, minutes: 1260 },
      inventory: { ...game.inventory, cupsM: 0 } };
    expect(canChooseEveningTea(tired,'brew')).toBe(false);
    expect(canChooseEveningTea(tired,'talk')).toBe(false);
    expect(canChooseEveningTea(tired,'rest')).toBe(true);
    expect(chooseEveningTea(tired,'rest').cash).toBe(0);
  });
  it('rejects corrupt clocks and supports conversation without ingredients', () => {
    const game = ready();
    const invalid = { ...game, city: { ...game.city, minutes: Number.NaN } };
    expect(chooseEveningTea(invalid,'rest')).toBe(invalid);
    const empty = { ...game, inventory: { ...game.inventory, cupsM: 0 } };
    expect(canChooseEveningTea(empty,'talk')).toBe(true);
    expect(chooseEveningTea(empty,'talk').inventory).toBe(empty.inventory);
  });
});
