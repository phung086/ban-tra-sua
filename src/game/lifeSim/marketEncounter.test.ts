import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { marketChoice, visitMorningMarket } from './marketEncounter';
import { MorningRoutine } from '../../components/life/MorningRoutine';

const ready = () => chooseBreakfast(wakeMorning(createInitialState()), 'street');

describe('market encounter', () => {
  it('renders interactive market choices after breakfast', () => {
    const html = renderToStaticMarkup(createElement(MorningRoutine, {game: ready(), onGame: () => {}}));
    expect(html).toContain('Mua trái cây cô Hạnh');
    expect(html).toContain('Hỏi thăm cô Hạnh');
  });
  it('changes cash, time, hunger and bond only once', () => {
    const game = ready();
    const visited = visitMorningMarket(game, 'fruit');
    expect(visited.cash).toBe(game.cash - 12000);
    expect(visited.city.minutes).toBe(game.city.minutes + 8);
    expect(visited.morning.satiety).toBe(game.morning.satiety + 12);
    expect(visited.city.stories.bonds.hanh).toBe((game.city.stories.bonds.hanh ?? 0) + 1);
    expect(visitMorningMarket(visited, 'fruit')).toBe(visited);
  });
  it('allows free conversation and keeps choice across save reload', () => {
    const game = {...ready(), cash: 0};
    const chat = visitMorningMarket(game, 'chat');
    expect(marketChoice(chat)).toBe('chat');
    expect(marketChoice({...chat, morning: JSON.parse(JSON.stringify(chat.morning))})).toBe('chat');
    expect(chat.cash).toBe(0);
    expect(visitMorningMarket(chat, 'fruit')).toBe(chat);
  });
  it('locks after shop opens and resets on next day', () => {
    const game = visitMorningMarket(ready(), 'leave');
    const opened = startDay(game);
    expect(visitMorningMarket(opened, 'chat')).toBe(opened);
    expect(marketChoice(nextDay(game))).toBeNull();
  });
});
