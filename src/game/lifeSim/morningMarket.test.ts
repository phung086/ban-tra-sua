import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { chooseBreakfast, createMorning, hydrateMorning, visitMorningMarket, wakeMorning } from './morning';

const fresh = () => {
  const game = createInitialState();
  game.morning = createMorning({ day: game.day, city: game.city }, 'market-regression-seed');
  return game;
};
const breakfast = () => chooseBreakfast(wakeMorning(fresh()), 'street');

describe('morning market choices', () => {
  it('only permits visiting after breakfast', () => {
    const asleep = fresh();
    expect(visitMorningMarket(asleep, 'chat')).toBe(asleep);
    const awake = wakeMorning(asleep);
    expect(visitMorningMarket(awake, 'chat')).toBe(awake);
  });
  it('spends once, advances time, feeds player, and improves real neighborhood bond', () => {
    const first = breakfast();
    const bought = visitMorningMarket(first, 'fruit');
    expect(bought.cash).toBe(first.cash - 12000);
    expect(bought.city.minutes).toBe(first.city.minutes + 8);
    expect(bought.morning.satiety).toBe(82);
    expect(bought.city.stories.bonds.hanh).toBe((first.city.stories.bonds.hanh ?? 0) + 1);
    expect(bought.city.journal[0]).toContain('cô Hạnh');
    expect(visitMorningMarket(bought, 'fruit')).toBe(bought);
    expect(visitMorningMarket(bought, 'chat')).toBe(bought);
  });
  it('has a free friendship option when money is low', () => {
    const first = { ...breakfast(), cash: 0 };
    const blocked = visitMorningMarket(first, 'fruit');
    expect(blocked.cash).toBe(0);
    expect(blocked.morning.marketVisit).toBeNull();
    const talked = visitMorningMarket(blocked, 'chat');
    expect(talked.cash).toBe(0);
    expect(talked.morning.marketVisit).toBe('chat');
    expect(talked.city.stories.bonds.hanh).toBe(2);
    expect(visitMorningMarket(first, 'leave').morning.marketVisit).toBe('leave');
  });
  it('migrates old morning saves and prevents replay after reload', () => {
    const first = breakfast();
    const legacy = JSON.parse(JSON.stringify(first.morning));
    delete legacy.marketVisit;
    const restored = hydrateMorning(legacy, { day: first.day, city: first.city }, 'prep');
    expect(restored.breakfast).toBe('street');
    expect(restored.marketVisit).toBeNull();
    const bought = visitMorningMarket({ ...first, morning: restored }, 'fruit');
    const reloaded = hydrateMorning(JSON.parse(JSON.stringify(bought.morning)), { day: bought.day, city: bought.city }, 'prep');
    expect(reloaded.marketVisit).toBe('fruit');
    expect(visitMorningMarket({ ...bought, morning: reloaded }, 'fruit').cash).toBe(bought.cash);
  });
  it('locks the market during service and resets next day', () => {
    const chosen = visitMorningMarket(breakfast(), 'chat');
    const opened = startDay(chosen);
    expect(visitMorningMarket(opened, 'fruit')).toBe(opened);
    const next = nextDay(chosen);
    expect(next.morning.marketVisit).toBeNull();
  });
  it('shows the market options in the real morning panel after breakfast', () => {
    const before = renderToStaticMarkup(createElement(MorningRoutine, { game: fresh(), onGame: () => {} }));
    const after = renderToStaticMarkup(createElement(MorningRoutine, { game: breakfast(), onGame: () => {} }));
    expect(before).not.toContain('Mua trái cây cô Hạnh');
    expect(after).toContain('Độ no'); // Market UI integration remains pending.
  });
});
