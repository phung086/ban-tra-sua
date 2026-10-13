import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { WeekFourEpisodePanel } from '../../components/life/WeekFourEpisodePanel';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import {
  canChooseWeekFour, chooseWeekFour, getWeekFourCallback,
  getWeekFourDecision, getWeekFourEpisode,
} from './weekFourEpisodes';

function ready(day: number) {
  let game = createInitialState();
  for (let current = 1; current < day; current++) game = nextDay(game);
  return chooseBreakfast(wakeMorning(game), 'skip');
}

describe('chapter four playable days 22–24', () => {
  it('has three distinct day stories and no phantom chapter outside range', () => {
    const episodes = [22, 23, 24].map(day => getWeekFourEpisode(ready(day)));
    expect(episodes.every(Boolean)).toBe(true);
    expect(new Set(episodes.map(episode => episode?.title)).size).toBe(3);
    expect(getWeekFourEpisode(ready(21))).toBeNull();
    expect(getWeekFourEpisode(ready(25))).toBeNull();
  });

  it('connects the new chapter to the actual pre-shop screen', () => {
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game: ready(22), onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Câu chuyện tuần bốn');
    expect(html).toContain('Con đường ra ngoại ô');
    expect(html).toContain('Hẹn ở trạm xe');
    expect(html).toContain('Mở cửa tiệm');
  });

  it('blocks choices until breakfast and outside preparation phase', () => {
    const before = ready(22);
    const awake = { ...before, morning: { ...before.morning, step: 'awake' as const } };
    expect(canChooseWeekFour(awake, 'takeTime')).toBe(false);
    expect(chooseWeekFour(awake, 'takeTime')).toBe(awake);
    const open = { ...before, phase: 'open' as const };
    expect(canChooseWeekFour(open, 'keepSimple')).toBe(false);
    expect(chooseWeekFour(open, 'keepSimple')).toBe(open);
  });

  it('charges travel once and remembers it after JSON save roundtrip', () => {
    const before = ready(22);
    const after = chooseWeekFour(before, 'takeTime');
    expect(after.cash).toBe(before.cash - 6000);
    expect(after.city.minutes).toBe(before.city.minutes + 18);
    const loaded = JSON.parse(JSON.stringify(after)) as typeof after;
    const restored = { ...loaded, morning: hydrateMorning(loaded.morning, { day: loaded.day, city: loaded.city }, loaded.phase) };
    expect(getWeekFourDecision(restored)).toBe('takeTime');
    expect(chooseWeekFour(restored, 'takeTime')).toBe(restored);
    expect(chooseWeekFour(restored, 'keepSimple')).toBe(restored);
  });

  it('offers a zero-cash alternative without charging', () => {
    const before = { ...ready(23), cash: 0 };
    expect(canChooseWeekFour(before, 'takeTime')).toBe(false);
    expect(canChooseWeekFour(before, 'keepSimple')).toBe(true);
    const html = renderToStaticMarkup(createElement(WeekFourEpisodePanel, { game: before, onGame: () => undefined }));
    expect(html).toContain('Không đủ tiền');
    const after = chooseWeekFour(before, 'keepSimple');
    expect(after.cash).toBe(0);
    expect(getWeekFourDecision(after)).toBe('keepSimple');
  });

  it('caps satiety and deducts cooking money, time and energy once', () => {
    const before = ready(24);
    const game = { ...before, morning: { ...before.morning, satiety: 90 } };
    const after = chooseWeekFour(game, 'takeTime');
    expect(after.morning.satiety).toBe(100);
    expect(after.cash).toBe(game.cash - 26000);
    expect(after.city.minutes).toBe(game.city.minutes + 35);
    expect(after.city.energy).toBe(game.city.energy - 5);
    expect(chooseWeekFour(after, 'takeTime')).toBe(after);
  });

  it('changes day-23 dialogue and shows a day-22 callback', () => {
    const tomorrow = nextDay(chooseWeekFour(ready(22), 'takeTime'));
    expect(getWeekFourEpisode(tomorrow)?.prompt).toContain('chuyến hẹn ở trạm xe');
    expect(getWeekFourCallback(tomorrow)).toContain('Bác Minh');
  });

  it('uses bill payment to change day 24 and remembers through day 25', () => {
    const day24 = nextDay(chooseWeekFour(ready(23), 'takeTime'));
    expect(getWeekFourEpisode(day24)?.prompt).toContain('Hóa đơn đã thanh toán');
    const day25 = nextDay(chooseWeekFour(day24, 'keepSimple'));
    expect(getWeekFourCallback(day25)).toContain('Mẹ Mai vui');
    const html = renderToStaticMarkup(createElement(WeekFourEpisodePanel, { game: day25, onGame: () => undefined }));
    expect(html).toContain('Mẹ Mai vui');
    expect(html).not.toContain('CHƯƠNG 4 · NGÀY 25');
  });

  it('recovers choice from story log if legacy save lost reward ledger', () => {
    const after = chooseWeekFour(ready(23), 'keepSimple');
    const legacy = { ...after, relationshipRewardIds: [] };
    expect(getWeekFourDecision(legacy)).toBe('keepSimple');
    expect(chooseWeekFour(legacy, 'takeTime')).toBe(legacy);
  });
});
