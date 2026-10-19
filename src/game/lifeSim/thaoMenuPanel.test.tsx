import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { ThaoMenuPanel } from '../../components/life/ThaoMenuPanel';
import { chooseThaoMenu, getThaoMenuStage } from './thaoMenu';

const ready = () => chooseBreakfast(wakeMorning(nextDay(createInitialState())), 'skip');
const nextMorning = (game: ReturnType<typeof ready>) =>
  chooseBreakfast(wakeMorning(nextDay(game)), 'skip');
const markup = (game: ReturnType<typeof ready>) =>
  renderToStaticMarkup(createElement(ThaoMenuPanel, { game, onGame: () => undefined }));

describe('Thao menu panel', () => {
  it('shows the real day-two booking choice and remembers booking after serialization', () => {
    const day2 = ready();
    expect(getThaoMenuStage(day2)).toBe('invite');
    expect(markup(day2)).toContain('Hẹn Thảo làm bảng thực đơn');
    const booked = chooseThaoMenu(day2, 'book');
    const restored = JSON.parse(JSON.stringify(booked)) as typeof booked;
    expect(markup(restored)).toContain('Đã lưu quyết định');
    expect(markup(nextMorning(restored))).toContain('In bảng rõ giá');
  });

  it('shows a free fallback when the player cannot afford printing', () => {
    const day3 = nextMorning(chooseThaoMenu(ready(), 'book'));
    const broke = { ...day3, cash: 0 };
    expect(markup(broke)).toContain('Chưa đủ tiền');
    expect(markup(broke)).toContain('Viết bảng tay');
    const handwritten = chooseThaoMenu(broke, 'handwrite');
    expect(handwritten.cash).toBe(0);
    expect(handwritten.fans).toBe(broke.fans + 1);
    expect(markup(handwritten)).toContain('Đã lưu quyết định');
  });

  it('keeps zero-energy postpone available without granting fans', () => {
    const day3 = nextMorning(chooseThaoMenu(ready(), 'book'));
    const exhausted = { ...day3, city: { ...day3.city, energy: 0, minutes: 1260 } };
    expect(markup(exhausted)).toContain('giữ bảng cũ');
    const postponed = chooseThaoMenu(exhausted, 'later');
    expect(postponed.fans).toBe(exhausted.fans);
    expect(markup(nextMorning(postponed))).toContain('tuần sau');
  });
});
