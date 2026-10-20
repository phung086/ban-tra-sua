import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MorningMarket } from '../../components/life/MorningMarket';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { marketPrice, visitMorningMarket } from './marketEncounter';
import { hanhFruitDiscount, promiseHanhHelp, resolveHanhHelp, type HanhHelpChoice } from './hanhHelpPromise';

const wake = (state = createInitialState()) => chooseBreakfast(wakeMorning(state), 'skip');
const promised = () => promiseHanhHelp(visitMorningMarket(wake(), 'chat'));
const due = () => wake(nextDay(promised()));
const followup = (choice: HanhHelpChoice) => wake(nextDay(resolveHanhHelp(due(), choice)));

describe('Hanh kept-promise fruit price in real market', () => {
  it('shows the discounted price and charges exactly once, including after reload', () => {
    const third = followup('carry');
    expect(hanhFruitDiscount(third)).toBe(2000);
    expect(marketPrice(third, 'fruit')).toBe(10000);
    const affordable = { ...third, cash: 10000 };
    const html = renderToStaticMarkup(createElement(MorningMarket, {
      game: affordable, onGame: () => undefined,
    }));
    expect(html).toContain('Giữ lời hẹn: cô giảm');
    expect(html).toContain('10.000');
    expect(html).toContain('2.000');
    const bought = visitMorningMarket(affordable, 'fruit');
    expect(bought.cash).toBe(0);
    expect(bought.morning.marketVisit).toBe('fruit');
    expect(bought.notice).toContain('bớt 2.000');
    const loaded = JSON.parse(JSON.stringify(bought)) as typeof bought;
    expect(visitMorningMarket(loaded, 'fruit')).toBe(loaded);
    expect(loaded.cash).toBe(0);
    expect(hanhFruitDiscount(wake(nextDay(loaded)))).toBe(0);
  });

  it('offers a smaller one-day thank-you after buying paper bags', () => {
    const third = followup('bags');
    expect(hanhFruitDiscount(third)).toBe(1000);
    expect(marketPrice(third, 'fruit')).toBe(11000);
    const poor = { ...third, cash: 11000 };
    expect(visitMorningMarket(poor, 'fruit').cash).toBe(0);
    expect(visitMorningMarket({ ...poor, cash: 10999 }, 'fruit').morning.marketVisit).toBeNull();
  });

  it('never gives a discount for an apology, overdue help or forged resolution', () => {
    expect(hanhFruitDiscount(followup('apologize'))).toBe(0);
    const late = wake(nextDay(due()));
    const fourth = wake(nextDay(resolveHanhHelp(late, 'carry')));
    expect(hanhFruitDiscount(fourth)).toBe(0);
    expect(marketPrice(fourth, 'fruit')).toBe(12000);
    expect(hanhFruitDiscount({ day: 3,
      relationshipRewardIds: ['hanh-market-help:resolved:1:carry:2'] })).toBe(0);
  });
});
