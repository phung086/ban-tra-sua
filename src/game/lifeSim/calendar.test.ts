import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay } from '../engine';
import { planLifeDay } from './dayPlanner';
import {
  activateLifeDay,
  advanceLifeClock,
  confirmLifeSleep,
  markLifeEvening,
  newLifeSession,
  requestLifeSleep,
  wakeLifeDay,
  type LifeDaySession,
} from './calendar';

const SEED = 'an-hoa-save-0001';

describe('T1-02 deterministic day plan', () => {
  it('generates identical plans for the same save, including after JSON reload', () => {
    const state = createInitialState();
    const first = planLifeDay(state, SEED);
    const second = planLifeDay(JSON.parse(JSON.stringify(state)), SEED);
    expect(first).toEqual(second);
    expect(first.day).toBe(state.day);
    expect(first.weather).toEqual(planLifeDay(state, SEED).weather);
    expect(first.episodeId).toBe('day-001');
  });

  it('separates cosmetic crowd rolls from customer and social events', () => {
    const state = createInitialState();
    const original = planLifeDay(state, SEED);
    const changedDay = { ...state, day: 8, city: { ...state.city, day: 8 } };
    const another = planLifeDay(changedDay, SEED);
    expect(another.episodeId).toBe('day-008');
    expect(original.crowdVariant).toBeGreaterThanOrEqual(0);
    expect(original.crowdVariant).toBeLessThan(4);
    const samples = Array.from({ length: 80 }, (_, n) => {
      const snapshot = { ...state, day: n + 1, city: { ...state.city, day: n + 1 } };
      return planLifeDay(snapshot, SEED);
    });
    expect(new Set(samples.map(plan => plan.customerTone)).size).toBeGreaterThan(1);
    expect(new Set(samples.map(plan => plan.socialHook)).size).toBeGreaterThan(1);
    expect(new Set(samples.map(plan => plan.crowdVariant)).size).toBeGreaterThan(1);
  });

  it('rejects invalid legacy day/clock pairs and invalid seeds', () => {
    const state = createInitialState();
    expect(() => planLifeDay({ ...state, day: 2 }, SEED)).toThrow();
    expect(() => planLifeDay({ ...state, city: { ...state.city, minutes: 1300 } }, SEED)).toThrow();
    expect(() => planLifeDay(state, '')).toThrow();
    expect(() => planLifeDay(state, ' '.repeat(4))).toThrow();
  });
});

describe('T1-02 pure life calendar', () => {
  it('wakes once and never rerolls the plan after save/load', () => {
    const state = createInitialState();
    const before = JSON.stringify(state);
    const waking = wakeLifeDay(state, SEED);
    expect(waking.phase).toBe('waking');
    expect(waking.plan?.worldSeed).toBe(SEED);
    const restored = JSON.parse(JSON.stringify(waking)) as LifeDaySession;
    const resumed = wakeLifeDay(state, SEED, restored);
    expect(resumed).toBe(restored);
    expect(resumed.plan).toEqual(waking.plan);
    expect(JSON.stringify(state)).toBe(before);
    expect(() => wakeLifeDay(state, 'different-seed', restored)).toThrow();
    expect(() => wakeLifeDay({ ...state, day: 2, city: { ...state.city, day: 2 } }, SEED, restored)).toThrow();
  });

  it('rejects malformed sessions instead of resetting the episode silently', () => {
    const state = createInitialState();
    const session = wakeLifeDay(state, SEED);
    expect(() => wakeLifeDay(state, SEED, { ...session, plan: null })).toThrow();
    expect(() => wakeLifeDay(state, SEED, { ...session, phase: 'asleep' })).toThrow();
    expect(() => newLifeSession(0)).toThrow();
    expect(() => newLifeSession(Number.MAX_SAFE_INTEGER + 1)).toThrow();
  });

  it('advances only canonical city minutes, never the game day, and caps time', () => {
    const state = createInitialState();
    const stepped = advanceLifeClock(state, 35);
    expect(stepped.day).toBe(state.day);
    expect(stepped.city.day).toBe(state.city.day);
    expect(stepped.city.minutes).toBe(515);
    expect(state.city.minutes).toBe(480);
    expect(advanceLifeClock(stepped, 0)).toBe(stepped);
    const late = { ...state, city: { ...state.city, minutes: 1255 } };
    expect(advanceLifeClock(late, 120).city.minutes).toBe(1260);
    for (const invalid of [-1, 121, NaN, Infinity])
      expect(() => advanceLifeClock(state, invalid)).toThrow();
  });

  it('keeps life phase independent of prep/open/summary shop phases', () => {
    const state = createInitialState();
    const waking = wakeLifeDay(state, SEED);
    const active = activateLifeDay(waking);
    expect(active.phase).toBe('active');
    expect(activateLifeDay(active)).toBe(active);
    const evening = markLifeEvening(active);
    expect(evening.phase).toBe('evening');
    expect(markLifeEvening(evening)).toBe(evening);
    expect(state.phase).toBe('prep');
    expect(() => activateLifeDay(evening)).toThrow();
    expect(() => markLifeEvening(waking)).toThrow();
  });

  it('blocks sleep while shop is open or a delivery is accepted', () => {
    const state = createInitialState();
    const active = activateLifeDay(wakeLifeDay(state, SEED));
    const open = requestLifeSleep({ ...state, phase: 'open' }, active);
    expect(open.blockedReason).toMatch(/ca bán trà/);
    expect(open.session).toBe(active);
    const delivery = {
      ...state,
      city: {
        ...state.city,
        contract: {
          id: 'd1-school', destination: 'school' as const,
          base: 'peach-tea' as const, sugar: 50, count: 3,
          reward: 82000, deadline: 600, packed: false,
        },
      },
    };
    const blocked = requestLifeSleep(delivery, active);
    expect(blocked.blockedReason).toMatch(/giao trà/);
    expect(() => confirmLifeSleep(delivery, { ...active, phase: 'sleep-confirm' })).toThrow();
  });

  it('confirms sleep explicitly, proposes next day and preserves legacy save data', () => {
    const state = createInitialState();
    const active = activateLifeDay(wakeLifeDay(state, SEED));
    const asked = requestLifeSleep(state, active);
    expect(asked.blockedReason).toBeNull();
    expect(asked.session.phase).toBe('sleep-confirm');
    expect(requestLifeSleep(state, asked.session).session).toBe(asked.session);
    const before = JSON.stringify(state);
    const proposal = confirmLifeSleep(state, asked.session);
    expect(proposal.nextDay).toBe(state.day + 1);
    expect(proposal.nextClockMinute).toBe(480);
    expect(proposal.nextSession).toEqual(newLifeSession(state.day + 1));
    expect(JSON.stringify(state)).toBe(before);
    const legacy = nextDay(state);
    expect(legacy.day).toBe(proposal.nextDay);
    expect(legacy.city.day).toBe(proposal.nextDay);
    expect(legacy.city.minutes).toBe(proposal.nextClockMinute);
    const following = wakeLifeDay(legacy, SEED, proposal.nextSession);
    expect(following.plan?.day).toBe(legacy.day);
    expect(following.plan?.episodeId).toBe('day-002');
    expect(() => confirmLifeSleep(state, active)).toThrow();
  });

  it('allows a recovery route for low cash, low energy and missed promises', () => {
    const initial = createInitialState();
    const fixtures = [
      { ...initial, cash: 0 },
      { ...initial, city: { ...initial.city, energy: 0 } },
      { ...initial, relationshipRewardIds: ['missed-promise'] },
    ];
    for (const state of fixtures) {
      const before = JSON.stringify(state);
      const active = activateLifeDay(wakeLifeDay(state, SEED));
      const sleep = requestLifeSleep(state, active);
      expect(sleep.blockedReason).toBeNull();
      expect(confirmLifeSleep(state, sleep.session).nextDay).toBe(2);
      expect(JSON.stringify(state)).toBe(before);
    }
  });

  it('requires the waking phase to finish before sleeping', () => {
    const state = createInitialState();
    const waking = wakeLifeDay(state, SEED);
    const blocked = requestLifeSleep(state, waking);
    expect(blocked.blockedReason).toMatch(/thức dậy/);
    expect(blocked.session).toBe(waking);
    expect(() => confirmLifeSleep(state, waking)).toThrow();
    const active = activateLifeDay(waking);
    expect(requestLifeSleep(state, active).blockedReason).toBeNull();
  });

  it('does not allow an asleep session to skip the wake phase', () => {
    const state = createInitialState();
    const sleeping = newLifeSession(state.day);
    expect(requestLifeSleep(state, sleeping).blockedReason).not.toBeNull();
    expect(() => confirmLifeSleep(state, sleeping)).toThrow();
  });
});
