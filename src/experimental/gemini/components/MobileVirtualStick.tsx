import React, { useEffect, useRef, useState } from 'react';
import {
  computeJoystickInput,
  type JoystickInputState,
  type ProximityDetectionResult,
} from '../game/mobileLocomotionEngine';
import { pulseFeedback } from '../../../game/feedback';

interface MobileVirtualStickProps {
  onMoveChange: (input: JoystickInputState) => void;
  onInteract?: () => void;
  proximity?: ProximityDetectionResult;
  disabled?: boolean;
}

export const MobileVirtualStick: React.FC<MobileVirtualStickProps> = ({
  onMoveChange,
  onInteract,
  proximity,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);
  const [basePos, setBasePos] = useState<{ x: number; y: number } | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const maxRadius = 46;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || activeTouchId !== null) return;
    // Only capture on bottom-left half of the screen
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    setActiveTouchId(e.pointerId);
    setBasePos({ x: touchX, y: touchY });
    setKnobOffset({ x: 0, y: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== activeTouchId || !basePos) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const deltaX = currentX - basePos.x;
    const deltaY = currentY - basePos.y;

    const input = computeJoystickInput(deltaX, deltaY, maxRadius);
    const clampedDist = Math.min(maxRadius, Math.hypot(deltaX, deltaY));
    const angle = Math.atan2(deltaY, deltaX);

    setKnobOffset({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });

    onMoveChange(input);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== activeTouchId) return;
    setActiveTouchId(null);
    setBasePos(null);
    setKnobOffset({ x: 0, y: 0 });
    onMoveChange(computeJoystickInput(0, 0, maxRadius));
  };

  // Keyboard WASD / Arrow keys listener for desktop / tablet
  useEffect(() => {
    const keys = new Set<string>();
    const updateKeys = () => {
      let dx = 0;
      let dy = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        onMoveChange(computeJoystickInput(dx * maxRadius, dy * maxRadius, maxRadius));
      } else if (activeTouchId === null) {
        onMoveChange(computeJoystickInput(0, 0, maxRadius));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keys.add(e.code);
        updateKeys();
      }
      if (e.code === 'KeyE' && proximity?.canInteract && onInteract) {
        e.preventDefault();
        pulseFeedback('tap');
        onInteract();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (keys.has(e.code)) {
        keys.delete(e.code);
        updateKeys();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeTouchId, onInteract, onMoveChange, proximity]);

  return (
    <div
      ref={containerRef}
      className="mobile-locomotion-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Floating Joystick Base */}
      {basePos && (
        <div
          className="joystick-base"
          style={{
            left: `${basePos.x}px`,
            top: `${basePos.y}px`,
          }}
          aria-hidden="true"
        >
          <div
            className="joystick-knob"
            style={{
              transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
            }}
          />
        </div>
      )}

      {/* Static Joystick visual cue when not touching */}
      {!basePos && (
        <div className="joystick-cue" aria-hidden="true">
          <span>Chạm ngón cái để di chuyển</span>
        </div>
      )}

      {/* Floating Action Button (FAB) on the right for interaction */}
      {proximity?.canInteract && proximity.target && (
        <button
          type="button"
          className="mobile-interact-fab"
          onClick={(e) => {
            e.stopPropagation();
            pulseFeedback('good');
            onInteract?.();
          }}
          aria-label={`${proximity.target.actionPrompt} với ${proximity.target.name}`}
        >
          <span className="fab-icon">✨</span>
          <span className="fab-text">{proximity.target.actionPrompt}</span>
        </button>
      )}
    </div>
  );
};
