import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import type { GameState } from '../types';
import { chooseBreakfast, wakeMorning } from './morning';
import { marketPrice, visitMorningMarket } from './marketEncounter';
import {
  canPostponeHanhHelp, hanhFruitDiscount, hanhHelpFollowup, pendingHanhHelp,
  postponeHanhHelp, promiseHanhHelp, resolveHanhHelp,
} from './hanhHelpPromise';

const wake = (game: GameState) => chooseBreakfast(wakeMorning(game), 'skip');
const tomorrow = (game: GameState) => wake(nextDay(game));
const reload = (game: GameState): GameState => JSON.parse(JSON.stringify(game)) as GameState;
const first = () => promiseHanhHelp(visitMorningMarket(wake(createInitialState()), 'chat'));

describe('Hanh reschedules one market promise', () => {
  it('charges only two minutes and one trust point, and persists the due day', () => {
    const due = tomorrow(first());
    expect(canPostponeHanhHelp(due)).toBe(true);
    const after = postponeHanhHelp(due);
    expect(after.cash).toBe(due.cash);
    expect(after.city.minutes).toBe(due.city.minutes + 2);
    expect(after.city.stories.bonds.hanh).toBe(Math.max(0, (due.city.stories.bonds.hanh ?? 0) - 1));
    expect(pendingHanhHelp(reload(after))?.dueDay).toBe(3);
    expect(pendingHanhHelp(after)?.postponed).toBe(true);
    expect(postponeHanhHelp(after)).toBe(after);
    expect(resolveHanhHelp(after, 'carry')).toBe(after);
  });

  it('honors the postponed appointment and gives a one-day discount exactly once', () => {
    const third = tomorrow(reload(postponeHanhHelp(tomorrow(first()))));
    expect(pendingHanhHelp(third)?.overdue).toBe(false);
    const kept = resolveHanhHelp(third, 'carry');
    expect(resolveHanhHelp(kept, 'carry')).toBe(kept);
    const fourth = tomorrow(reload(kept));
    expect(hanhHelpFollowup(fourth)).toContain('báo dời hẹn');
    expect(hanhFruitDiscount(fourth)).toBe(2000);
    expect(marketPrice(fourth, 'fruit')).toBe(10000);
    const bought = visitMorningMarket(fourth, 'fruit');
    expect(bought.cash).toBe(fourth.cash - 10000);
    expect(visitMorningMarket(reload(bought), 'fruit').cash).toBe(bought.cash);
    expect(marketPrice(tomorrow(bought), 'fruit')).toBe(12000);
  });

  it('withholds rewards when late; free apology works at zero cash and energy', () => {
    const fourth = tomorrow(tomorrow(reload(postponeHanhHelp(tomorrow(first())))));
    expect(pendingHanhHelp(fourth)?.overdue).toBe(true);
    expect(canPostponeHanhHelp(fourth)).toBe(false);
    const late = resolveHanhHelp(fourth, 'carry');
    expect(hanhFruitDiscount(tomorrow(late))).toBe(0);
    const poor = { ...fourth, cash: 0, city: { ...fourth.city, energy: 0, minutes: 1260 } };
    const apologized = resolveHanhHelp(poor, 'apologize');
    expect(apologized.cash).toBe(0);
    expect(pendingHanhHelp(apologized)).toBeNull();
  });
});
