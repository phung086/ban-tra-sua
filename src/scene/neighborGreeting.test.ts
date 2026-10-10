import { describe, expect, it } from 'vitest';
import { INITIAL_GREETING, neighborGreeting, turnTowardAngle } from './neighborGreeting';

describe('NPC approach greeting', () => {
  it('waves once on approach, fades out, and does not loop while player stays nearby', () => {
    const enter = neighborGreeting(INITIAL_GREETING, 2.5, 10);
    expect(enter.strength).toBe(0);
    const waving = neighborGreeting(enter.state, 2.5, 10.4);
    expect(waving.strength).toBe(1);
    const finished = neighborGreeting(waving.state, 2.5, 12);
    expect(finished.strength).toBe(0);
    expect(neighborGreeting(finished.state, 2.5, 20).strength).toBe(0);
    const leave = neighborGreeting(finished.state, 5, 21);
    expect(leave.state.near).toBe(false);
    const returnVisit = neighborGreeting(leave.state, 2, 22);
    expect(returnVisit.state.startedAt).toBe(22);
    expect(neighborGreeting(returnVisit.state, 2, 22.3).strength).toBeGreaterThan(0);
  });
  it('hysteresis avoids retriggering when distance jitters near threshold', () => {
    const a = neighborGreeting(INITIAL_GREETING, 2.8, 1);
    const b = neighborGreeting(a.state, 3.6, 4);
    const c = neighborGreeting(b.state, 2.8, 5);
    expect(c.state.startedAt).toBe(1);
    expect(c.strength).toBe(0);
  });
  it('turns along the shortest arc and clamps large frame deltas', () => {
    const current = Math.PI - 0.05, target = -Math.PI + 0.05;
    const next = turnTowardAngle(current, target, 0.05);
    expect(next).toBeGreaterThan(current);
    expect(next - current).toBeLessThan(0.05);
    expect(Math.sin(turnTowardAngle(current, target, 10))).toBeCloseTo(Math.sin(target));
    expect(turnTowardAngle(current, target, -1)).toBe(current);
  });
});
