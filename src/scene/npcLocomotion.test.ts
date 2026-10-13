import { describe, expect, it } from 'vitest';
import { advanceNpcLocomotion, brakingStrideScale, launchStrideScale, initialNpcLocomotion, turnStrideScale } from './npcLocomotion';

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
  it('settles foot phase while waiting and resumes on the next step', () => {
    const initial = step(initialNpcLocomotion(), 0, 0).next;
    const walking = step(initial, .1, 0).next;
    const waiting = step(walking, .1, 0, 0, false);
    expect(waiting.stepping).toBe(false);
    expect(Math.abs(waiting.next.gaitPhase)).toBeLessThan(Math.abs(walking.gaitPhase));
    expect(step(waiting.next, .2, 0).next.gaitPhase).toBeGreaterThan(waiting.next.gaitPhase);
  });
  it('turns 90 degrees without a sudden snap or long-way rotation', () => {
    const initial = step(initialNpcLocomotion(), 0, 0).next;
    const turning = step(initial, .1, 0, Math.PI / 2);
    expect(turning.next.heading).toBeGreaterThan(0);
    expect(turning.next.heading).toBeLessThan(7.5 / 30 + 1e-9);
    const wrapped = step(initialNpcLocomotion(), 0, 0, Math.PI - .05).next;
    const crossing = step(wrapped, 0, 0, -Math.PI + .05).next;
    expect(Math.abs(Math.atan2(Math.sin(crossing.heading - (-Math.PI + .05)),
      Math.cos(crossing.heading - (-Math.PI + .05))))).toBeLessThan(.1);
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
  it('shortens steps during 45/90/180-degree pivots without stopping cadence', () => {
    expect(turnStrideScale(0, 0)).toBe(1);
    expect(turnStrideScale(0, Math.PI / 12)).toBeCloseTo(1);
    expect(turnStrideScale(0, Math.PI / 4)).toBeLessThan(1);
    expect(turnStrideScale(0, Math.PI / 2)).toBeCloseTo(0.45);
    expect(turnStrideScale(0, Math.PI)).toBeCloseTo(0.45);
    expect(turnStrideScale(Number.NaN, 0)).toBe(1);

    const spawn = step(initialNpcLocomotion(), 0, 0).next;
    const straight = step(spawn, 0, 0.08);
    const firstTurn = step(straight.next, 0, 0.16, Math.PI / 2);
    const secondTurn = step(firstTurn.next, 0, 0.24, Math.PI / 2);
    expect(straight.strideScale).toBeLessThan(1);
    expect(secondTurn.stepping).toBe(true);
    expect(secondTurn.strideScale).toBeGreaterThanOrEqual(0.45);
    expect(secondTurn.strideScale).toBeLessThan(1);
    expect(secondTurn.next.gaitPhase).toBeCloseTo(3 * 0.08 * 3.6);
    expect(step(secondTurn.next, 0, 0.24, Math.PI / 2, false).strideScale).toBe(1);
    expect(step(secondTurn.next, 10, 10, Math.PI / 2).strideScale).toBe(1);
    expect(step(secondTurn.next, 0, 0.32, Math.PI / 2, true, false).strideScale).toBe(1);
  });
  it('reduces stride during route braking without changing path cadence', () => {
    expect(brakingStrideScale(.1, 1 / 30)).toBe(1);
    expect(brakingStrideScale(.005, 1 / 30)).toBeCloseTo(.3);
    expect(brakingStrideScale(.025, 1 / 30)).toBeGreaterThan(.3);
    expect(brakingStrideScale(.025, 1 / 30)).toBeLessThan(1);
    expect(brakingStrideScale(Number.NaN, 1 / 30)).toBe(1);
    expect(brakingStrideScale(.005, 0)).toBe(1);
    const spawn = step(initialNpcLocomotion(), 0, 0).next;
    const cruising = step(spawn, 0, .08);
    const braking = step(cruising.next, 0, .085);
    expect(cruising.strideScale).toBeLessThan(1);
    expect(braking.stepping).toBe(true);
    expect(braking.strideScale).toBeLessThan(.4);
    expect(braking.next.gaitPhase).toBeGreaterThan(cruising.next.gaitPhase);
    const stopped = step(braking.next, 0, .085, 0, false);
    expect(stopped.stepping).toBe(false);
    expect(stopped.next.gaitPhase).toBe(braking.next.gaitPhase);
  });
  it('plants the first step and reaches full swing by 24cm of travel', () => {
    expect(launchStrideScale(0)).toBeCloseTo(.28);
    expect(launchStrideScale(.12)).toBeCloseTo(.64);
    expect(launchStrideScale(.24)).toBe(1);
    expect(launchStrideScale(Number.NaN)).toBe(1);
    const spawn = step(initialNpcLocomotion(), 0, 0).next;
    const first = step(spawn, 0, .08);
    const second = step(first.next, 0, .16);
    const cruising = step(second.next, 0, .24);
    expect(first.strideScale).toBeLessThan(second.strideScale);
    expect(second.strideScale).toBeLessThan(cruising.strideScale);
    expect(cruising.strideScale).toBeCloseTo(1);
    expect(cruising.next.gaitPhase).toBeCloseTo(.24 * 3.6);
    const stopped = step(cruising.next, 0, .24, 0, false);
    expect(stopped.next.startDistance).toBe(0);
    expect(step(stopped.next, 0, .32).strideScale).toBeCloseTo(first.strideScale);
    expect(step(cruising.next, 10, 10).next.startDistance).toBe(0);
    expect(step(cruising.next, 0, .32, 0, true, false).next.startDistance).toBe(0);
  });
  it('uses path distance rather than frame count to ramp the first stride', () => {
    const run = (fps: number) => {
      let state = step(initialNpcLocomotion(), 0, 0).next;
      let last = 1;
      for (let frame = 1; frame <= fps / 3; frame++) {
        const result = step(state, 0, .36 * frame / fps, 0, true, true, 1 / fps);
        state = result.next;
        last = result.strideScale;
      }
      return { state, last };
    };
    const thirty = run(30), sixty = run(60);
    expect(thirty.state.startDistance).toBeCloseTo(.12);
    expect(sixty.state.startDistance).toBeCloseTo(.12);
    expect(thirty.last).toBeCloseTo(sixty.last, 8);
    expect(thirty.state.gaitPhase).toBeCloseTo(sixty.state.gaitPhase, 8);
  });

  it('plants either foot at the nearest half-cycle before restarting at 30/60 FPS', () => {
    const run = (fps: number, steps: number) => {
      let state = step(initialNpcLocomotion(), 0, 0, 0, true, true, 1 / fps).next;
      for (let i = 1; i <= steps; i++)
        state = step(state, 0, i * .1, 0, true, true, 1 / fps).next;
      const planted = Math.round(state.gaitPhase / Math.PI) * Math.PI;
      for (let i = 0; i < fps / 2; i++) {
        const next = step(state, 0, steps * .1, 0, false, true, 1 / fps).next;
        expect(Math.abs(next.gaitPhase - planted)).toBeLessThanOrEqual(
          Math.abs(state.gaitPhase - planted) + 1e-10,
        );
        state = next;
      }
      expect(state.gaitPhase).toBeCloseTo(planted, 2);
      const restart = step(state, 0, steps * .1 + .01, 0, true, true, 1 / fps);
      expect(restart.stepping).toBe(true);
      expect(restart.next.startDistance).toBeCloseTo(.01);
      expect(restart.strideScale).toBeLessThan(.35);
      expect(Math.abs(Math.sin(restart.next.gaitPhase))).toBeLessThan(.05);
      return state.gaitPhase;
    };
    for (const steps of [3, 5])
      expect(run(30, steps)).toBeCloseTo(run(60, steps), 6);
  });
  it('does not reset the gait on teleport or reduced motion', () => {
    const initial = step(initialNpcLocomotion(), 0, 0).next;
    const moved = step(initial, 0, .1).next;
    expect(step(moved, 8, 8, 0, true, true, 1 / 30).next.gaitPhase).toBe(moved.gaitPhase);
    expect(step(moved, 0, .1, 0, false, false, 1 / 30).next.gaitPhase).toBe(moved.gaitPhase);
  });

});
