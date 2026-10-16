import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { pose, type Person } from './models';

function personStub(): Person {
  return {
    root: new T.Group(), body: new T.Group(), head: new T.Group(),
    leftArm: new T.Group(), rightArm: new T.Group(),
    leftLeg: new T.Group(), rightLeg: new T.Group(), hand: new T.Group(),
    eyes: [], knees: [new T.Bone(), new T.Bone()],
    elbows: [new T.Bone(), new T.Bone()],
  };
}

describe('chibi gait easing', () => {
  it('ramps walking pose and eases out after release', () => {
    const actor = personStub();
    pose(actor, 0, false, 0, false, true, 0);
    pose(actor, 0.016, true, 0, false, true, Math.PI / 2);
    const start = actor.leftLeg.rotation.x;
    expect(start).toBeGreaterThan(0);
    expect(start).toBeLessThan(0.1);
    pose(actor, 0.116, true, 0, false, true, Math.PI / 2);
    const stride = actor.leftLeg.rotation.x;
    expect(stride).toBeGreaterThan(start);
    pose(actor, 0.216, false, 0, false, true, Math.PI / 2);
    expect(actor.leftLeg.rotation.x).toBeGreaterThan(0);
    expect(actor.leftLeg.rotation.x).toBeLessThan(stride);
  });

  it('respects reduced motion and sitting', () => {
    const actor = personStub();
    pose(actor, 0, true, 0, false, true, Math.PI / 2);
    pose(actor, 0.1, true, 0, false, false, Math.PI / 2);
    expect(actor.leftLeg.rotation.x).toBe(0);
    expect(actor.body.rotation.z).toBe(0);
    pose(actor, 0.2, false, 0, true, true, Math.PI / 2);
    expect(actor.leftLeg.rotation.x).toBe(-1.35);
    expect(actor.knees[0].rotation.x).toBe(1.35);
  });
});
