import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { createInitialState, nextDay } from '../engine';
import type { GameState } from '../types';
import { chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import { chooseDayEpisode, getDayEpisode, getEpisodeCallback } from './dayEpisodes';

const playMorning = (day: number): GameState => {
  let game = createInitialState();
  for (let current = 1; current < day; current++) game = nextDay(game);
  return chooseBreakfast(wakeMorning(game), 'skip');
};

describe('playable first-week neighborhood day episodes', () => {
  it('offers six distinct chapters on days 2–7 and leaves other days as calm days', () => {
    expect(getDayEpisode(1)).toBeNull();
    expect(getDayEpisode(8)).toBeNull();
    const beats = [2, 3, 4, 5, 6, 7].map(day => getDayEpisode(day));
    expect(beats.every(Boolean)).toBe(true);
    expect(new Set(beats.map(beat => beat?.characterId)).size).toBe(6);
  });

  it('connects the actual pre-shop React UI to the day choice', () => {
    const game = playMorning(2);
    const html = renderToStaticMarkup(createElement(MorningRoutine, { game, onGame: () => undefined }));
    expect(html).toContain('Trang sổ ở hiệu sách');
    expect(html).toContain('Giúp Nam tìm sổ');
    expect(html).toContain('Xin phép về mở tiệm');
    expect(html).toContain('CÂU CHUYỆN NGÀY');
  });

  it('applies time, energy, goodwill and a durable story moment exactly once', () => {
    const game = playMorning(2);
    const beat = getDayEpisode(2)!;
    const helped = chooseDayEpisode(game, 'help');
    expect(helped.city.minutes).toBe(game.city.minutes + beat.minutes);
    expect(helped.city.energy).toBe(game.city.energy - beat.energy);
    expect(helped.city.goodwill).toBe(game.city.goodwill + beat.goodwill);
    expect(helped.cash).toBe(game.cash);
    expect(helped.morning.episodeChoice).toBe('help');
    expect(helped.storyLog.some(item => item.id === 'day-episode-2-help')).toBe(true);
    expect(chooseDayEpisode(helped, 'help')).toBe(helped);
    expect(chooseDayEpisode(helped, 'focus')).toBe(helped);
  });

  it('lets a tired player decline the request without a softlock', () => {
    const game = playMorning(2);
    const tired = { ...game, city: { ...game.city, energy: 0 } };
    expect(chooseDayEpisode(tired, 'help').morning.episodeChoice).toBeNull();
    const focused = chooseDayEpisode(tired, 'focus');
    expect(focused.morning.episodeChoice).toBe('focus');
    expect(focused.city.energy).toBe(0);
    expect(focused.city.minutes).toBe(game.city.minutes);
    expect(focused.city.goodwill).toBe(game.city.goodwill);
  });

  it('restores a recorded choice through the existing v3 save hydration', () => {
    const helped = chooseDayEpisode(playMorning(4), 'help');
    const saved = JSON.parse(JSON.stringify(helped.morning)) as unknown;
    const hydrated = hydrateMorning(saved, { day: helped.day, city: helped.city }, 'prep');
    expect(hydrated.episodeChoice).toBe('help');
    expect(chooseDayEpisode({ ...helped, morning: hydrated }, 'help').storyLog).toHaveLength(helped.storyLog.length);
  });

  it('shows remembered help on the following day, without replaying rewards', () => {
    const helped = chooseDayEpisode(playMorning(2), 'help');
    const tomorrow = nextDay(helped);
    expect(tomorrow.day).toBe(3);
    expect(tomorrow.morning.episodeChoice).toBeNull();
    expect(getEpisodeCallback(tomorrow)).toContain('Nam nhắn cảm ơn');
    const html = renderToStaticMarkup(createElement(MorningRoutine, { game: tomorrow, onGame: () => undefined }));
    expect(html).toContain('Nam nhắn cảm ơn');
    expect(tomorrow.city.goodwill).toBe(helped.city.goodwill);
    expect(getEpisodeCallback(nextDay(chooseDayEpisode(playMorning(2), 'focus')))).toBeNull();
  });
});
