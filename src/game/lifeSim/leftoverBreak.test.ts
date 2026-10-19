import { expect, it } from 'vitest';
import { createInitialState, startDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { canEatLeftoverBreak, eatLeftoverBreak } from './leftoverBreak';

it('allows one free rice break after a leftover breakfast', () => {
  const awake = wakeMorning(createInitialState());
  const open = startDay(chooseBreakfast({ ...awake, cash: 0 }, 'leftovers'));
  expect(canEatLeftoverBreak(open)).toBe(true);
  const eaten = eatLeftoverBreak(open);
  expect(eaten.cash).toBe(0);
  expect(eaten.morning.satiety).toBe(75);
  expect(eatLeftoverBreak(eaten)).toBe(eaten);
});
