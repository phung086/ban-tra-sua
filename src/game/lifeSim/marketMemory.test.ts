import { expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { visitMorningMarket } from './marketEncounter';

it('remembers Hanh after a new day', () => {
  const first = visitMorningMarket(chooseBreakfast(wakeMorning(createInitialState()), 'skip'), 'chat');
  const second = visitMorningMarket(chooseBreakfast(wakeMorning(nextDay(first)), 'skip'), 'chat');
  expect(second.notice).toContain('Hôm qua cháu hỏi thăm');
});
