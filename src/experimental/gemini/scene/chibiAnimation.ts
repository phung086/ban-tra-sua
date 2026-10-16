export type ChibiExpression =
  | 'neutral'
  | 'idle_breathing'
  | 'natural_blinking'
  | 'looking_around'
  | 'walking'
  | 'turning'
  | 'greeting'
  | 'listening'
  | 'talking'
  | 'holding_cup'
  | 'pouring'
  | 'shaking'
  | 'serving'
  | 'happy'
  | 'worried'
  | 'surprised'
  | 'disappointed'
  | 'tired';

export interface ChibiPoseInput {
  time: number;
  walking: boolean;
  gesture: number;
  sitting: boolean;
  motion: boolean;
  gaitPhase?: number;
  blinkSeed?: number;
  expression?: ChibiExpression;
  turnDelta?: number;
}

export interface ChibiPoseChannels {
  leftLegX: number;
  rightLegX: number;
  leftKneeX: number;
  rightKneeX: number;
  leftArmX: number;
  rightArmX: number;
  leftArmZ: number;
  rightArmZ: number;
  leftElbowX: number;
  rightElbowX: number;
  bodyPosY: number;
  bodyRotX: number;
  bodyRotY: number;
  bodyRotZ: number;
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  eyeScaleRatio: number;
  eyeWidthRatio: number;
}

export interface PoseablePersonLike {
  root: {
    scale: { y: number };
    position?: { x: number; z: number };
    rotation?: { y: number };
    userData?: {
      blinkSeed?: number;
      expression?: ChibiExpression;
      mood?: string;
      turnDelta?: number;
    };
  };
  body: {
    position: { y: number };
    rotation?: { x: number; y: number; z: number };
  };
  head: {
    rotation: { x: number; y: number; z: number };
  };
  leftArm: {
    rotation: { x: number; z?: number };
  };
  rightArm: {
    rotation: { x: number; z?: number };
  };
  leftLeg: {
    rotation: { x: number };
  };
  rightLeg: {
    rotation: { x: number };
  };
  eyes: Array<{
    scale: { x?: number; y: number };
    userData: { blinkHeight: number; blinkWidth?: number };
  }>;
  knees: Array<{
    rotation: { x: number };
  }>;
  elbows: Array<{
    rotation: { x: number };
  }>;
}

export function mapMoodToExpression(
  mood?: string,
  explicit?: ChibiExpression,
): ChibiExpression {
  if (explicit) return explicit;
  switch (mood) {
    case 'happy':
    case 'delighted':
      return 'happy';
    case 'worried':
    case 'anxious':
      return 'worried';
    case 'surprised':
      return 'surprised';
    case 'impatient':
    case 'disappointed':
    case 'upset':
      return 'disappointed';
    case 'tired':
    case 'exhausted':
      return 'tired';
    case 'talking':
      return 'talking';
    case 'listening':
      return 'listening';
    case 'greeting':
      return 'greeting';
    default:
      return 'neutral';
  }
}

/**
 * Smooth, desynchronized eyelid curve with occasional double-blink.
 * Returns a ratio in [0.04, 1.18] multiplied against eye.userData.blinkHeight.
 */
export function evaluateBlinkCurve(
  time: number,
  motion: boolean,
  blinkSeed = 0,
  expression: ChibiExpression = 'neutral',
): number {
  if (!motion) {
    if (expression === 'happy') return 0.72;
    if (expression === 'tired') return 0.58;
    if (expression === 'surprised') return 1.15;
    return 1;
  }

  const baseOpen =
    expression === 'happy'
      ? 0.78
      : expression === 'tired'
      ? 0.58
      : expression === 'disappointed'
      ? 0.74
      : expression === 'worried'
      ? 0.88
      : expression === 'surprised'
      ? 1.16
      : 1;

  const cycleLength = 4.3;
  const phase = ((time + blinkSeed * 1.73) % cycleLength + cycleLength) % cycleLength;
  const primaryStart = 3.98;
  const primaryDuration = 0.16;

  if (phase >= primaryStart && phase <= primaryStart + primaryDuration) {
    const t = (phase - primaryStart) / primaryDuration;
    const close = Math.sin(t * Math.PI);
    return Math.max(0.03, baseOpen * (1 - close * 0.97));
  }

  // Every 3rd cycle, add a subtle secondary flutter blink
  const cycleIndex = Math.floor((time + blinkSeed * 1.73) / cycleLength);
  if (cycleIndex % 3 === 0) {
    const secondStart = 4.17;
    const secondDuration = 0.11;
    if (phase >= secondStart && phase <= secondStart + secondDuration) {
      const t = (phase - secondStart) / secondDuration;
      const close = Math.sin(t * Math.PI);
      return Math.max(0.04, baseOpen * (1 - close * 0.95));
    }
  }

  return baseOpen;
}

/**
 * Computes all procedural skeletal/group channels for a Hanoi-style chibi actor.
 * Zero extra draw calls or geometry allocations (M1 performance gate compliant).
 */
export function computeChibiPose(input: ChibiPoseInput): ChibiPoseChannels {
  const {
    time,
    walking,
    gesture,
    sitting,
    motion,
    gaitPhase = time * 7,
    blinkSeed = 0,
    expression = 'neutral',
    turnDelta = 0,
  } = input;

  const swing = motion && walking ? Math.sin(gaitPhase) * 0.34 : 0;
  const leftLegX = sitting ? -1.35 : swing;
  const rightLegX = sitting ? -1.35 : -swing;

  const leftKneeX = sitting
    ? 1.35
    : motion && walking
    ? Math.max(0, Math.sin(gaitPhase + Math.PI) * 0.6)
    : 0;
  const rightKneeX = sitting
    ? 1.35
    : motion && walking
    ? Math.max(0, Math.sin(gaitPhase) * 0.6)
    : 0;

  // Fix: Opposite-phase elbow swing during walking (left = Math.PI offset, right = 0)
  const leftElbowWalk = motion && walking ? Math.max(0, Math.sin(gaitPhase + Math.PI) * 0.22) : 0;
  const rightElbowWalk = motion && walking ? Math.max(0, Math.sin(gaitPhase) * 0.22) : 0;

  let leftArmX = -swing * 0.55;
  let rightArmX = gesture ? -gesture : swing * 0.55;
  let leftArmZ = 0;
  let rightArmZ = 0;
  let leftElbowX = -0.12 - leftElbowWalk;
  let rightElbowX =
    gesture > 0
      ? -Math.min(0.75, gesture * 0.6)
      : -0.12 - rightElbowWalk;

  // Base breathing & walking vertical bob
  let bodyPosY =
    motion && walking
      ? Math.abs(Math.sin(gaitPhase)) * 0.015
      : motion
      ? Math.sin(time * 1.85 + blinkSeed) * 0.0065
      : 0;

  let bodyRotX = walking && motion ? 0.045 : 0;
  let bodyRotY = motion && walking ? Math.sin(gaitPhase) * 0.055 : 0;
  let bodyRotZ =
    motion && walking
      ? Math.cos(gaitPhase) * 0.025
      : Math.max(-0.12, Math.min(0.12, -turnDelta * 0.35));

  // Natural looking-around pause-and-glance when idle, stabilized counter-yaw when walking
  const lookWave =
    Math.sin(time * 0.65 + blinkSeed * 0.7) * 0.075 +
    Math.sin(time * 1.3 + blinkSeed * 1.1) * 0.02;
  let headRotX = motion && !walking ? Math.sin(time * 0.9 + blinkSeed) * 0.025 : 0;
  let headRotY =
    motion && !walking
      ? lookWave
      : motion && walking
      ? -Math.sin(gaitPhase) * 0.03
      : 0;
  let headRotZ =
    motion && !walking
      ? Math.sin(time * 0.48 + blinkSeed) * 0.022
      : motion && walking
      ? Math.sin(gaitPhase) * 0.018
      : 0;

  // Apply expression & interaction overrides
  if (motion) {
    switch (expression) {
      case 'greeting': {
        const wave = Math.sin(time * 6.2) * 0.18;
        rightArmX = -1.05 + wave * 0.35;
        rightArmZ = -0.22 + wave;
        rightElbowX = -0.68 + Math.cos(time * 6.2) * 0.14;
        headRotZ += 0.06;
        headRotX -= 0.04;
        break;
      }
      case 'listening': {
        headRotX = Math.sin(time * 3.1) * 0.055 + 0.03;
        headRotZ = 0.055;
        break;
      }
      case 'talking': {
        const cadence = Math.sin(time * 5.4);
        headRotX = cadence * 0.045;
        headRotZ = Math.cos(time * 2.7) * 0.035;
        leftArmX = -0.24 + cadence * 0.08;
        rightArmX = gesture ? -gesture : -0.28 - cadence * 0.08;
        leftElbowX = -0.35;
        break;
      }
      case 'holding_cup': {
        rightArmX = -0.52;
        rightElbowX = -0.62;
        bodyRotX = 0.02;
        break;
      }
      case 'pouring': {
        const pourTilt = Math.sin(time * 2.4) * 0.06;
        rightArmX = -0.78 + pourTilt;
        rightElbowX = -0.54;
        leftArmX = -0.36;
        leftElbowX = -0.42;
        headRotX = 0.12;
        bodyRotX = 0.06;
        break;
      }
      case 'shaking': {
        const shake = Math.sin(time * 14);
        rightArmX = -0.92 + shake * 0.22;
        rightElbowX = -0.82 - shake * 0.18;
        leftArmX = -0.45 + shake * 0.1;
        bodyPosY += Math.abs(shake) * 0.008;
        headRotX = shake * 0.04;
        break;
      }
      case 'serving': {
        rightArmX = -0.68;
        leftArmX = -0.58;
        rightElbowX = -0.48;
        leftElbowX = -0.48;
        bodyRotX = 0.11;
        headRotX = 0.09;
        break;
      }
      case 'happy': {
        const bounce = Math.abs(Math.sin(time * 3.6)) * 0.011;
        bodyPosY += bounce;
        headRotZ = Math.sin(time * 2.8) * 0.055;
        headRotX = -0.035;
        break;
      }
      case 'worried': {
        headRotX = 0.09;
        headRotY = Math.sin(time * 2.4) * 0.09;
        leftArmX = -0.32;
        leftElbowX = -0.52;
        break;
      }
      case 'surprised': {
        bodyPosY += 0.012;
        headRotX = -0.075;
        leftArmZ = 0.14;
        rightArmZ = -0.14;
        break;
      }
      case 'disappointed': {
        bodyPosY -= 0.005;
        bodyRotX = 0.075;
        headRotX = 0.13;
        headRotY = Math.sin(time * 0.9) * 0.04;
        break;
      }
      case 'tired': {
        bodyPosY = Math.sin(time * 1.1) * 0.004 - 0.006;
        bodyRotX = 0.09;
        headRotX = 0.14 + Math.sin(time * 1.1) * 0.025;
        headRotZ = -0.04;
        break;
      }
      case 'turning': {
        bodyRotY = Math.max(-0.25, Math.min(0.25, turnDelta * 0.6));
        headRotY = Math.max(-0.32, Math.min(0.32, turnDelta * 0.85));
        break;
      }
      case 'looking_around': {
        headRotY = Math.sin(time * 1.25 + blinkSeed) * 0.22;
        headRotX = Math.cos(time * 0.85 + blinkSeed) * 0.04;
        break;
      }
      default:
        break;
    }
  }

  const eyeScaleRatio = evaluateBlinkCurve(time, motion, blinkSeed, expression);
  const eyeWidthRatio =
    expression === 'happy'
      ? 1.08
      : expression === 'surprised'
      ? 1.12
      : expression === 'worried'
      ? 0.94
      : 1;

  return {
    leftLegX,
    rightLegX,
    leftKneeX,
    rightKneeX,
    leftArmX,
    rightArmX,
    leftArmZ,
    rightArmZ,
    leftElbowX,
    rightElbowX,
    bodyPosY,
    bodyRotX,
    bodyRotY,
    bodyRotZ,
    headRotX,
    headRotY,
    headRotZ,
    eyeScaleRatio,
    eyeWidthRatio,
  };
}

export function applyChibiPose(
  person: PoseablePersonLike,
  time: number,
  walking: boolean,
  gesture: number,
  sitting: boolean,
  motion: boolean,
  gaitPhase = time * 7,
  explicitExpression?: ChibiExpression,
): ChibiPoseChannels {
  const posSeed =
    (person.root.position?.x ?? 0) * 1.37 +
    (person.root.position?.z ?? 0) * 2.11 +
    (person.root.rotation?.y ?? 0) * 0.89;
  const blinkSeed =
    person.root.userData?.blinkSeed ??
    person.root.scale.y * 3 + posSeed;
  const expression = mapMoodToExpression(
    person.root.userData?.mood,
    explicitExpression ?? person.root.userData?.expression,
  );
  const turnDelta = person.root.userData?.turnDelta ?? 0;

  const channels = computeChibiPose({
    time,
    walking,
    gesture,
    sitting,
    motion,
    gaitPhase,
    blinkSeed,
    expression,
    turnDelta,
  });

  person.leftLeg.rotation.x = channels.leftLegX;
  person.rightLeg.rotation.x = channels.rightLegX;
  person.knees.forEach((knee, i) => {
    knee.rotation.x = i === 0 ? channels.leftKneeX : channels.rightKneeX;
  });

  person.eyes.forEach((eye) => {
    const baseHeight = eye.userData.blinkHeight ?? 1;
    eye.scale.y = Math.max(0.002, baseHeight * channels.eyeScaleRatio);
    if (typeof eye.scale.x === 'number' && eye.userData.blinkWidth) {
      eye.scale.x = eye.userData.blinkWidth * channels.eyeWidthRatio;
    }
  });

  person.elbows.forEach((elbow, i) => {
    elbow.rotation.x = i === 0 ? channels.leftElbowX : channels.rightElbowX;
  });

  person.leftArm.rotation.x = channels.leftArmX;
  person.rightArm.rotation.x = channels.rightArmX;
  if (typeof person.leftArm.rotation.z === 'number') {
    person.leftArm.rotation.z = channels.leftArmZ;
  }
  if (typeof person.rightArm.rotation.z === 'number') {
    person.rightArm.rotation.z = channels.rightArmZ;
  }

  person.body.position.y = channels.bodyPosY;
  if (person.body.rotation) {
    person.body.rotation.y = channels.bodyRotY;
    person.body.rotation.z = channels.bodyRotZ;
  }

  person.head.rotation.x = channels.headRotX;
  person.head.rotation.y = channels.headRotY;
  person.head.rotation.z = channels.headRotZ;

  return channels;
}
