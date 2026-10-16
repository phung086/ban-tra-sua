import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState, nextDay, startDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { chooseBreakfast, wakeMorning } from './morning';
import { canChooseShopTasting, chooseShopTasting, getShopTastingCallback, getShopTastingChoice, getShopTastingPrompt } from './shopTasting';

const ready = () => {
  const game = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
  return { ...game, city: { ...game.city, minutes: 600 } };
};

describe('playable tasting with Co Thu', () => {
  let saved: Map<string, string>;
  beforeEach(() => {
    saved = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
      removeItem: (key: string) => saved.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders choices inside the real shop preparation screen', () => {
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game: ready(), onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Một ly trà, một lời góp ý');
    expect(html).toContain('Pha trà thử');
    expect(html).toContain('Mở cửa tiệm');
  });

  it('charges money, stock, time and energy once, then allows opening', () => {
    const game = ready();
    const after = chooseShopTasting(game, 'serve');
    expect(after.cash).toBe(game.cash - 3000);
    for (const key of ['cupsM', 'classicMilkTea', 'sugar', 'ice'] as const)
      expect(after.inventory[key]).toBe(game.inventory[key] - 1);
    expect(after.city.minutes).toBe(game.city.minutes + 10);
    expect(after.city.energy).toBe(game.city.energy - 4);
    expect(after.city.goodwill).toBe(game.city.goodwill + 2);
    expect(after.fans).toBe(game.fans + 1);
    expect(chooseShopTasting(after, 'serve')).toBe(after);
    expect(chooseShopTasting(after, 'listen')).toBe(after);
    expect(startDay(after, 1000).phase).toBe('open');
  });

  it('keeps the choice across actual save/reload and replies tomorrow', () => {
    const after = chooseShopTasting(ready(), 'serve');
    saveGame(after);
    const loaded = loadGame();
    expect(getShopTastingChoice(loaded)).toBe('serve');
    expect(chooseShopTasting(loaded, 'serve')).toBe(loaded);
    expect(loaded.inventory.cupsM).toBe(after.inventory.cupsM);
    const tomorrow = chooseBreakfast(wakeMorning(nextDay(loaded)), 'skip');
    expect(getShopTastingCallback(tomorrow)).toContain('ít đường');
  });

  it('never softlocks poor, tired or late players', () => {
    const game = ready();
    const poor = { ...game, cash: 0, inventory: { ...game.inventory, cupsM: 0 },
      city: { ...game.city, energy: 0, minutes: 1260 } };
    expect(canChooseShopTasting(poor, 'serve')).toBe(false);
    expect(canChooseShopTasting(poor, 'listen')).toBe(false);
    expect(canChooseShopTasting(poor, 'later')).toBe(true);
    const after = chooseShopTasting(poor, 'later');
    expect(after.cash).toBe(0);
    expect(after.city.energy).toBe(0);
    expect(after.city.minutes).toBe(1260);
  });

  it('rejects stale tea, invalid numbers and changes during a shift', () => {
    const game = ready();
    const stale = { ...game, freshness: { ...game.freshness, classicMilkTea: 10 } };
    expect(canChooseShopTasting(stale, 'serve')).toBe(false);
    expect(canChooseShopTasting(stale, 'listen')).toBe(true);
    const broken = { ...game, city: { ...game.city, minutes: Number.NaN } };
    expect(chooseShopTasting(broken, 'later')).toBe(broken);
    const opened = startDay(game, 1000);
    expect(chooseShopTasting(opened, 'serve')).toBe(opened);
  });

  it('recognizes a prior tasting at the next weekly encounter', () => {
    let game = chooseShopTasting(ready(), 'serve');
    for (let i = 0; i < 7; i++) game = nextDay(game);
    game = chooseBreakfast(wakeMorning(game), 'skip');
    expect(game.day).toBe(8);
    expect(getShopTastingPrompt(game)).toContain('nhớ ly trà');
    expect(getShopTastingChoice(game)).toBeNull();
    expect(chooseShopTasting(game, 'listen').relationshipRewardIds).toHaveLength(2);
  });
});
