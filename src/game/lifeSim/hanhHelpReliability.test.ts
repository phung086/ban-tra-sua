import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { visitMorningMarket } from './marketEncounter';
import { canPromiseHanhHelp, pendingHanhHelp, promiseHanhHelp, resolveHanhHelp } from './hanhHelpPromise';

const morning = () => chooseBreakfast(wakeMorning(createInitialState()), 'skip');
const promise = () => promiseHanhHelp(visitMorningMarket(morning(), 'chat'));
const tomorrow = () => chooseBreakfast(wakeMorning(nextDay(promise())), 'skip');

describe('Hanh market promise reliability', () => {
  it('charges paper bags exactly once, including after JSON save/reload', () => {
    const due = tomorrow();
    const after = resolveHanhHelp(due, 'bags');
    expect(after.cash).toBe(due.cash - 9000);
    expect(after.city.minutes).toBe(due.city.minutes + 6);
    expect(after.city.energy).toBe(due.city.energy);
    expect(after.city.stories.bonds.hanh).toBe((due.city.stories.bonds.hanh ?? 0) + 1);
    expect(pendingHanhHelp(after)).toBeNull();
    const reloaded = JSON.parse(JSON.stringify(after)) as typeof after;
    expect(resolveHanhHelp(reloaded, 'bags')).toBe(reloaded);
    expect(reloaded.relationshipRewardIds.filter(id => id.startsWith('hanh-market-help:resolved:'))).toHaveLength(1);
  });

  it('keeps the no-cost apology available when cash, time and energy are exhausted', () => {
    const due = tomorrow();
    const poor = { ...due, cash: 0, city: { ...due.city, minutes: 1260, energy: 0 } };
    expect(resolveHanhHelp(poor, 'carry').city.energy).toBe(0);
    expect(pendingHanhHelp(resolveHanhHelp(poor, 'bags'))).not.toBeNull();
    const after = resolveHanhHelp(poor, 'apologize');
    expect(after.cash).toBe(0);
    expect(after.city.minutes).toBe(1260);
    expect(after.city.energy).toBe(0);
    expect(after.city.stories.bonds.hanh).toBe(Math.max(0, (poor.city.stories.bonds.hanh ?? 0) - 1));
    expect(pendingHanhHelp(after)).toBeNull();
    expect(startDay(after).phase).toBe('open');
  });

  it('remembers an overdue promise without automatically charging or failing the day', () => {
    const first = promise();
    const dayTwo = chooseBreakfast(wakeMorning(nextDay(first)), 'skip');
    const dayThree = chooseBreakfast(wakeMorning(nextDay(dayTwo)), 'skip');
    expect(pendingHanhHelp(dayThree)?.overdue).toBe(true);
    const after = resolveHanhHelp(dayThree, 'carry');
    expect(after.notice).toContain('quên lời hẹn');
    expect(after.cash).toBe(dayThree.cash);
    expect(after.city.energy).toBe(dayThree.city.energy - 7);
    expect(pendingHanhHelp(after)).toBeNull();
    expect(resolveHanhHelp(after, 'carry')).toBe(after);
  });

  it('does not offer a second promise before cooldown or while one is pending', () => {
    const first = promise();
    const dayTwo = chooseBreakfast(wakeMorning(nextDay(first)), 'skip');
    expect(canPromiseHanhHelp(dayTwo)).toBe(false);
    const kept = resolveHanhHelp(dayTwo, 'carry');
    const dayThree = visitMorningMarket(chooseBreakfast(wakeMorning(nextDay(kept)), 'skip'), 'chat');
    expect(canPromiseHanhHelp(dayThree)).toBe(false);
    const dayFour = visitMorningMarket(chooseBreakfast(wakeMorning(nextDay(dayThree)), 'skip'), 'chat');
    expect(canPromiseHanhHelp(dayFour)).toBe(true);
  });
});
