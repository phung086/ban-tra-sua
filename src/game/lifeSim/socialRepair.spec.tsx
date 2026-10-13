import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState, nextDay } from '../engine';
import { wakeMorning, chooseBreakfast } from './morning';
import { chooseSocialMorning } from './socialMorning';
import { canChooseSocialRepair, chooseSocialRepair, getSocialRepair, getSocialRepairCallback } from './socialRepair';

function lateDay() {
  const first = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
  const invited = { ...first, morning: { ...first.morning,
    plan: { ...first.morning.plan, socialHook: 'friend-invite' as const } } };
  let game = chooseSocialMorning(invited, 'reply');
  for (let day = 2; day <= 5; day++) game = nextDay(game);
  return chooseBreakfast(wakeMorning(game), 'skip');
}

describe('social reconciliation', () => {
  it('offers an actionable overdue invitation in the real shop UI', () => {
    const game = lateDay();
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game, onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Lan vẫn đợi một lời hẹn');
    expect(html).toContain('Dành ít phút gọi Lan');
    expect(getSocialRepair(game)?.daysLate).toBe(4);
  });

  it('charges no money and prevents duplicate rewards after reload', () => {
    const game = lateDay();
    const chosen = chooseSocialRepair(game, 'talk');
    expect(chosen.cash).toBe(game.cash);
    expect(chosen.city.minutes).toBe(game.city.minutes + 10);
    expect(chosen.city.goodwill).toBe(game.city.goodwill + 3);
    const loaded = JSON.parse(JSON.stringify(chosen)) as typeof chosen;
    expect(chooseSocialRepair(loaded, 'talk')).toBe(loaded);
    expect(getSocialRepairCallback(nextDay(loaded))).toContain('Cảm ơn cậu đã gọi');
  });

  it('never traps a tired or late player and expires after day six', () => {
    const game = lateDay();
    const late = { ...game, city: { ...game.city, minutes: 1200, energy: 0 } };
    expect(canChooseSocialRepair(late, 'talk')).toBe(false);
    expect(canChooseSocialRepair(late, 'honest')).toBe(true);
    expect(chooseSocialRepair(late, 'honest').city.minutes).toBe(1200);
    expect(getSocialRepair(nextDay(game))).not.toBeNull();
    expect(getSocialRepair(nextDay(nextDay(game)))).toBeNull();
  });
});
