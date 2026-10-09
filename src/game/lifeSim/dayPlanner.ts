import type { GameState } from '../types';
import { cityWeather } from '../city';
import { createDayRandom, weightedChoice } from './rng';

// Design-stage planner only. No gameplay, scene or storage integration yet.
// Persist the returned plan with the save BEFORE applying any episode effects.
export const LIFE_DAY_PLAN_VERSION = 1;

export type WakeVariant = 'on-time' | 'snoozed' | 'overslept';
export type CustomerTone = 'patient' | 'ordinary' | 'picky' | 'generous';
export type SocialHook = 'none' | 'friend-invite' | 'family-call';
export type StreetHook = 'none' | 'forgotten-umbrella' | 'neighbor-help';

export interface LifeDayPlan {
  schemaVersion: 1;
  worldSeed: string;
  day: number;
  episodeId: string;
  wakeVariant: WakeVariant;
  wakeMinute: number;
  // Weather is sourced from the EXISTING city rule, not a second weather system.
  weather: ReturnType<typeof cityWeather>;
  customerTone: CustomerTone;
  socialHook: SocialHook;
  streetHook: StreetHook;
  // Cosmetic only: never feed this channel into story or economy choices.
  crowdVariant: number;
}

export type LifeDaySnapshot = Pick<GameState, 'day' | 'city'>;

/** The existing GameState.day / city.minutes remain canonical until save v4. */
export function assertLifeSnapshot(snapshot: LifeDaySnapshot): void {
  if (!Number.isSafeInteger(snapshot.day) || snapshot.day < 1)
    throw new RangeError('game day must be a positive safe integer');
  if (snapshot.city.day !== snapshot.day)
    throw new Error('GameState.day and city.day disagree');
  if (!Number.isFinite(snapshot.city.minutes) ||
      snapshot.city.minutes < 360 || snapshot.city.minutes > 1260)
    throw new RangeError('city minutes outside the legacy playable clock');
}

export function planLifeDay(snapshot: LifeDaySnapshot, worldSeed: string): LifeDayPlan {
  assertLifeSnapshot(snapshot);
  if (typeof worldSeed !== 'string' || worldSeed.trim().length === 0 || worldSeed.length > 128)
    throw new RangeError('worldSeed must be a non-empty string of at most 128 characters');

  const key = (channel: string) => createDayRandom({ worldSeed, day: snapshot.day, channel });
  const wakeVariant = weightedChoice(key('wake-time'), [
    { value: 'on-time' as const, weight: 80 },
    { value: 'snoozed' as const, weight: 15 },
    { value: 'overslept' as const, weight: 5 },
  ]);
  const wakeDelay = wakeVariant === 'overslept' ? 45 : wakeVariant === 'snoozed' ? 15 : 0;
  const wakeMinute = Math.min(1260, Math.max(snapshot.city.minutes, 480 + wakeDelay));
  const customerTone = weightedChoice(key('customer-tone'), [
    { value: 'patient' as const, weight: 28 },
    { value: 'ordinary' as const, weight: 45 },
    { value: 'picky' as const, weight: 17 },
    { value: 'generous' as const, weight: 10 },
  ]);
  const socialHook = weightedChoice(key('social-hook'), [
    { value: 'none' as const, weight: 55 },
    { value: 'friend-invite' as const, weight: 25 },
    { value: 'family-call' as const, weight: 20 },
  ]);
  const streetHook = weightedChoice(key('street-hook'), [
    { value: 'none' as const, weight: 60 },
    { value: 'forgotten-umbrella' as const, weight: 20 },
    { value: 'neighbor-help' as const, weight: 20 },
  ]);
  return {
    schemaVersion: LIFE_DAY_PLAN_VERSION,
    worldSeed,
    day: snapshot.day,
    episodeId: snapshot.day <= 30
      ? `day-${String(snapshot.day).padStart(3, '0')}`
      : 'routine-day',
    wakeVariant,
    wakeMinute,
    weather: cityWeather(snapshot.day),
    customerTone,
    socialHook,
    streetHook,
    crowdVariant: Math.floor(key('visual-crowd')() * 4),
  };
}
