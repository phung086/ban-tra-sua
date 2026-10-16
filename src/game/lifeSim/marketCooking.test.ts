import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, cookMarketMeal, createMorning, hydrateMorning, visitMorningMarket, wakeMorning } from './morning';

function prepared() {
  const game = createInitialState();
  game.morning = createMorning({ day: game.day, city: game.city }, 'market-qa-seed');
  return chooseBreakfast(wakeMorning(game), 'skip');
}

describe('playable morning market and cooking', () => {
  it('buys ingredients once and updates cash, clock, energy and goodwill', () => {
    const game = prepared();
    const bought = visitMorningMarket(game, 'basket');
    expect(bought.cash).toBe(game.cash - 12000);
    expect(bought.city.minutes).toBe(game.city.minutes + 12);
    expect(bought.city.energy).toBe(game.city.energy - 2);
    expect(bought.city.goodwill).toBe(game.city.goodwill + 1);
    expect(bought.storyLog[0].customerId).toBe('hanh');
    expect(visitMorningMarket(bought, 'basket')).toBe(bought);
    expect(visitMorningMarket(bought, 'chat')).toBe(bought);
  });

  it('cooks after shopping without double consuming ingredients', () => {
    const bought = visitMorningMarket(prepared(), 'basket');
    const cooked = cookMarketMeal(bought);
    expect(cooked.morning.homeCooked).toBe(true);
    expect(cooked.morning.satiety).toBe(bought.morning.satiety + 20);
    expect(cooked.city.minutes).toBe(bought.city.minutes + 18);
    expect(cooked.city.energy).toBe(bought.city.energy - 3);
    expect(cookMarketMeal(cooked)).toBe(cooked);
    expect(cooked.cash).toBe(bought.cash);
  });

  it('has a free fallback for zero cash without blocking opening the shop', () => {
    const game = { ...prepared(), cash: 0 };
    const blocked = visitMorningMarket(game, 'basket');
    expect(blocked.cash).toBe(0);
    expect(blocked.morning.marketVisit).toBeNull();
    const chatted = visitMorningMarket(blocked, 'chat');
    expect(chatted.cash).toBe(0);
    expect(chatted.morning.marketVisit).toBe('chat');
    expect(cookMarketMeal(chatted)).toBe(chatted);
    expect(startDay(chatted).phase).toBe('open');
  });

  it('migrates old v3 saves and rejects forged cooked flags', () => {
    const game = prepared();
    const old: Record<string, unknown> = { ...game.morning };
    delete old.marketVisit;
    delete old.homeCooked;
    const hydrated = hydrateMorning(old, { day: game.day, city: game.city }, 'prep');
    expect(hydrated.marketVisit).toBeNull();
    expect(hydrated.homeCooked).toBe(false);
    const corrupted = hydrateMorning({ ...old, marketVisit: 'chat', homeCooked: true },
      { day: game.day, city: game.city }, 'prep');
    expect(corrupted.marketVisit).toBe('chat');
    expect(corrupted.homeCooked).toBe(false);
  });

  it('survives save/reload and remembers cô Hạnh on the next day', () => {
    const cooked = cookMarketMeal(visitMorningMarket(prepared(), 'basket'));
    const restored = hydrateMorning(JSON.parse(JSON.stringify(cooked.morning)),
      { day: cooked.day, city: cooked.city }, 'prep');
    expect(restored.homeCooked).toBe(true);
    expect(cookMarketMeal({ ...cooked, morning: restored })).toEqual({ ...cooked, morning: restored });
    const tomorrow = nextDay({ ...cooked, morning: restored });
    expect(tomorrow.morning.marketVisit).toBeNull();
    expect(tomorrow.morning.homeCooked).toBe(false);
    expect(tomorrow.storyLog.some(moment => moment.customerId === 'hanh')).toBe(true);
    expect(visitMorningMarket(tomorrow, 'basket')).toBe(tomorrow);
  });

  it('blocks market actions during the tea shift', () => {
    const open = startDay(prepared());
    expect(visitMorningMarket(open, 'chat')).toBe(open);
    expect(cookMarketMeal(open)).toBe(open);
  });
});
