import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState, nextDay } from '../engine';
import type { GameState } from '../types';
import { chooseBreakfast, wakeMorning } from './morning';
import {
  canChooseStreetMoment, chooseStreetMoment, getStreetMoment,
  getStreetMomentCallback, getStreetMomentChoice,
} from './streetMoment';
import type { StreetHook } from './dayPlanner';

function ready(hook: StreetHook): GameState {
  const breakfast = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
  return {
    ...breakfast,
    morning: { ...breakfast.morning, plan: { ...breakfast.morning.plan, streetHook: hook } },
  };
}

describe('playable seeded street moments', () => {
  it('renders a real pre-shop choice in PrepWorld with full gameplay integration', () => {
    const game = ready('forgotten-umbrella');
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game, onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Góc phố sáng nay');
    expect(html).toContain('Chiếc ô bên ghế đá');
    expect(html).toContain('Mang ô trả bác');
    expect(html).toContain('Mở cửa tiệm');
  });

  it('respects days with no street encounter and does not fabricate an event', () => {
    const game = ready('none');
    expect(getStreetMoment(game)).toBeNull();
    expect(canChooseStreetMoment(game, 'help')).toBe(false);
    expect(chooseStreetMoment(game, 'help')).toBe(game);
    expect(renderToStaticMarkup(createElement(PrepWorld, {
      game, onGame: () => undefined, onNavigate: () => undefined,
    }))).not.toContain('Góc phố sáng nay');
  });

  it('adds exact costs and NPC memory once, including after JSON save roundtrip', () => {
    const game = ready('neighbor-help');
    const chosen = chooseStreetMoment(game, 'help');
    expect(chosen.city.minutes).toBe(game.city.minutes + 20);
    expect(chosen.city.energy).toBe(game.city.energy - 4);
    expect(chosen.city.goodwill).toBe(game.city.goodwill + 4);
    expect(chosen.fans).toBe(game.fans + 1);
    expect(chosen.cash).toBe(game.cash);
    expect(getStreetMomentChoice(chosen)).toBe('help');
    const loaded = JSON.parse(JSON.stringify(chosen)) as GameState;
    expect(getStreetMomentChoice(loaded)).toBe('help');
    expect(chooseStreetMoment(loaded, 'help')).toBe(loaded);
    expect(chooseStreetMoment(loaded, 'message')).toBe(loaded);
    expect(loaded.city.journal[0]).toContain('chậu cây');
  });

  it('retains a no-cost route for tired players and late appointments', () => {
    const game = ready('forgotten-umbrella');
    const tired = { ...game, city: { ...game.city, energy: 0, minutes: 1200 } };
    expect(canChooseStreetMoment(tired, 'help')).toBe(false);
    expect(canChooseStreetMoment(tired, 'message')).toBe(true);
    const helped = chooseStreetMoment(tired, 'message');
    expect(helped.city.energy).toBe(0);
    expect(helped.city.minutes).toBe(1200);
    expect(helped.cash).toBe(tired.cash);
    expect(helped.city.goodwill).toBe(tired.city.goodwill + 1);
  });

  it('prevents an encounter before breakfast or after the shift opens', () => {
    const game = ready('neighbor-help');
    const asleep = { ...game, morning: { ...game.morning, step: 'awake' as const } };
    expect(canChooseStreetMoment(asleep, 'help')).toBe(false);
    expect(chooseStreetMoment(asleep, 'help')).toBe(asleep);
    const open = { ...game, phase: 'open' as const };
    expect(canChooseStreetMoment(open, 'message')).toBe(false);
    expect(chooseStreetMoment(open, 'message')).toBe(open);
  });

  it('brings yesterday’s choice into tomorrow’s dialogue without repeating rewards', () => {
    const game = chooseStreetMoment(ready('forgotten-umbrella'), 'help');
    const tomorrow = nextDay(game);
    expect(getStreetMomentCallback(tomorrow)).toContain('mang ô');
    expect(tomorrow.fans).toBe(game.fans);
    expect(tomorrow.city.goodwill).toBe(game.city.goodwill);
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game: tomorrow, onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Lời nhắn hôm nay');
  });

  it('does not mutate any state when invalid numeric data is encountered', () => {
    const game = ready('neighbor-help');
    const bad = { ...game, city: { ...game.city, energy: Number.NaN } };
    expect(canChooseStreetMoment(bad, 'message')).toBe(false);
    expect(chooseStreetMoment(bad, 'message')).toBe(bad);
  });
});
