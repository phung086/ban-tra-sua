import { describe, expect, it } from 'vitest';
import { advanceNpcLocomotion, initialNpcLocomotion } from './npcLocomotion';

const step = (state: ReturnType<typeof initialNpcLocomotion>, x: number, z: number,
  heading = 0, walking = true, motion = true, dt = 1 / 30) =>
  advanceNpcLocomotion(state, x, z, heading, walking, motion, dt);

describe('QC-06 customer locomotion integration', () => {
  it('spawns facing the route without moving its feet', () => {
    const result = step(initialNpcLocomotion(), 2, -4, Math.PI / 2);
    expect(result.next.heading).toBeCloseTo(Math.PI / 2);
    expect(result.stepping).toBe(false);
    expect(result.next.gaitPhase).toBe(0);
  });
  it('keeps gait cadence independent of render FPS', () => {
    const run = (fps: number) => {
      let state = step(initialNpcLocomotion(), 0, 0).next;
      for (let i = 1; i <= fps * 2; i++)
        state = step(state, 2 * i / (fps * 2), 0, Math.PI / 2, true, true, 1 / fps).next;
      return state.gaitPhase;
    };
    expect(run(30)).toBeCloseTo(run(60), 7);
  });
  it('holds foot phase while waiting and resumes on the next step', () => {
    const initial = step(initialNpcLocomotion(), 0, 0).next;
    const walking = step(initial, .1, 0).next;
    const waiting = step(walking, .1, 0, 0, false);
    expect(waiting.stepping).toBe(false);
    expect(waiting.next.gaitPhase).toBeCloseTo(walking.gaitPhase);
    expect(step(waiting.next, .2, 0).next.gaitPhase).toBeGreaterThan(walking.gaitPhase);
  });
  it('turns 90 degrees without a sudden snap or long-way rotation', () => {
    const initial = step(initialNpcLocomotion(), 0, 0).next;
    const turning = step(initial, .1, 0, Math.PI / 2);
    expect(turning.next.heading).toBeGreaterThan(0);
    expect(turning.next.heading).toBeLessThan(7.5 / 30 + 1e-9);
    const wrapped = step(initialNpcLocomotion(), 0, 0, Math.PI - .05).next;
    const crossing = step(wrapped, 0, 0, -Math.PI + .05).next;
    expect(Math.abs(Math.atan2(Math.sin(crossing.next.heading - (-Math.PI + .05)),
      Math.cos(crossing.next.heading - (-Math.PI + .05))))).toBeLessThan(.1);
  });
  it('ignores teleports and long gaps rather than pumping the legs', () => {
    const initial = step(initialNpcLocomotion(), 0, 0).next;
    const moved = step(initial, .1, 0).next;
    const jump = step(moved, 10, 0, Math.PI / 2, true, true, 5);
    expect(jump.stepping).toBe(false);
    expect(jump.next.gaitPhase).toBeCloseTo(moved.gaitPhase);
    expect(jump.next.heading).toBeLessThan(7.5 * .05 + 1e-9);
  });
  it('honors reduced motion and rejects invalid positions', () => {
    const initial = step(initialNpcLocomotion(), 0, 0).next;
    const reduced = step(initial, .1, 0, Math.PI / 2, true, false);
    expect(reduced.stepping).toBe(false);
    expect(reduced.next.gaitPhase).toBe(0);
    expect(reduced.next.heading).toBeCloseTo(Math.PI / 2);
    const invalid = step(initial, Number.NaN, 0);
    expect(invalid.next).toBe(initial);
    expect(invalid.stepping).toBe(false);
  });
});
