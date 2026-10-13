import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import {
  canChooseWeekFive, chooseWeekFive, getWeekFiveCallback,
  getWeekFiveDecision, getWeekFiveEpisode,
} from './weekFiveEpisodes';

function ready(day: number) {
  let game = createInitialState();
  for (let n = 1; n < day; n++) game = nextDay(game);
  return chooseBreakfast(wakeMorning(game), 'skip');
}
describe('playable chapter five days 31–37', () => {
  it('renders seven stories on the real preparation screen', () => {
    for (let day = 31; day <= 37; day++) expect(getWeekFiveEpisode(ready(day))).not.toBeNull();
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game: ready(31), onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Câu chuyện chương năm');
    expect(html).toContain('Cùng Thảo sửa biển');
  });
  it('provides a zero-cash fallback for each day', () => {
    for (let day = 31; day <= 37; day++) {
      const before = { ...ready(day), cash: 0 };
      expect(canChooseWeekFive(before, 'message')).toBe(true);
      expect(chooseWeekFive(before, 'message').cash).toBe(0);
    }
  });
  it('respects appointment times and allows rescheduling', () => {
    const base = ready(32);
    const late = { ...base, city: { ...base.city, minutes: 590 } };
    expect(canChooseWeekFive(late, 'meet')).toBe(false);
    expect(canChooseWeekFive(late, 'message')).toBe(true);
  });
  it('persists the choice and callback after reload', () => {
    const before = ready(31);
    const after = chooseWeekFive(before, 'meet');
    expect(after.cash).toBe(before.cash - 12000);
    const loaded = JSON.parse(JSON.stringify(after)) as typeof after;
    expect(getWeekFiveDecision(loaded)).toBe('meet');
    expect(chooseWeekFive(loaded, 'message')).toBe(loaded);
    expect(getWeekFiveCallback(nextDay(after))).toContain('Thảo nhắn bản phác thảo');
  });
  it('prevents choosing before breakfast or after opening', () => {
    const game = ready(37);
    const awake = { ...game, morning: { ...game.morning, step: 'awake' as const } };
    expect(chooseWeekFive(awake, 'meet')).toBe(awake);
    const open = { ...game, phase: 'open' as const };
    expect(chooseWeekFive(open, 'message')).toBe(open);
  });
  it('retains chapter-five callback into day 38', () => {
    const next = nextDay(chooseWeekFive(ready(37), 'message'));
    expect(getWeekFiveEpisode(next)).toBeNull();
    expect(getWeekFiveCallback(next)).toContain('Bác Bình');
  });
});
