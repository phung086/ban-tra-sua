import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DrinkCup } from './DrinkCup';
import { emptyDraft } from '../game/engine';
it('renders pearl topping when selected', () => {
  const markup = renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), topping: 'black-pearl' }} />);
  expect(markup).toContain('topping-black-pearl');
});
