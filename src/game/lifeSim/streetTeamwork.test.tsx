import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { chooseBreakfast, wakeMorning } from './morning';
import { canChooseStreetMoment, chooseStreetMoment, getStreetMomentCallback, getStreetMomentChoice } from './streetMoment';
import type { StreetHook } from './dayPlanner';

const ready = (hook: StreetHook) => {
  const morning = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
  return { ...morning, morning: { ...morning.morning,
    plan: { ...morning.morning.plan, streetHook: hook } } };
};

afterEach(() => vi.unstubAllGlobals());

describe('street teamwork playable slice', () => {
  it.each([
    ['forgotten-umbrella', 'lan', 'Nhờ Lan cùng tìm chiếc ô', 'Lan nhắn', 8],
    ['neighbor-help', 'hanh', 'Nhờ cô Hạnh cùng chuyển chậu', 'Cô Hạnh cười', 10],
  ] as const)('%s: button, cost, save, sleep and remembered reply', (hook, helper, label, reply, minutes) => {
    const before = ready(hook);
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game: before, onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain(label);
    expect(html).toContain('gắn kết');
    const after = chooseStreetMoment(before, 'team');
    expect(after.cash).toBe(before.cash);
    expect(after.city.minutes).toBe(before.city.minutes + minutes);
    expect(after.city.energy).toBe(before.city.energy - 1);
    expect(after.city.goodwill).toBe(before.city.goodwill + 2);
    expect(after.city.stories.bonds[helper]).toBe((before.city.stories.bonds[helper] ?? 0) + 1);
    expect(getStreetMomentChoice(after)).toBe('team');
    expect(chooseStreetMoment(after, 'team')).toBe(after);
    expect(chooseStreetMoment(after, 'message')).toBe(after);
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    });
    saveGame(after);
    const restored = loadGame();
    expect(getStreetMomentChoice(restored)).toBe('team');
    expect(restored.city.stories.bonds[helper]).toBe((before.city.stories.bonds[helper] ?? 0) + 1);
    const sleeping = nextDay(restored);
    expect(getStreetMomentCallback(sleeping)).toBeNull();
    const awake = wakeMorning(sleeping);
    expect(getStreetMomentCallback(awake)).toContain(reply);
    saveGame(awake);
    expect(getStreetMomentCallback(loadGame())).toContain(reply);
  });

  it('allows a free message when there is no time, money or energy', () => {
    const before = ready('forgotten-umbrella');
    const late = { ...before, cash: 0, city: { ...before.city, minutes: 659, energy: 0 } };
    expect(canChooseStreetMoment(late, 'team')).toBe(false);
    expect(canChooseStreetMoment(late, 'help')).toBe(false);
    expect(canChooseStreetMoment(late, 'message')).toBe(true);
    const after = chooseStreetMoment(late, 'message');
    expect(after.cash).toBe(0);
    expect(after.city.energy).toBe(0);
    expect(after.city.stories.bonds.lan).toBe(late.city.stories.bonds.lan);
  });
});
