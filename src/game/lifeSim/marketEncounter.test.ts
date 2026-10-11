import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { visitMorningMarket } from './marketEncounter';
describe('market gameplay', () => {
  it('charges once', () => {
    const ready = chooseBreakfast(wakeMorning(createInitialState()), 'street');
    const after = visitMorningMarket(ready, 'fruit');
    expect(after.cash).toBe(ready.cash - 12000);
    expect(visitMorningMarket(after, 'fruit')).toBe(after);
  });
});
