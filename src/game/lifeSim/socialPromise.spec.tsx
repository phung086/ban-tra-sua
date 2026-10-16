import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState, nextDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { chooseSocialMorning } from './socialMorning';
import {
  canChooseSocialPromise, chooseSocialPromise, getSocialPromise,
  getSocialPromiseCallback, getSocialPromiseChoice,
} from './socialPromise';

function promiseDay(hook: 'friend-invite' | 'family-call') {
  const first = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
  const invite = { ...first, morning: { ...first.morning, plan: { ...first.morning.plan, socialHook: hook } } };
  return chooseBreakfast(wakeMorning(nextDay(chooseSocialMorning(invite, 'reply'))), 'skip');
}

describe('actionable social promises', () => {
  it('shows a next-day follow-up in the real preparation screen', () => {
    const game = promiseDay('friend-invite');
    const html = renderToStaticMarkup(createElement(PrepWorld, {
      game, onGame: () => undefined, onNavigate: () => undefined,
    }));
    expect(html).toContain('Lời hẹn với Lan');
    expect(html).toContain('Giữ hẹn');
    expect(html).toContain('8.000');
    expect(html).toContain('Mở cửa tiệm');
  });

  it('fulfills Lan’s promise with one charge and remembers after JSON reload', () => {
    const game = promiseDay('friend-invite');
    const after = chooseSocialPromise(game, 'keep');
    expect(after.cash).toBe(game.cash - 8000);
    expect(after.city.minutes).toBe(game.city.minutes + 20);
    expect(after.city.energy).toBe(game.city.energy - 3);
    expect(after.city.goodwill).toBe(game.city.goodwill + 3);
    expect(after.fans).toBe(game.fans + 1);
    const loaded = JSON.parse(JSON.stringify(after)) as typeof after;
    expect(getSocialPromiseChoice(loaded, getSocialPromise(loaded)!)).toBe('keep');
    expect(chooseSocialPromise(loaded, 'keep')).toBe(loaded);
    expect(chooseSocialPromise(loaded, 'postpone')).toBe(loaded);
  });

  it('offers a free honest reply when late, tired and broke', () => {
    const game = promiseDay('friend-invite');
    const poor = { ...game, cash: 0, city: { ...game.city, minutes: 1200, energy: 0 } };
    expect(canChooseSocialPromise(poor, 'keep')).toBe(false);
    expect(canChooseSocialPromise(poor, 'postpone')).toBe(true);
    const after = chooseSocialPromise(poor, 'postpone');
    expect(after.cash).toBe(0);
    expect(after.city.minutes).toBe(1200);
    expect(after.city.energy).toBe(0);
    expect(getSocialPromiseChoice(after, getSocialPromise(after)!)).toBe('postpone');
  });

  it('lets the player call Mai and receive her next-day response', () => {
    const game = promiseDay('family-call');
    const after = chooseSocialPromise(game, 'keep');
    expect(after.cash).toBe(game.cash);
    expect(after.city.energy).toBe(Math.min(100, game.city.energy + 4));
    expect(after.storyLog[0].customerId).toBe('family-mother-mai');
    const tomorrow = nextDay(after);
    expect(getSocialPromiseCallback(tomorrow)).toContain('nghe giọng con');
    expect(tomorrow.cash).toBe(after.cash);
  });

  it('retains an unfulfilled promise for three mornings, then expires', () => {
    const game = promiseDay('friend-invite');
    const skipped = nextDay(game);
    const lastChance = nextDay(skipped);
    const expired = nextDay(lastChance);
    expect(getSocialPromise(skipped)?.title).toBe('Lời hẹn với Lan');
    expect(getSocialPromise(lastChance)?.originDay).toBe(1);
    expect(getSocialPromise(expired)).toBeNull();
  });

  it('does not repeat a completed promise on subsequent days', () => {
    const game = promiseDay('friend-invite');
    const done = chooseSocialPromise(game, 'postpone');
    const tomorrow = nextDay(done);
    expect(getSocialPromise(tomorrow)).toBeNull();
    expect(getSocialPromiseCallback(tomorrow)).toContain('Lan nhắn');
    expect(tomorrow.cash).toBe(done.cash);
  });

  it('rejects choices before breakfast, after opening and with corrupt numeric state', () => {
    const game = promiseDay('family-call');
    const asleep = { ...game, morning: { ...game.morning, step: 'awake' as const } };
    expect(chooseSocialPromise(asleep, 'keep')).toBe(asleep);
    const open = { ...game, phase: 'open' as const };
    expect(chooseSocialPromise(open, 'postpone')).toBe(open);
    const bad = { ...game, city: { ...game.city, energy: Number.NaN } };
    expect(chooseSocialPromise(bad, 'postpone')).toBe(bad);
  });
});
