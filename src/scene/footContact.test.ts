import { describe, expect, it } from 'vitest';
import { Workshop, makePerson, pose } from './models';
import { CUSTOMERS } from '../game/content';
import { footGroundLift, shoeSoleHeight } from './footContact';

describe('QC-06 pavement contact for animated shoes', () => {
  it('keeps the resting shoe at its original 1cm clearance', () => {
    expect(shoeSoleHeight(0, 0)).toBeCloseTo(.01, 8);
    expect(footGroundLift(0, 0)).toBeCloseTo(0, 8);
  });
  it('keeps both shoes above the ground throughout gait and sharp turns', () => {
    for (let hip = -.39; hip <= .391; hip += .013) {
      for (let knee = 0; knee <= .431; knee += .014) {
        const lift = footGroundLift(hip, knee);
        expect(lift).toBeGreaterThanOrEqual(0);
        expect(lift).toBeLessThan(.08);
        expect(shoeSoleHeight(hip, knee, .83 + lift)).toBeGreaterThanOrEqual(.009999);
      }
    }
  });
  it('updates the actual NPC leg pivots and returns them after stopping', () => {
    const workshop = new Workshop(), person = makePerson(workshop, CUSTOMERS[0]);
    for (let frame = 0; frame <= 60; frame++) {
      pose(person, frame / 30, true, 0, false, true, Math.PI / 2);
      for (const [leg, knee] of [[person.leftLeg, person.knees[0]], [person.rightLeg, person.knees[1]]] as const) {
        expect(shoeSoleHeight(leg.rotation.x, knee.rotation.x, leg.position.y)).toBeGreaterThanOrEqual(.009999);
      }
    }
    expect(person.leftLeg.position.y).toBeGreaterThan(.83);
    for (let frame = 61; frame <= 180; frame++) pose(person, frame / 30, false, 0, false, true, Math.PI / 2);
    expect(person.leftLeg.position.y).toBeCloseTo(.83, 4);
    pose(person, 6.1, false, 0, false, false);
    expect(person.leftLeg.position.y).toBeCloseTo(.83, 8);
    expect(person.rightLeg.position.y).toBeCloseTo(.83, 8);
    workshop.dispose();
  });
  it('does not shift seated feet or propagate invalid values', () => {
    expect(footGroundLift(.05, .43, 1)).toBe(0);
    expect(footGroundLift(NaN, 0)).toBe(0);
    expect(footGroundLift(0, Infinity)).toBe(0);
    const workshop = new Workshop(), person = makePerson(workshop, CUSTOMERS[0]);
    pose(person, 0, false, 0, true, true);
    expect(person.leftLeg.position.y).toBeCloseTo(.83, 8);
    expect(person.rightLeg.position.y).toBeCloseTo(.83, 8);
    workshop.dispose();
  });
});
