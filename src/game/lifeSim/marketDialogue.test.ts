import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { createInitialState } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { visitMorningMarket } from './marketEncounter';

it('keeps Hanh dialogue visible after save reload overwrites notice', () => {
  const ready = chooseBreakfast(wakeMorning(createInitialState()), 'street');
  const market = visitMorningMarket(ready, 'fruit');
  const reloaded = { ...market, notice: 'Other event' };
  const html = renderToStaticMarkup(createElement(MorningRoutine, { game: reloaded, onGame: () => undefined }));
  expect(html).toContain('Trái cây mới về sáng nay');
});
