import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';

describe('social morning UI integration', () => {
  it('shows Lan choice with price before shop opening', () => {
    const base = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
    const game = { ...base, morning: { ...base.morning, plan: {
      ...base.morning.plan, socialHook: 'friend-invite' as const, streetHook: 'none' as const,
    } } };
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game, onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Lan rủ ghé chợ hoa');
    expect(html).toContain('16.000');
    expect(html).toContain('Mở cửa tiệm');
  });
});
