import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { chooseSocialMorning, getSocialMorningDecision } from './socialMorning';

describe('family calls', () => {
  it('remembers the selected reply', () => {
    const base = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
    const game = { ...base, morning: { ...base.morning, plan: { ...base.morning.plan, socialHook: 'family-call' as const } } };
    const after = chooseSocialMorning(game, 'reply');
    expect(getSocialMorningDecision(after)).toBe('reply');
  });
});
