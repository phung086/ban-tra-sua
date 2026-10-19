import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import { chooseBreakfast, wakeMorning } from './morning';
import {
  canChooseThaoMenu, chooseThaoMenu, getThaoMenuCallback,
  getThaoMenuChoice, getThaoMenuSign, getThaoMenuStage,
} from './thaoMenu';

const morning = (game: ReturnType<typeof createInitialState>) =>
  chooseBreakfast(wakeMorning(game), 'skip');
const tomorrow = (game: ReturnType<typeof createInitialState>) =>
  morning(nextDay(game));
const dayTwo = () => tomorrow(createInitialState());

describe('Thao sign: saved choices, zero-money route and weekly continuity', () => {
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

  it('preserves the printed sign after the 24-entry story log is rotated', () => {
    const booked = chooseThaoMenu(dayTwo(), 'book');
    const printed = chooseThaoMenu(tomorrow(booked), 'print');
    const withoutRecentStory = { ...printed, storyLog: [] };
    saveGame(withoutRecentStory);
    const loaded = loadGame();
    expect(getThaoMenuSign(loaded)).toMatchObject({ day: 3, kind: 'print' });
    expect(getThaoMenuChoice(loaded)).toBe('print');
    expect(chooseThaoMenu(loaded, 'print')).toBe(loaded);
    const next = tomorrow(loaded);
    expect(getThaoMenuSign(next)?.kind).toBe('print');
    expect(next.fans).toBe(printed.fans);
  });

  it('lets an exhausted, cashless player postpone without cost or double choice', () => {
    const booked = chooseThaoMenu(dayTwo(), 'book');
    const day3 = tomorrow(booked);
    const exhausted = { ...day3, cash: 0, city: {
      ...day3.city, energy: 0, minutes: 1260,
    } };
    expect(canChooseThaoMenu(exhausted, 'print')).toBe(false);
    expect(canChooseThaoMenu(exhausted, 'handwrite')).toBe(false);
    expect(canChooseThaoMenu(exhausted, 'later')).toBe(true);
    const postponed = chooseThaoMenu(exhausted, 'later');
    expect(postponed.cash).toBe(0);
    expect(postponed.city.energy).toBe(0);
    expect(postponed.city.minutes).toBe(1260);
    expect(chooseThaoMenu(postponed, 'later')).toBe(postponed);
    saveGame(postponed);
    const next = tomorrow(loadGame());
    expect(getThaoMenuCallback(next)).toContain('tuần sau');
    expect(getThaoMenuSign(next)).toBeNull();
  });

  it('retains the first sign when the next weekly invitation is declined', () => {
    let game = chooseThaoMenu(tomorrow(chooseThaoMenu(dayTwo(), 'book')), 'handwrite');
    for (let i = 0; i < 6; i++) game = tomorrow(game);
    expect(game.day).toBe(9);
    expect(getThaoMenuStage(game)).toBe('invite');
    const declined = chooseThaoMenu(game, 'decline');
    saveGame(declined);
    const next = tomorrow(loadGame());
    expect(getThaoMenuCallback(next)).toContain('Không sao');
    expect(getThaoMenuSign(next)).toMatchObject({ day: 3, kind: 'handwrite' });
    expect(next.fans).toBe(declined.fans);
  });

  it('never exposes pre-shop choices during an active selling shift', () => {
    const booked = chooseThaoMenu(dayTwo(), 'book');
    const open = { ...booked, phase: 'open' as const };
    expect(getThaoMenuStage(open)).toBeNull();
    expect(canChooseThaoMenu(open, 'book')).toBe(false);
    expect(chooseThaoMenu(open, 'book')).toBe(open);
  });
});
