import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ShiftBreakPanel } from '../../components/life/ShiftBreakPanel';
import { createInitialState, startDay } from '../engine';
import { chooseBreakfast, prepareLunch, wakeMorning } from './morning';
import { eatPackedLunch } from './packedLunch';

function shopWithLunch() {
  const awake = wakeMorning(createInitialState());
  return startDay(prepareLunch(chooseBreakfast(awake, 'skip'), 'lunchbox'));
}

const render = (game: ReturnType<typeof shopWithLunch>) =>
  renderToStaticMarkup(createElement(ShiftBreakPanel, { game, onGame: () => {} }));

describe('real brewing UI for packed lunch', () => {
  it('offers the prepared lunchbox inside the active tea shift', () => {
    const html = render(shopWithLunch());
    expect(html).toContain('Ăn cơm hộp mang theo');
    expect(html).toContain('10 phút');
    expect(html).toContain('+30 no');
  });

  it('removes the lunchbox after eating and never offers it on an unprepared shift', () => {
    expect(render(eatPackedLunch(shopWithLunch()))).not.toContain('Ăn cơm hộp mang theo');
    const withoutLunch = startDay(chooseBreakfast(wakeMorning(createInitialState()), 'skip'));
    expect(render(withoutLunch)).not.toContain('Ăn cơm hộp mang theo');
  });
});
