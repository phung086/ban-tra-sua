import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, chooseLanMeal, hydrateMorning, wakeMorning } from './morning';

const ready = () => chooseBreakfast(wakeMorning(createInitialState()), 'skip');

describe('Lan meal invite: shared bill and save safety', () => {
  it('splits the bill transparently, once only, with a visible relationship consequence', () => {
    const game = ready();
    const after = chooseLanMeal(game, 'split');
    expect(after.cash).toBe(game.cash - 65000);
    expect(after.city.minutes).toBe(game.city.minutes + 40);
    expect(after.morning.satiety).toBe(game.morning.satiety + 20);
    expect(after.city.stories.bonds.lan).toBe((game.city.stories.bonds.lan ?? 0) + 2);
    expect(after.notice).toContain('Chia đôi');
    expect(chooseLanMeal(after, 'treat')).toBe(after);
  });

  it('can treat Lan with explicit cost and no surprise second charge', () => {
    const game = ready();
    const treated = chooseLanMeal(game, 'treat');
    expect(treated.cash).toBe(game.cash - 130000);
    expect(treated.city.stories.bonds.lan).toBe((game.city.stories.bonds.lan ?? 0) + 3);
    expect(chooseLanMeal(treated, 'treat')).toBe(treated);
  });

  it('has a no-cost decline when cash is zero, without softlocking shop opening', () => {
    const game = { ...ready(), cash: 0 };
    const blocked = chooseLanMeal(game, 'split');
    expect(blocked.cash).toBe(0);
    expect(blocked.morning.lanMeal).toBeNull();
    const declined = chooseLanMeal(blocked, 'decline');
    expect(declined.cash).toBe(0);
    expect(declined.morning.lanMeal).toBe('decline');
    expect(declined.morning.step).toBe('finished');
  });

  it('hydrates a saved choice, sanitizes invalid values and resets the next day', () => {
    const game = chooseLanMeal(ready(), 'split');
    const saved = JSON.parse(JSON.stringify(game.morning));
    const hydrated = hydrateMorning(saved, { day: game.day, city: game.city }, 'prep');
    expect(hydrated.lanMeal).toBe('split');
    expect(chooseLanMeal({ ...game, morning: hydrated }, 'split').cash).toBe(game.cash);
    expect(hydrateMorning({ ...saved, lanMeal: 'invalid' }, { day: game.day, city: game.city }, 'prep').lanMeal).toBeNull();
    expect(nextDay(game).morning.lanMeal).toBeNull();
  });

  it('keeps the original breakfast UI playable', () => {
    const html = renderToStaticMarkup(createElement(MorningRoutine, { game: ready(), onGame: () => undefined }));
    expect(html).toContain('Độ no');
    expect(html).toContain('Sinh hoạt buổi sáng');
  });
});
