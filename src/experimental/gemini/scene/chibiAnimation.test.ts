import { describe, it, expect } from 'vitest';
import {
  applyChibiPose,
  computeChibiPose,
  evaluateBlinkCurve,
  mapMoodToExpression,
  type ChibiExpression,
  type PoseablePersonLike,
} from './chibiAnimation';

function createMockPerson(): PoseablePersonLike {
  return {
    root: {
      scale: { y: 1 },
      position: { x: 2.4, z: -1.5 },
      rotation: { y: 0.25 },
      userData: {},
    },
    body: {
      position: { y: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    head: {
      rotation: { x: 0, y: 0, z: 0 },
    },
    leftArm: { rotation: { x: 0, z: 0 } },
    rightArm: { rotation: { x: 0, z: 0 } },
    leftLeg: { rotation: { x: 0 } },
    rightLeg: { rotation: { x: 0 } },
    eyes: [
      { scale: { x: 1, y: 0.08 }, userData: { blinkHeight: 0.08, blinkWidth: 1 } },
      { scale: { x: 1, y: 0.08 }, userData: { blinkHeight: 0.08, blinkWidth: 1 } },
    ],
    knees: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }],
    elbows: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }],
  };
}

describe('chibiAnimation procedural rig & expressions', () => {
  it('swings left and right elbows in opposite phases while walking', () => {
    const poseA = computeChibiPose({
      time: 0.25,
      walking: true,
      gesture: 0,
      sitting: false,
      motion: true,
      gaitPhase: Math.PI / 2,
    });
    const poseB = computeChibiPose({
      time: 0.5,
      walking: true,
      gesture: 0,
      sitting: false,
      motion: true,
      gaitPhase: (3 * Math.PI) / 2,
    });

    expect(poseA.leftElbowX).not.toBeCloseTo(poseA.rightElbowX, 3);
    expect(poseB.leftElbowX).not.toBeCloseTo(poseB.rightElbowX, 3);
    expect(poseA.leftLegX).toBeCloseTo(-poseA.rightLegX, 5);
  });

  it('desynchronizes natural blinking across NPCs at different positions', () => {
    const personA = createMockPerson();
    const personB = createMockPerson();
    personB.root.position = { x: -4.2, z: 3.8 };

    let diffCount = 0;
    for (let t = 0; t < 5; t += 0.04) {
      const chA = applyChibiPose(personA, t, false, 0, false, true);
      const chB = applyChibiPose(personB, t, false, 0, false, true);
      if (Math.abs(chA.eyeScaleRatio - chB.eyeScaleRatio) > 0.1) {
        diffCount++;
      }
    }
    expect(diffCount).toBeGreaterThan(2);
  });

  it('produces finite, bounded transforms across all 17 target expressions and actions', () => {
    const expressions: ChibiExpression[] = [
      'idle_breathing',
      'natural_blinking',
      'looking_around',
      'walking',
      'turning',
      'greeting',
      'listening',
      'talking',
      'holding_cup',
      'pouring',
      'shaking',
      'serving',
      'happy',
      'worried',
      'surprised',
      'disappointed',
      'tired',
    ];

    for (const expr of expressions) {
      const person = createMockPerson();
      const ch = applyChibiPose(
        person,
        1.35,
        expr === 'walking',
        expr === 'holding_cup' ? 0.45 : 0,
        false,
        true,
        1.35 * 7,
        expr,
      );
      for (const val of Object.values(ch)) {
        expect(Number.isFinite(val)).toBe(true);
      }
      expect(person.eyes[0].scale.y).toBeGreaterThanOrEqual(0.002);
    }
  });

  it('respects reduced motion (motion = false) and sitting posture contracts', () => {
    const person = createMockPerson();
    applyChibiPose(person, 2.1, true, 0, true, false);
    expect(person.leftLeg.rotation.x).toBeCloseTo(-1.35, 5);
    expect(person.rightLeg.rotation.x).toBeCloseTo(-1.35, 5);
    expect(person.knees[0].rotation.x).toBeCloseTo(1.35, 5);
    expect(person.body.position.y).toBe(0);
    expect(person.head.rotation.y).toBe(0);
  });

  it('maps customer mood strings to chibi expression states', () => {
    expect(mapMoodToExpression('happy')).toBe('happy');
    expect(mapMoodToExpression('impatient')).toBe('disappointed');
    expect(mapMoodToExpression('worried')).toBe('worried');
    expect(mapMoodToExpression('unknown')).toBe('neutral');
  });
});
