import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WeekThreeEpisodePanel } from '../../components/life/WeekThreeEpisodePanel';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import {
  canChooseWeekThree, chooseWeekThree, getWeekThreeCallback,
  getWeekThreeDecision, getWeekThreeEpisode,
} from './weekThreeEpisodes';

function ready(day: number) {
  let game = createInitialState();
  for (let current = 1; current < day; current++) game = nextDay(game);
  return chooseBreakfast(wakeMorning(game), 'skip');
}

describe('week-three playable day 15–21', () => {
  it('has seven distinct episodes and calm days outside the chapter', () => {
    const episodes = Array.from({ length: 7 }, (_, i) => getWeekThreeEpisode(ready(i + 15)));
    expect(episodes.every(Boolean)).toBe(true);
    expect(new Set(episodes.map(item => item?.title)).size).toBe(7);
    expect(getWeekThreeEpisode(ready(14))).toBeNull();
    expect(getWeekThreeEpisode(ready(22))).toBeNull();
  });

  it('renders interactive choices in the actual preparation screen', () => {
    const game = ready(15);
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game, onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Câu chuyện tuần ba');
    expect(html).toContain('Cơn mỏi vai');
    expect(html).toContain('Nghỉ ngơi 30 phút');
    expect(html).toContain('Mở cửa tiệm');
  });

  it('does not expose day choices before breakfast', () => {
    const game = ready(18);
    const awake = { ...game, morning: { ...game.morning, step: 'awake' as const } };
    const html = renderToStaticMarkup(createElement(WeekThreeEpisodePanel, { game: awake, onGame: () => undefined }));
    expect(html).not.toContain('Uống trà và nghỉ 40 phút');
    expect(canChooseWeekThree(awake, 'care')).toBe(false);
    expect(chooseWeekThree(awake, 'care')).toBe(awake);
  });

  it('rest on day 15 restores energy within the cap', () => {
    const game = ready(15);
    const before = { ...game, city: { ...game.city, energy: 90 } };
    const after = chooseWeekThree(before, 'care');
    expect(after.city.energy).toBe(100);
    expect(after.city.minutes).toBe(before.city.minutes + 30);
    expect(after.storyLog[0].id).toBe('week-three-15-care');
  });

  it('charges Duy meal exactly once after save JSON roundtrip', () => {
    const before = ready(16);
    const after = chooseWeekThree(before, 'care');
    expect(after.cash).toBe(before.cash - 22000);
    const loaded = JSON.parse(JSON.stringify(after)) as typeof after;
    const restored = { ...loaded, morning: hydrateMorning(loaded.morning, { day: loaded.day, city: loaded.city }, loaded.phase) };
    expect(getWeekThreeDecision(restored)).toBe('care');
    expect(chooseWeekThree(restored, 'care')).toBe(restored);
    expect(chooseWeekThree(restored, 'focus')).toBe(restored);
  });

  it('allows a zero-cash fallback and shows it on screen', () => {
    const before = { ...ready(17), cash: 0 };
    expect(canChooseWeekThree(before, 'care')).toBe(false);
    expect(canChooseWeekThree(before, 'focus')).toBe(true);
    const html = renderToStaticMarkup(createElement(WeekThreeEpisodePanel, { game: before, onGame: () => undefined }));
    expect(html).toContain('Không đủ tiền');
    const after = chooseWeekThree(before, 'focus');
    expect(after.cash).toBe(0);
    expect(getWeekThreeDecision(after)).toBe('focus');
  });

  it('does not duplicate reserve ice after repeat clicks', () => {
    const before = ready(20);
    const after = chooseWeekThree(before, 'care');
    expect(after.inventory.ice).toBe(before.inventory.ice + 4);
    expect(chooseWeekThree(after, 'care')).toBe(after);
  });

  it('remembers both decisions and renders next-day NPC dialogue', () => {
    const accepted = nextDay(chooseWeekThree(ready(20), 'care'));
    const declined = nextDay(chooseWeekThree(ready(20), 'focus'));
    expect(getWeekThreeCallback(accepted)).toContain('Bố Quang');
    expect(getWeekThreeCallback(declined)).toContain('Khách cảm ơn');
    const html = renderToStaticMarkup(createElement(WeekThreeEpisodePanel, { game: accepted, onGame: () => undefined }));
    expect(html).toContain('Bố Quang hỏi thùng đá');
  });

  it('recovers memory from the story log when an old save has no reward ledger', () => {
    const after = chooseWeekThree(ready(19), 'focus');
    const oldSave = { ...after, relationshipRewardIds: [] };
    expect(getWeekThreeDecision(oldSave)).toBe('focus');
    expect(chooseWeekThree(oldSave, 'care')).toBe(oldSave);
  });

  it('keeps day 21 callback visible on day 22 without an episode', () => {
    const tomorrow = nextDay(chooseWeekThree(ready(21), 'focus'));
    const html = renderToStaticMarkup(createElement(WeekThreeEpisodePanel, { game: tomorrow, onGame: () => undefined }));
    expect(html).toContain('Cô Hạnh cảm ơn');
    expect(html).not.toContain('CHƯƠNG 3 · NGÀY 22');
  });
});
