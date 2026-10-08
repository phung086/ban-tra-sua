import type { GameState } from '../types';
import {
  assertLifeSnapshot,
  planLifeDay,
  type LifeDayPlan,
  type LifeDaySnapshot,
} from './dayPlanner';

/**
 * Design-stage adapter for the existing GameState day and city clock.
 * It does not replace GameState.day, city.day, city.minutes or shop phase.
 * Save integration must persist this session atomically before day effects.
 */
export const LIFE_CALENDAR_VERSION = 1;
export type LifePhase = 'asleep' | 'waking' | 'active' | 'evening' | 'sleep-confirm';

export interface LifeDaySession {
  schemaVersion: 1;
  day: number;
  phase: LifePhase;
  plan: LifeDayPlan | null;
}

export interface SleepRequest {
  session: LifeDaySession;
  blockedReason: string | null;
}

export interface SleepProposal {
  nextDay: number;
  nextClockMinute: 480;
  nextSession: LifeDaySession;
}

export function newLifeSession(day: number): LifeDaySession {
  if (!Number.isSafeInteger(day) || day < 1)
    throw new RangeError('life session day must be a positive safe integer');
  return { schemaVersion: LIFE_CALENDAR_VERSION, day, phase: 'asleep', plan: null };
}

function assertSession(session: LifeDaySession, day: number): void {
  if (!session || session.schemaVersion !== LIFE_CALENDAR_VERSION || session.day !== day)
    throw new Error('life session does not match canonical game day');
  if (!['asleep', 'waking', 'active', 'evening', 'sleep-confirm'].includes(session.phase))
    throw new Error('unknown life phase');
  if (session.phase === 'asleep' && session.plan !== null)
    throw new Error('asleep session must not carry a day plan');
  if (session.phase !== 'asleep' &&
      (!session.plan || session.plan.schemaVersion !== 1 || session.plan.day !== day))
    throw new Error('active life session requires its persisted day plan');
}

/** Never reroll an existing plan, even after a JSON save/load round-trip. */
export function wakeLifeDay(
  snapshot: LifeDaySnapshot,
  worldSeed: string,
  savedSession: LifeDaySession | null = null,
): LifeDaySession {
  assertLifeSnapshot(snapshot);
  if (typeof worldSeed !== 'string' || !worldSeed.trim() || worldSeed.length > 128)
    throw new RangeError('invalid world seed');
  const session = savedSession ?? newLifeSession(snapshot.day);
  assertSession(session, snapshot.day);
  if (session.plan) {
    if (session.plan.worldSeed !== worldSeed)
      throw new Error('saved plan world seed differs; refusing to reroll');
    return session;
  }
  return {
    schemaVersion: LIFE_CALENDAR_VERSION,
    day: snapshot.day,
    phase: 'waking',
    plan: planLifeDay(snapshot, worldSeed),
  };
}

/** Waking animation/dialogue is separate from the shop's prep/open/summary. */
export function activateLifeDay(session: LifeDaySession): LifeDaySession {
  assertSession(session, session.day);
  if (session.phase === 'active') return session;
  if (session.phase !== 'waking') throw new Error('can only activate a waking day');
  return { ...session, phase: 'active' };
}

/** Player may finish early; no hard evening time gate that could soft-lock. */
export function markLifeEvening(session: LifeDaySession): LifeDaySession {
  assertSession(session, session.day);
  if (session.phase === 'evening') return session;
  if (session.phase !== 'active') throw new Error('life day must be active');
  return { ...session, phase: 'evening' };
}

/**
 * Explicit, bounded game-time progression. No Date.now() and no midnight
 * rollover: the legacy nextDay() is the sole authority for that transition.
 */
export function advanceLifeClock(snapshot: LifeDaySnapshot, deltaMinutes: number): LifeDaySnapshot {
  assertLifeSnapshot(snapshot);
  if (!Number.isFinite(deltaMinutes) || deltaMinutes < 0 || deltaMinutes > 120)
    throw new RangeError('clock step must be between 0 and 120 minutes');
  if (deltaMinutes === 0) return snapshot;
  return {
    ...snapshot,
    city: {
      ...snapshot.city,
      minutes: Math.min(1260, snapshot.city.minutes + deltaMinutes),
    },
  };
}

/** The player must finish the shop shift and any accepted tea delivery first. */
export function requestLifeSleep(
  snapshot: LifeDaySnapshot & Pick<GameState, 'phase'>,
  session: LifeDaySession,
): SleepRequest {
  assertLifeSnapshot(snapshot);
  assertSession(session, snapshot.day);
  if (snapshot.phase === 'open')
    return { session, blockedReason: 'Đóng ca bán trà trước khi đi ngủ.' };
  if (snapshot.city.contract)
    return { session, blockedReason: 'Hoàn tất hoặc hủy đơn giao trà trước khi ngủ.' };
  if (session.phase === 'asleep')
    return { session, blockedReason: 'Ngày mới chưa bắt đầu.' };
  if (session.phase === 'sleep-confirm')
    return { session, blockedReason: null };
  return { session: { ...session, phase: 'sleep-confirm' }, blockedReason: null };
}

/**
 * A proposal only. Integration must atomically apply legacy nextDay(state)
 * and persist nextSession together; calling this function never changes cash,
 * quests, inventory, city clock or day by itself.
 */
export function confirmLifeSleep(
  snapshot: LifeDaySnapshot & Pick<GameState, 'phase'>,
  session: LifeDaySession,
): SleepProposal {
  assertLifeSnapshot(snapshot);
  assertSession(session, snapshot.day);
  if (session.phase !== 'sleep-confirm') throw new Error('sleep confirmation required');
  if (snapshot.phase === 'open' || snapshot.city.contract)
    throw new Error('cannot sleep while shop or delivery is active');
  if (!Number.isSafeInteger(snapshot.day + 1))
    throw new RangeError('next day exceeds safe integer range');
  const nextDay = snapshot.day + 1;
  return { nextDay, nextClockMinute: 480, nextSession: newLifeSession(nextDay) };
}
