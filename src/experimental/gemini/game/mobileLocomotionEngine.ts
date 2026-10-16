export interface Vector2D {
  x: number;
  y: number;
}

export interface JoystickInputState {
  rawX: number;
  rawY: number;
  clampedX: number;
  clampedY: number;
  magnitude: number; // 0.0 to 1.0
  angleRad: number;
  isMoving: boolean;
}

export interface CircleObstacle {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface BoxObstacle {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface InteractiveEntity {
  id: string;
  name: string;
  x: number;
  z: number;
  interactionRadius: number;
  actionPrompt: string; // e.g. "Trò chuyện", "Mở quầy trà", "Ngồi nghỉ"
}

export interface ProximityDetectionResult {
  hasTarget: boolean;
  target: InteractiveEntity | null;
  distance: number;
  canInteract: boolean;
}

/**
 * Calculates smooth normalized joystick movement with deadzone and non-linear thumb response.
 */
export function computeJoystickInput(
  deltaX: number,
  deltaY: number,
  maxRadius = 48,
  deadzone = 0.12,
): JoystickInputState {
  const dist = Math.hypot(deltaX, deltaY);
  if (dist < 0.001) {
    return {
      rawX: 0,
      rawY: 0,
      clampedX: 0,
      clampedY: 0,
      magnitude: 0,
      angleRad: 0,
      isMoving: false,
    };
  }

  const rawNormX = deltaX / dist;
  const rawNormY = deltaY / dist;
  const rawRatio = Math.min(1, dist / maxRadius);
  const angleRad = Math.atan2(deltaY, deltaX);

  if (rawRatio <= deadzone) {
    return {
      rawX: rawNormX * rawRatio,
      rawY: rawNormY * rawRatio,
      clampedX: 0,
      clampedY: 0,
      magnitude: 0,
      angleRad,
      isMoving: false,
    };
  }

  // Smooth scaling beyond deadzone: (raw - deadzone) / (1 - deadzone)
  const effectiveRatio = (rawRatio - deadzone) / (1 - deadzone);
  // Non-linear power curve for precision micro-movements
  const magnitude = Math.pow(effectiveRatio, 1.35);

  return {
    rawX: rawNormX * rawRatio,
    rawY: rawNormY * rawRatio,
    clampedX: rawNormX * magnitude,
    clampedY: rawNormY * magnitude,
    magnitude,
    angleRad,
    isMoving: true,
  };
}

/**
 * Continuous collision sliding solver for player cylinder/capsule against street obstacles.
 * Prevents getting stuck in corners, plastic chairs, curbs, or shop counters.
 */
export function resolveCollisionSlide(
  currentPos: { x: number; z: number },
  intendedMove: { x: number; z: number },
  playerRadius = 0.35,
  obstacles: CircleObstacle[] = [],
  boxes: BoxObstacle[] = [],
): { x: number; z: number; didSlide: boolean } {
  let targetX = currentPos.x + intendedMove.x;
  let targetZ = currentPos.z + intendedMove.z;
  let didSlide = false;

  // Resolve circular obstacles (trees, trash cans, round tables, NPCs)
  for (const obs of obstacles) {
    const dx = targetX - obs.x;
    const dz = targetZ - obs.z;
    const dist = Math.hypot(dx, dz);
    const minDist = playerRadius + obs.radius;

    if (dist < minDist) {
      didSlide = true;
      let normalX = 0;
      let normalZ = 0;
      if (dist > 0.0001) {
        normalX = dx / dist;
        normalZ = dz / dist;
      } else {
        // Direct center penetration: push back along opposite of movement direction
        const moveDist = Math.hypot(intendedMove.x, intendedMove.z);
        if (moveDist > 0.0001) {
          normalX = -intendedMove.x / moveDist;
          normalZ = -intendedMove.z / moveDist;
        } else {
          normalX = 1;
          normalZ = 0;
        }
      }
      targetX = obs.x + normalX * minDist;
      targetZ = obs.z + normalZ * minDist;
    }
  }

  // Resolve axis-aligned bounding boxes (shop stalls, building walls, curbs)
  for (const box of boxes) {
    const closestX = Math.max(box.minX, Math.min(targetX, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(targetZ, box.maxZ));
    const dx = targetX - closestX;
    const dz = targetZ - closestZ;
    const dist = Math.hypot(dx, dz);

    if (dist < playerRadius) {
      didSlide = true;
      if (dist > 0.0001) {
        const pushX = (dx / dist) * playerRadius;
        const pushZ = (dz / dist) * playerRadius;
        targetX = closestX + pushX;
        targetZ = closestZ + pushZ;
      } else {
        // Deep penetration fallback: push along smallest penetration axis
        const penLeft = Math.abs(targetX - box.minX);
        const penRight = Math.abs(box.maxX - targetX);
        const penTop = Math.abs(targetZ - box.minZ);
        const penBottom = Math.abs(box.maxZ - targetZ);
        const minPen = Math.min(penLeft, penRight, penTop, penBottom);

        if (minPen === penLeft) targetX = box.minX - playerRadius;
        else if (minPen === penRight) targetX = box.maxX + playerRadius;
        else if (minPen === penTop) targetZ = box.minZ - playerRadius;
        else targetZ = box.maxZ + playerRadius;
      }
    }
  }

  return { x: targetX, z: targetZ, didSlide };
}

/**
 * Identifies the nearest interactive street object or NPC in An Hòa within interaction radius.
 */
export function detectNearestInteractive(
  playerPos: { x: number; z: number },
  entities: InteractiveEntity[],
): ProximityDetectionResult {
  if (entities.length === 0) {
    return { hasTarget: false, target: null, distance: Infinity, canInteract: false };
  }

  let closest: InteractiveEntity | null = null;
  let minDistance = Infinity;

  for (const entity of entities) {
    const dist = Math.hypot(playerPos.x - entity.x, playerPos.z - entity.z);
    if (dist < minDistance) {
      minDistance = dist;
      closest = entity;
    }
  }

  if (closest && minDistance <= closest.interactionRadius) {
    return {
      hasTarget: true,
      target: closest,
      distance: minDistance,
      canInteract: true,
    };
  }

  return {
    hasTarget: closest !== null,
    target: closest,
    distance: minDistance,
    canInteract: false,
  };
}
