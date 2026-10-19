import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { canChooseThaoMenu, chooseThaoMenu, getThaoMenuCallback, getThaoMenuChoice, getThaoMenuStage } from './thaoMenu';

const ready = () => chooseBreakfast(wakeMorning(nextDay(createInitialState())), 'skip');
const tomorrow = (game: ReturnType<typeof ready>) => chooseBreakfast(wakeMorning(nextDay(game)), 'skip');

describe('Thao menu collaboration', () => {
  it('books only once and opens the follow-through tomorrow', () => {
    const start = ready();
    expect(getThaoMenuStage(start)).toBe('invite');
    const booked = chooseThaoMenu(start, 'book');
    expect(booked.city.minutes).toBe(start.city.minutes + 5);
    expect(booked.city.energy).toBe(start.city.energy - 1);
    expect(chooseThaoMenu(booked, 'book')).toBe(booked);
    const restored = JSON.parse(JSON.stringify(booked)) as typeof booked;
    expect(getThaoMenuChoice(restored)).toBe('book');
    expect(getThaoMenuStage(tomorrow(restored))).toBe('make');
  });

  it('charges and rewards only once and remembers next morning', () => {
    const day3 = tomorrow(chooseThaoMenu(ready(), 'book'));
    const printed = chooseThaoMenu(day3, 'print');
    expect(printed.cash).toBe(day3.cash - 24000);
    expect(printed.fans).toBe(day3.fans + 3);
    expect(printed.dailyFansGained).toBe(day3.dailyFansGained + 3);
    expect(chooseThaoMenu(printed, 'handwrite')).toBe(printed);
    const day4 = tomorrow(printed);
    expect(getThaoMenuCallback(day4)).toContain('bảng giá');
  });

  it('allows zero-money, exhausted fallback and weekly replay', () => {
    const day3 = tomorrow(chooseThaoMenu(ready(), 'book'));
    const broke = { ...day3, cash: 0 };
    expect(canChooseThaoMenu(broke, 'print')).toBe(false);
    expect(canChooseThaoMenu(broke, 'handwrite')).toBe(true);
    const tired = { ...day3, cash: 0, city: { ...day3.city, energy: 0, minutes: 1260 } };
    expect(canChooseThaoMenu(tired, 'later')).toBe(true);
    expect(chooseThaoMenu(tired, 'later').cash).toBe(0);
    let game = chooseThaoMenu(ready(), 'decline');
    for (let i = 0; i < 7; i++) game = tomorrow(game);
    expect(game.day).toBe(9);
    expect(getThaoMenuStage(game)).toBe('invite');
  });
});
