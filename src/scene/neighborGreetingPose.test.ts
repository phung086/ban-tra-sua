import { describe, expect, it } from 'vitest';
import { Workshop, makePerson, pose } from './models';
import { CUSTOMERS } from '../game/content';

describe('visible chibi greeting pose', () => {
  it('waves once, returns to idle, and re-arms after the player leaves', () => {
    const w = new Workshop(), person = makePerson(w, CUSTOMERS[0]);
    const control = makePerson(w, CUSTOMERS[0]);
    pose(control, 0, false, 0, false, true);
    pose(person, 0, false, 0.35, false, true);
    expect(person.rightArm.rotation.z).toBeCloseTo(0);
    expect(person.head.rotation.z).toBeCloseTo(control.head.rotation.z);
    pose(person, 0.4, false, 0.35, false, true);
    pose(control, 0.4, false, 0, false, true);
    expect(person.head.rotation.z-control.head.rotation.z).toBeGreaterThan(0.06);
    expect(person.rightArm.rotation.z).toBeLessThan(-0.1);
    pose(person, 2, false, 0.35, false, true);
    pose(control, 2, false, 0, false, true);
    expect(person.rightArm.rotation.z).toBeCloseTo(0);
    expect(person.head.rotation.z).toBeCloseTo(control.head.rotation.z);
    pose(person, 3, false, 0, false, true);
    pose(person, 4, false, 0.35, false, true);
    pose(person, 4.4, false, 0.35, false, true);
    pose(control, 4.4, false, 0, false, true);
    expect(person.head.rotation.z-control.head.rotation.z).toBeGreaterThan(0.06);
    expect(person.rightArm.rotation.z).toBeLessThan(-0.1);
    pose(person, 4.5, false, 0.35, false, false);
    expect(person.head.rotation.z).toBe(0);
    expect(person.hand.rotation.z).toBe(0);
    w.releaseSkeletons(control.root); w.releaseSkeletons(person.root); w.dispose();
  });
  it('does not wave when carrying a delivery parcel', () => {
    const w = new Workshop(), person = makePerson(w, CUSTOMERS[0]);
    pose(person, 0, false, 0.45, false, true);
    pose(person, 0.4, false, 0.45, false, true);
    expect(person.rightArm.rotation.z).toBeCloseTo(0);
    expect(person.hand.rotation.z).toBeCloseTo(0);
    w.releaseSkeletons(person.root); w.dispose();
  });
});
