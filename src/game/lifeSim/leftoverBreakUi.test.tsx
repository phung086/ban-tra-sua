import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createInitialState, startDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { ShiftBreakPanel } from '../../components/life/ShiftBreakPanel';

it('offers the free rice break inside the actual tea-shift panel', () => {
  const awake = wakeMorning(createInitialState());
  const game = startDay(chooseBreakfast({ ...awake, cash: 0 }, 'leftovers'));
  const html = renderToStaticMarkup(createElement(ShiftBreakPanel, {
    game, onGame: () => undefined,
  }));
  expect(html).toContain('Ăn cơm nguội mang theo');
  expect(html).toContain('miễn phí');
});
