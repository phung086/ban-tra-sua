import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { canChooseSocialMorning, chooseSocialMorning, getSocialMorningCallback, getSocialMorningDecision } from './socialMorning';

function social(hook: 'friend-invite' | 'family-call') {
  const base = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
  return { ...base, morning: { ...base.morning, plan: { ...base.morning.plan, socialHook: hook } } };
}

describe('social morning gameplay and save', () => {
  it('charges Lan outing once and remembers the decision after JSON reload', () => {
    const game = social('friend-invite');
    const after = chooseSocialMorning(game, 'visit');
    expect(after.cash).toBe(game.cash - 16000);
    expect(after.city.minutes).toBe(game.city.minutes + 25);
    const reloaded = JSON.parse(JSON.stringify(after)) as typeof after;
    expect(getSocialMorningDecision(reloaded)).toBe('visit');
    expect(chooseSocialMorning(reloaded, 'visit')).toBe(reloaded);
  });

  it('allows a free reply when late and broke', () => {
    const game = social('friend-invite');
    const late = { ...game, cash: 0, city: { ...game.city, minutes: 1200, energy: 0 } };
    expect(canChooseSocialMorning(late, 'visit')).toBe(false);
    expect(canChooseSocialMorning(late, 'reply')).toBe(true);
    expect(chooseSocialMorning(late, 'reply').cash).toBe(0);
  });

  it('carries the family call into next-day dialogue', () => {
    const after = chooseSocialMorning(social('family-call'), 'visit');
    expect(after.storyLog[0].customerId).toBe('family-mother-mai');
    expect(getSocialMorningCallback(nextDay(after))).toContain('Hôm qua nói chuyện');
  });
});
