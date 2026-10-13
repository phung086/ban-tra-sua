import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { WeekFourEpisodePanel } from '../../components/life/WeekFourEpisodePanel';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import {
  canChooseWeekFour, chooseWeekFour, getWeekFourCallback,
  getWeekFourDecision, getWeekFourEpisode, getWeekFourMilestone,
} from './weekFourEpisodes';

function ready(day: number) {
  let game = createInitialState();
  for (let current = 1; current < day; current++) game = nextDay(game);
  return chooseBreakfast(wakeMorning(game), 'skip');
}

describe('chapter four playable days 22–30', () => {
  it('has six distinct day stories and no phantom chapter outside range', () => {
    const episodes = [22, 23, 24, 25, 26, 27].map(day => getWeekFourEpisode(ready(day)));
    expect(episodes.every(Boolean)).toBe(true);
    expect(new Set(episodes.map(episode => episode?.title)).size).toBe(6);
    expect(getWeekFourEpisode(ready(21))).toBeNull();
    expect(getWeekFourEpisode(ready(31))).toBeNull();
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
    const day24Ready = chooseBreakfast(wakeMorning(day24), 'skip');
    const day25 = nextDay(chooseWeekFour(day24Ready, 'keepSimple'));
    expect(getWeekFourCallback(day25)).toContain('Mẹ Mai vui');
    const html = renderToStaticMarkup(createElement(WeekFourEpisodePanel, { game: chooseBreakfast(wakeMorning(day25), 'skip'), onGame: () => undefined }));
    expect(html).toContain('Mẹ Mai vui');
    expect(html).toContain('CHƯƠNG 4 · NGÀY 25');
  });

  it('recovers choice from story log if legacy save lost reward ledger', () => {
    const after = chooseWeekFour(ready(23), 'keepSimple');
    const legacy = { ...after, relationshipRewardIds: [] };
    expect(getWeekFourDecision(legacy)).toBe('keepSimple');
    expect(chooseWeekFour(legacy, 'takeTime')).toBe(legacy);
  });
  it('renders friend plans on day 25 in the actual preparation UI', () => {
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game: ready(25), onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Bạn đã có hẹn khác');
    expect(html).toContain('Hẹn lại cả nhóm');
    expect(html).toContain('Mở cửa tiệm');
  });

  it('day 25 allows free rescheduling and remembers the plan after reload', () => {
    const before = { ...ready(25), cash: 0 };
    expect(canChooseWeekFour(before, 'takeTime')).toBe(false);
    expect(canChooseWeekFour(before, 'keepSimple')).toBe(true);
    const chosen = chooseWeekFour(before, 'keepSimple');
    const loaded = JSON.parse(JSON.stringify(chosen)) as typeof chosen;
    expect(loaded.cash).toBe(0);
    expect(getWeekFourDecision(loaded)).toBe('keepSimple');
    expect(chooseWeekFour(loaded, 'takeTime')).toBe(loaded);
    const next = nextDay(chosen);
    expect(getWeekFourCallback(next)).toContain('Lan đã nhắn Thảo');
  });

  it('day 26 uses the day 22 transit memory without unlocking an unbuilt map', () => {
    const traveled = chooseWeekFour(ready(22), 'takeTime');
    const day26 = { ...ready(26), relationshipRewardIds: traveled.relationshipRewardIds };
    expect(getWeekFourEpisode(day26)?.prompt).toContain('Nhớ điểm hẹn trạm xe');
    const safe = chooseWeekFour({ ...day26, cash: 0 }, 'keepSimple');
    expect(safe.cash).toBe(0);
    expect(safe.storyLog[0].id).toBe('week-four-26-keepSimple');
    expect(getWeekFourCallback(nextDay(safe))).toContain('Bác Minh');
  });

  it('day 27 birthday remembers the rescheduled group and charges a gift once', () => {
    const previous = chooseWeekFour(ready(25), 'keepSimple');
    const birthday = { ...ready(27), relationshipRewardIds: previous.relationshipRewardIds };
    expect(getWeekFourEpisode(birthday)?.prompt).toContain('Nhóm bạn đã hẹn lại');
    const gifted = chooseWeekFour(birthday, 'takeTime');
    expect(gifted.cash).toBe(birthday.cash - 24000);
    const loaded = JSON.parse(JSON.stringify(gifted)) as typeof gifted;
    expect(getWeekFourDecision(loaded)).toBe('takeTime');
    expect(chooseWeekFour(loaded, 'takeTime')).toBe(loaded);
    expect(getWeekFourCallback(nextDay(gifted))).toContain('Thảo đặt món trà');
  });

  it('birthday card remains available for zero cash', () => {
    const before = { ...ready(27), cash: 0 };
    const after = chooseWeekFour(before, 'keepSimple');
    expect(after.cash).toBe(0);
    expect(after.city.minutes).toBe(before.city.minutes + 8);
    expect(after.city.goodwill).toBe(before.city.goodwill + 2);
  });

  it('renders playable days 28, 29 and 30 inside PrepWorld', () => {
    for (const [day, title] of [[28, 'Một ngày buồn'], [29, 'Gió từ phương xa'], [30, 'Tiệm còn sáng đèn']] as const) {
      const html = renderToStaticMarkup(createElement(PrepWorld, {
        game: ready(day), onGame: () => undefined, onNavigate: () => undefined,
      }));
      expect(html).toContain(title);
      expect(html).toContain('Mở cửa tiệm');
    }
    expect(getWeekFourEpisode(ready(31))).toBeNull();
  });

  it('day 28 rest is free, restores energy and survives save/reload once', () => {
    const before = { ...ready(28), cash: 0, city: { ...ready(28).city, energy: 40 } };
    const after = chooseWeekFour(before, 'takeTime');
    expect(after.cash).toBe(0);
    expect(after.city.energy).toBe(55);
    expect(after.city.minutes).toBe(before.city.minutes + 20);
    const loaded = JSON.parse(JSON.stringify(after)) as typeof after;
    expect(getWeekFourDecision(loaded)).toBe('takeTime');
    expect(chooseWeekFour(loaded, 'takeTime')).toBe(loaded);
    expect(getWeekFourCallback(nextDay(after))).toContain('Mẹ Mai');
  });

  it('day 29 does not unlock an unbuilt city and has a free alternative', () => {
    const before = { ...ready(29), cash: 0 };
    expect(canChooseWeekFour(before, 'takeTime')).toBe(false);
    expect(canChooseWeekFour(before, 'keepSimple')).toBe(true);
    const after = chooseWeekFour(before, 'keepSimple');
    expect(after.cash).toBe(0);
    expect(getWeekFourDecision(after)).toBe('keepSimple');
    expect(getWeekFourCallback(nextDay(after))).toContain('Lan');
  });

  it('day 30 month recap reflects earlier choices and remains saved', () => {
    const rested = chooseWeekFour(ready(28), 'takeTime');
    const planned = chooseWeekFour({ ...ready(29), relationshipRewardIds: rested.relationshipRewardIds }, 'keepSimple');
    const before = { ...ready(30), cash: 0, relationshipRewardIds: planned.relationshipRewardIds };
    expect(getWeekFourMilestone(before)).toContain('nghỉ ngơi');
    expect(getWeekFourMilestone(before)).toContain('hẹn lịch');
    const after = chooseWeekFour(before, 'keepSimple');
    const html = renderToStaticMarkup(createElement(WeekFourEpisodePanel, { game: after, onGame: () => undefined }));
    expect(html).toContain('Tổng kết tháng đầu');
    expect(html).toContain('Lời cảm ơn cuối tháng');
    const loaded = JSON.parse(JSON.stringify(after)) as typeof after;
    expect(getWeekFourDecision(loaded)).toBe('keepSimple');
    expect(chooseWeekFour(loaded, 'takeTime')).toBe(loaded);
    expect(getWeekFourCallback(nextDay(after))).toContain('Cô Hạnh');
  });
});
