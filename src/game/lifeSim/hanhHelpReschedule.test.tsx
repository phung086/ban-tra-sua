import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MorningMarket } from '../../components/life/MorningMarket';
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

describe('Hanh postponement controls in live MorningMarket', () => {
  const markup = (game: GameState) => renderToStaticMarkup(createElement(MorningMarket, {game, onGame: () => undefined}));
  it('exposes postponement once and hides early help after reload', () => {
    const second = tomorrow(first());
    expect(markup(second)).toContain('Báo cô Hạnh dời hẹn sang ngày 3');
    const moved = reload(postponeHanhHelp(second));
    expect(markup(moved)).toContain('Cô Hạnh chờ ngày 3');
    expect(markup(moved)).not.toContain('Báo cô Hạnh dời hẹn sang ngày');
    expect(markup(moved)).not.toContain('Phụ xếp sạp');
    expect(markup(moved)).not.toContain('Mua túi giấy');
    expect(resolveHanhHelp(moved, 'carry')).toBe(moved);
    expect(resolveHanhHelp(moved, 'apologize')).toBe(moved);
  });

  it('restores help on the new due date and offers free apology when overdue', () => {
    const third = tomorrow(reload(postponeHanhHelp(tomorrow(first()))));
    expect(markup(third)).toContain('Phụ xếp sạp');
    expect(markup(third)).not.toContain('Báo cô Hạnh dời hẹn sang ngày');
    const fourth = tomorrow(third);
    const poor = { ...fourth, cash: 0, city: { ...fourth.city, energy: 0 } };
    expect(markup(poor)).toContain('Xin lỗi cô Hạnh');
    expect(markup(poor)).toContain('disabled');
    expect(resolveHanhHelp(poor, 'apologize').cash).toBe(0);
  });

  it('rejects invalid resources and duplicate postponement markers', () => {
    const second = tomorrow(first());
    for (const field of ['cash', 'minutes', 'energy'] as const) {
      const broken = field === 'cash'
        ? { ...second, cash: Number.NaN }
        : { ...second, city: { ...second.city, [field]: Number.NaN } };
      expect(canPostponeHanhHelp(broken)).toBe(false);
      expect(postponeHanhHelp(broken)).toBe(broken);
    }
    const moved = reload(postponeHanhHelp(second));
    expect(canPostponeHanhHelp(moved)).toBe(false);
    expect(postponeHanhHelp(moved)).toBe(moved);
    expect(moved.relationshipRewardIds.filter(id => id.startsWith('hanh-market-help:postponed:'))).toHaveLength(1);
  });
});
