import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FriendMealPanel } from '../../components/life/FriendMealPanel';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { chooseThaoMenu } from './thaoMenu';

const ready = () => chooseBreakfast(wakeMorning(nextDay(createInitialState())), 'skip');
const tomorrow = (game: ReturnType<typeof ready>) =>
  chooseBreakfast(wakeMorning(nextDay(game)), 'skip');
const renderLivePrep = (game: ReturnType<typeof ready>) =>
  renderToStaticMarkup(createElement(FriendMealPanel, { game, onGame: () => undefined }));

describe('Thao menu mounted in real prep flow', () => {
  it('shows a bookable menu invitation after breakfast on day two', () => {
    const day2 = ready();
    expect(renderLivePrep(day2)).toContain('Bảng thực đơn cùng Thảo');
    expect(renderLivePrep(day2)).toContain('Hẹn Thảo làm bảng thực đơn');
    const booked = chooseThaoMenu(day2, 'book');
    expect(renderLivePrep(booked)).toContain('Đã lưu quyết định');
    expect(chooseThaoMenu(booked, 'book')).toBe(booked);
  });

  it('keeps the booked appointment through JSON save and offers a free choice on day three', () => {
    const booked = chooseThaoMenu(ready(), 'book');
    const restored = JSON.parse(JSON.stringify(booked)) as typeof booked;
    const day3 = tomorrow(restored);
    expect(renderLivePrep(day3)).toContain('In bảng rõ giá');
    const broke = { ...day3, cash: 0 };
    expect(renderLivePrep(broke)).toContain('Viết bảng tay');
    const written = chooseThaoMenu(broke, 'handwrite');
    expect(written.cash).toBe(0);
    expect(written.fans).toBe(broke.fans + 1);
    expect(chooseThaoMenu(written, 'print')).toBe(written);
    expect(renderLivePrep(tomorrow(written))).toContain('Tự làm vẫn đẹp');
  });
});
