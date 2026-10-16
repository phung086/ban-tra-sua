import { describe, it, expect } from 'vitest';
import {
  computeJoystickInput,
  detectNearestInteractive,
  resolveCollisionSlide,
} from './mobileLocomotionEngine';

describe('mobileLocomotionEngine — Smooth Virtual Stick & Collision Sliding', () => {
  it('applies deadzone and computes non-linear normalized joystick vectors', () => {
    // Within deadzone (<= 0.12 * 48 = 5.76px)
    const dead = computeJoystickInput(3, 4, 48, 0.12);
    expect(dead.isMoving).toBe(false);
    expect(dead.clampedX).toBe(0);
    expect(dead.clampedY).toBe(0);

    // Full deflection
    const full = computeJoystickInput(48, 0, 48, 0.12);
    expect(full.isMoving).toBe(true);
    expect(full.clampedX).toBeCloseTo(1.0, 3);
    expect(full.magnitude).toBeCloseTo(1.0, 3);
  });

  it('smoothly slides player along circular and box obstacles without getting stuck', () => {
    // Player at (0, 0), moving towards (1, 0) into a round stall at (0.8, 0) with radius 0.6
    const cur = { x: 0, z: 0 };
    const move = { x: 0.8, z: 0 };
    const circleStall = [{ id: 'stall', x: 0.8, z: 0, radius: 0.6 }];
    const resolved = resolveCollisionSlide(cur, move, 0.35, circleStall, []);

    expect(resolved.didSlide).toBe(true);
    // Player cannot penetrate stall center: distance must be >= (0.35 + 0.6) = 0.95
    const distToObstacle = Math.hypot(resolved.x - 0.8, resolved.z - 0);
    expect(distToObstacle).toBeGreaterThanOrEqual(0.94);
  });

  it('detects nearest interactive entity and enables action prompt within radius', () => {
    const player = { x: 2.0, z: 3.0 };
    const entities = [
      { id: 'cart', name: 'Xe đẩy Cô Hạnh', x: 2.4, z: 3.2, interactionRadius: 1.5, actionPrompt: 'Xem hàng' },
      { id: 'bench', name: 'Ghế nhựa', x: 8.0, z: 8.0, interactionRadius: 1.2, actionPrompt: 'Ngồi nghỉ' },
    ];

    const detected = detectNearestInteractive(player, entities);
    expect(detected.hasTarget).toBe(true);
    expect(detected.canInteract).toBe(true);
    expect(detected.target?.name).toBe('Xe đẩy Cô Hạnh');
    expect(detected.target?.actionPrompt).toBe('Xem hàng');
  });
});
