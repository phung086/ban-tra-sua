import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DrinkCup } from './DrinkCup';
import { emptyDraft } from '../game/engine';
it('renders pearl topping when selected', () => {
  const markup = renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), topping: 'black-pearl' }} />);
  expect(markup).toContain('topping-black-pearl');
});

it('renders foam without solid topping pieces', () => {
  const markup = renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), topping: 'cheese-foam' }} />);
  expect(markup).toContain('tea-cup-foam');
  expect(markup).not.toContain('class="tea-cup-topping"');
});
it('increases the visible ice count with the selected percentage', () => {
  const low = renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), ice: 0 }} />);
  const high = renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), ice: 90 }} />);
  expect((low.match(/class="tea-cup-ice"/g) ?? []).length).toBe(0);
  expect((high.match(/class="tea-cup-ice"/g) ?? []).length).toBe(3);
});
