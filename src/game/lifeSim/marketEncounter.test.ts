import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import { marketChoice, visitMorningMarket } from './marketEncounter';

const ready = () => chooseBreakfast(wakeMorning(createInitialState()), 'street');

describe('playable market encounter', () => {
  it('renders three real buttons in the live morning UI after breakfast', () => {
    const game = ready();
    const html = renderToStaticMarkup(createElement(MorningRoutine, { game, onGame: () => undefined }));
    expect(html).toContain('Ghé chợ đầu ngõ');
    expect(html).toContain('Mua trái cây cô Hạnh');
    expect(html).toContain('Hỏi thăm cô Hạnh');
    expect(html).toContain('Đi thẳng tới tiệm');
  });

  it('buys fruit once and updates money, clock, satiety and Hanh bond together', () => {
    const game = ready();
    const after = visitMorningMarket(game, 'fruit');
    expect(after.cash).toBe(188000);
    expect(after.city.minutes).toBe(game.city.minutes + 8);
    expect(after.morning.satiety).toBe(82);
    expect(after.city.stories.bonds.hanh).toBe((game.city.stories.bonds.hanh ?? 0) + 1);
    expect(after.city.journal[0]).toContain('trái cây');
    expect(marketChoice(after)).toBe('fruit');
    expect(visitMorningMarket(after, 'chat')).toBe(after);
  });

  it('allows free chat and records a different NPC response', () => {
    const game = ready();
    const after = visitMorningMarket(game, 'chat');
    expect(after.cash).toBe(game.cash);
    expect(after.city.minutes).toBe(game.city.minutes + 5);
    expect(after.city.stories.bonds.hanh).toBe((game.city.stories.bonds.hanh ?? 0) + 2);
    expect(after.notice).toContain('Cô Hạnh:');
  });

  it('can leave for free and open the shop without a market softlock', () => {
    const game = ready();
    const after = visitMorningMarket(game, 'leave');
    expect(after.cash).toBe(game.cash);
    expect(after.city.minutes).toBe(game.city.minutes);
    expect(startDay(after, 1000).phase).toBe('open');
  });

  it('cannot buy fruit with insufficient money, but chat is still available', () => {
    const game = { ...ready(), cash: 0 };
    const blocked = visitMorningMarket(game, 'fruit');
    expect(blocked.cash).toBe(0);
    expect(marketChoice(blocked)).toBeNull();
    expect(marketChoice(visitMorningMarket(blocked, 'chat'))).toBe('chat');
  });

  it('cannot visit before breakfast or after opening the shop', () => {
    const asleep = createInitialState();
    expect(visitMorningMarket(asleep, 'fruit')).toBe(asleep);
    const opened = startDay(ready(), 1000);
    expect(visitMorningMarket(opened, 'fruit')).toBe(opened);
  });

  it('persists choice across v3 reload and never pays twice', () => {
    const bought = visitMorningMarket(ready(), 'fruit');
    const restored = hydrateMorning(JSON.parse(JSON.stringify(bought.morning)),
      { day: bought.day, city: bought.city }, 'prep');
    expect(marketChoice({ ...bought, morning: restored })).toBe('fruit');
    const reloaded = { ...bought, morning: restored };
    expect(visitMorningMarket(reloaded, 'fruit')).toBe(reloaded);
  });

  it('retains a paid breakfast when optional market save field is malformed', () => {
    const bought = ready();
    const morning = hydrateMorning({ ...bought.morning, marketVisit: 'invalid' },
      { day: bought.day, city: bought.city }, 'prep');
    expect(morning.step).toBe('finished');
    expect(morning.breakfast).toBe('street');
    expect(marketChoice({ ...bought, morning })).toBeNull();
  });

  it('resets the market choice next day but retains the NPC relationship', () => {
    const first = visitMorningMarket(ready(), 'chat');
    const next = nextDay(first);
    expect(marketChoice(next)).toBeNull();
    expect(next.morning.step).toBe('asleep');
    expect(next.city.stories.bonds.hanh).toBe(first.city.stories.bonds.hanh);
  });
});
