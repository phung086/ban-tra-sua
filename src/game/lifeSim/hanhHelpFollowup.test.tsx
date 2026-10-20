import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { visitMorningMarket } from './marketEncounter';
import { hanhHelpFollowup, hanhHelpLastResolution, promiseHanhHelp, resolveHanhHelp } from './hanhHelpPromise';

const ready = () => chooseBreakfast(wakeMorning(createInitialState()), 'skip');
const first = () => promiseHanhHelp(visitMorningMarket(ready(), 'chat'));
const wake = (game: ReturnType<typeof ready>) => chooseBreakfast(wakeMorning(nextDay(game)), 'skip');

describe('Hanh next-day follow-up in live market UI', () => {
  it('remembers stall help the next morning after JSON reload, without awarding again', () => {
    const due = wake(first());
    const kept = resolveHanhHelp(due, 'carry');
    expect(hanhHelpFollowup(kept)).toBeNull();
    const next = wake(kept);
    const stored = JSON.parse(JSON.stringify(next)) as typeof next;
    expect(hanhHelpFollowup(stored)).toContain('xếp sạp');
    const html = renderToStaticMarkup(createElement(MorningRoutine, { game: stored, onGame: () => undefined }));
    expect(html).toContain('Nhờ hôm trước cháu xếp sạp');
    expect(html).toContain('Cô Hạnh nhớ lời hẹn');
    expect(stored.cash).toBe(next.cash);
    expect(stored.relationshipRewardIds.filter(id => id.startsWith('hanh-market-help:resolved:'))).toHaveLength(1);
  });

  it('responds differently to a free apology and an overdue visit', () => {
    const due = wake(first());
    expect(hanhHelpFollowup(wake(resolveHanhHelp(due, 'apologize')))).toContain('báo sớm');
    const overdue = wake(due);
    const helped = resolveHanhHelp(overdue, 'carry');
    expect(hanhHelpLastResolution(wake(helped))?.overdue).toBe(true);
    expect(hanhHelpFollowup(wake(helped))).toContain('đến muộn');
  });

  it('rejects invalid ledger entries and expires old greetings', () => {
    const fake = { day: 3, relationshipRewardIds: ['hanh-market-help:resolved:1:carry:2'] };
    expect(hanhHelpFollowup(fake)).toBeNull();
    const due = wake(first());
    const kept = resolveHanhHelp(due, 'bags');
    const third = wake(kept);
    expect(hanhHelpFollowup(third)).toContain('túi giấy');
    expect(hanhHelpFollowup({ ...third, day: 7 })).toBeNull();
    const malformed = { day: 3, relationshipRewardIds: [...third.relationshipRewardIds, 'hanh-market-help:resolved:NaN:carry:3'] };
    expect(hanhHelpLastResolution(malformed)?.choice).toBe('bags');
  });
});
