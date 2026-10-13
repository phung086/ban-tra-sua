import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import {
  canChooseWeekSix, chooseWeekSix, getWeekSixCallback,
  getWeekSixDecision, getWeekSixEpisode, getWeekSixRecap,
} from './weekSixEpisodes';

function ready(day: number) {
  let game = createInitialState();
  for (let n = 1; n < day; n++) game = nextDay(game);
  return chooseBreakfast(wakeMorning(game), 'skip');
}

describe('playable chapter six days 38–44', () => {
  it('renders seven distinct days in the actual shop preparation UI', () => {
    const titles = new Set<string>();
    for (let day = 38; day <= 44; day++) {
      const episode = getWeekSixEpisode(ready(day));
      expect(episode).not.toBeNull();
      titles.add(episode!.title);
      const html = renderToStaticMarkup(createElement(PrepWorld, {
        game: ready(day), onGame: () => undefined, onNavigate: () => undefined,
      }));
      expect(html).toContain(episode!.title);
      expect(html).toContain('Mở cửa tiệm');
    }
    expect(titles.size).toBe(7);
    expect(getWeekSixEpisode(ready(45))).toBeNull();
  });

  it('allows a free message on every day with zero cash and low energy', () => {
    for (let day = 38; day <= 44; day++) {
      const base = ready(day);
      const poor = { ...base, cash: 0, city: { ...base.city, energy: 0, minutes: 1260 } };
      expect(canChooseWeekSix(poor, 'message')).toBe(true);
      const chosen = chooseWeekSix(poor, 'message');
      expect(chosen.cash).toBe(0);
      expect(getWeekSixDecision(chosen)).toBe('message');
    }
  });

  it('blocks late appointments but never blocks free rescheduling', () => {
    const base = ready(43);
    const late = { ...base, city: { ...base.city, minutes: 600 } };
    expect(canChooseWeekSix(late, 'meet')).toBe(false);
    expect(canChooseWeekSix(late, 'message')).toBe(true);
    expect(chooseWeekSix(late, 'meet').notice).toContain('qua giờ hẹn');
  });

  it('stocks real sugar for brewing on day 40, charges only once, survives save reload', () => {
    const before = ready(40);
    const after = chooseWeekSix(before, 'meet');
    expect(after.cash).toBe(before.cash - 12000);
    expect(after.inventory.sugar).toBe(before.inventory.sugar + 4);
    expect(after.city.minutes).toBe(before.city.minutes + 20);
    const loaded = JSON.parse(JSON.stringify(after)) as typeof after;
    const restored = { ...loaded, morning: hydrateMorning(loaded.morning, {
      day: loaded.day, city: loaded.city,
    }, loaded.phase) };
    expect(getWeekSixDecision(restored)).toBe('meet');
    expect(chooseWeekSix(restored, 'meet')).toBe(restored);
    expect(chooseWeekSix(restored, 'message')).toBe(restored);
    expect(getWeekSixCallback(nextDay(restored))).toContain('Cô Hạnh');
  });

  it('changes dialogue after the market purchase and remembers a prior chapter', () => {
    const purchased = chooseWeekSix(ready(40), 'meet');
    const day41 = { ...ready(41), relationshipRewardIds: purchased.relationshipRewardIds };
    expect(getWeekSixEpisode(day41)?.prompt).toContain('mua đường dự phòng');
    const prior = { ...ready(38), relationshipRewardIds: ['week-five-37-meet'] };
    expect(getWeekSixEpisode(prior)?.prompt).toContain('Bác Bình');
  });

  it('does not allow choices before breakfast or after shop opens', () => {
    const before = ready(42);
    const asleep = { ...before, morning: { ...before.morning, step: 'awake' as const } };
    const opened = { ...before, phase: 'open' as const };
    expect(chooseWeekSix(asleep, 'message')).toBe(asleep);
    expect(chooseWeekSix(opened, 'meet')).toBe(opened);
  });

  it('keeps customer feedback and festival fan rewards exactly once', () => {
    for (const [day, fans] of [[41, 1], [44, 2]] as const) {
      const before = ready(day);
      const after = chooseWeekSix(before, 'meet');
      expect(after.fans).toBe(before.fans + fans);
      expect(chooseWeekSix(after, 'meet')).toBe(after);
    }
  });

  it('summarizes persistent business and social decisions on day 44', () => {
    const market = chooseWeekSix(ready(40), 'meet');
    const friend = chooseWeekSix({ ...ready(42), relationshipRewardIds: market.relationshipRewardIds }, 'message');
    const festival = chooseWeekSix({ ...ready(44), relationshipRewardIds: friend.relationshipRewardIds }, 'meet');
    const recap = getWeekSixRecap(festival);
    expect(recap).toContain('chuẩn bị đường');
    expect(recap).toContain('không tốn tiền');
    expect(recap).toContain('Góc phố sạch');
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game: festival, onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Tổng kết tuần');
  });

  it('keeps the final NPC callback into day 45', () => {
    const after = chooseWeekSix(ready(44), 'message');
    expect(getWeekSixCallback(nextDay(after))).toContain('Bác Bình');
  });
});
