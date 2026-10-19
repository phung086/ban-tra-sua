import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FriendMealPanel } from '../../components/life/FriendMealPanel';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { chooseBreakfast, wakeMorning } from './morning';
import { chooseThaoMenu, getThaoMenuSign } from './thaoMenu';

const ready = () => chooseBreakfast(wakeMorning(nextDay(createInitialState())), 'skip');
const tomorrow = (game: ReturnType<typeof ready>) =>
  chooseBreakfast(wakeMorning(nextDay(game)), 'skip');
const renderLivePrep = (game: ReturnType<typeof ready>) =>
  renderToStaticMarkup(createElement(FriendMealPanel, { game, onGame: () => undefined }));

describe('Thao menu mounted in real prep flow', () => {
  const storage = new Map<string, string>();
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows a bookable menu invitation after breakfast on day two', () => {
    const day2 = ready();
    expect(renderLivePrep(day2)).toContain('Bảng thực đơn cùng Thảo');
    expect(renderLivePrep(day2)).toContain('Hẹn Thảo làm bảng thực đơn');
    const booked = chooseThaoMenu(day2, 'book');
    expect(renderLivePrep(booked)).toContain('Đã lưu quyết định');
    expect(chooseThaoMenu(booked, 'book')).toBe(booked);
  });

  it('keeps the booked appointment through save v3 and offers a free choice on day three', () => {
    const booked = chooseThaoMenu(ready(), 'book');
    saveGame(booked);
    const day3 = tomorrow(loadGame());
    expect(renderLivePrep(day3)).toContain('In bảng rõ giá');
    const broke = { ...day3, cash: 0 };
    expect(renderLivePrep(broke)).toContain('Viết bảng tay');
    const written = chooseThaoMenu(broke, 'handwrite');
    expect(written.cash).toBe(0);
    expect(written.fans).toBe(broke.fans + 1);
    expect(chooseThaoMenu(written, 'print')).toBe(written);
    expect(renderLivePrep(tomorrow(written))).toContain('Tự làm vẫn đẹp');
  });

  it('keeps the real-price sign visible on later days without replaying fans', () => {
    const day3 = tomorrow(chooseThaoMenu(ready(), 'book'));
    const printed = chooseThaoMenu(day3, 'print');
    expect(printed.cash).toBe(day3.cash - 24000);
    expect(printed.fans).toBe(day3.fans + 3);
    saveGame(printed);
    const restored = loadGame();
    expect(getThaoMenuSign(restored)).toEqual({ day: 3, kind: 'print', label: 'Bảng in rõ giá' });
    const day4 = tomorrow(restored);
    const html = renderLivePrep(day4);
    expect(html).toContain('Bảng giá trước cửa tiệm');
    expect(html).toContain('Trà sữa truyền thống');
    expect(html).toContain('28.000');
    expect(html).toContain('Bảng in rõ giá');
    expect(day4.fans).toBe(printed.fans);
    expect(chooseThaoMenu(printed, 'handwrite')).toBe(printed);
  });

  it('does not spoil the sign before waking and ignores corrupt or future ledger entries', () => {
    const printed = chooseThaoMenu(tomorrow(chooseThaoMenu(ready(), 'book')), 'print');
    const day4 = tomorrow(printed);
    const asleep = { ...day4, morning: { ...day4.morning, step: 'asleep' as const } };
    expect(renderLivePrep(asleep)).not.toContain('Bảng giá trước cửa tiệm');
    const corrupted = { ...printed, relationshipRewardIds: [...printed.relationshipRewardIds,
      'thao-menu-9999-handwrite', 'thao-menu-2-print', 'thao-menu-4-handwrite'] };
    expect(getThaoMenuSign(corrupted)).toMatchObject({ day: 3, kind: 'print' });
  });

  it('replaces the displayed sign next week, retaining the previous decision in save', () => {
    let game = chooseThaoMenu(tomorrow(chooseThaoMenu(ready(), 'book')), 'print');
    for (let i = 0; i < 6; i++) game = tomorrow(game);
    expect(game.day).toBe(9);
    expect(getThaoMenuSign(game)?.kind).toBe('print');
    const day10 = tomorrow(chooseThaoMenu(game, 'book'));
    const handwritten = chooseThaoMenu(day10, 'handwrite');
    expect(getThaoMenuSign(handwritten)).toMatchObject({ day: 10, kind: 'handwrite' });
    expect(handwritten.relationshipRewardIds).toContain('thao-menu-3-print');
    expect(handwritten.relationshipRewardIds).toContain('thao-menu-10-handwrite');
    expect(renderLivePrep(handwritten)).toContain('Bảng viết tay');
  });
});
