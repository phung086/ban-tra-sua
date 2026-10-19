import { expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import { canEatLeftoverBreak, eatLeftoverBreak } from './leftoverBreak';

it('keeps the free meal consumed across reload and resets tomorrow', () => {
  const awake = wakeMorning(createInitialState());
  const open = startDay(chooseBreakfast({ ...awake, cash: 0 }, 'leftovers'));
  const eaten = eatLeftoverBreak(open);
  const saved = JSON.parse(JSON.stringify(eaten)) as typeof eaten;
  saved.morning = hydrateMorning(saved.morning, { day: saved.day, city: saved.city }, 'open');
  expect(canEatLeftoverBreak(saved)).toBe(false);
  expect(eatLeftoverBreak(saved)).toBe(saved);
  expect(nextDay(saved).morning.breakfast).toBeNull();
});
