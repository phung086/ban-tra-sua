import { useEffect, useRef, useState } from 'react';
import { pulseFeedback } from '../../../game/feedback';
import { evaluateCraftGauge } from '../game/tactileCraft';

interface Props {
  label: string;
  icon: string;
  value: number;
  target: number;
  tolerance?: number;
  speed?: number;
  helper?: string;
  onCommit: (value: number) => void;
}

export function CraftGauge({
  label,
  icon,
  value,
  target,
  tolerance = 6,
  speed = 58,
  helper,
  onCommit,
}: Props) {
  const [needle, setNeedle] = useState(value);
  const [running, setRunning] = useState(false);
  const directionRef = useRef(1);
  const lastTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      setNeedle(value);
      return;
    }
    const tick = (now: number) => {
      const dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = now;
      setNeedle((prev) => {
        let next = prev + directionRef.current * speed * dt;
        if (next >= 100) {
          next = 100;
          directionRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          directionRef.current = 1;
        }
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = null;
    };
  }, [running, speed, value]);

  const feedback = evaluateCraftGauge(Math.round(needle), target, tolerance);
  const targetStart = Math.max(0, target - tolerance);
  const targetEnd = Math.min(100, target + tolerance);

  const handleToggleOrCommit = () => {
    if (!running) {
      setRunning(true);
      pulseFeedback('tap');
      return;
    }
    setRunning(false);
    const committed = Math.round(needle);
    const result = evaluateCraftGauge(committed, target, tolerance);
    pulseFeedback(result.pulseKind === 'warn' ? 'tap' : 'good');
    onCommit(committed);
  };

  return (
    <div className={`craft-gauge grade-${feedback.grade}`}>
      <div className="craft-gauge-header">
        <span>
          {icon} {label}
        </span>
        <strong className="craft-gauge-status">{feedback.badgeText}</strong>
      </div>
      <svg
        viewBox="0 0 100 14"
        className="craft-gauge-track"
        aria-label={`${label}: hiện tại ${Math.round(needle)}%, mục tiêu ${target}%`}
      >
        <rect x="0" y="3" width="100" height="8" rx="4" className="gauge-bg" />
        <rect
          x={Math.max(0, target - tolerance * 2)}
          y="3"
          width={Math.min(100, tolerance * 4)}
          height="8"
          rx="2"
          className="gauge-good-zone"
        />
        <rect
          x={targetStart}
          y="2"
          width={targetEnd - targetStart}
          height="10"
          rx="2"
          className="gauge-target-zone"
        />
        <line
          x1={needle}
          y1="0"
          x2={needle}
          y2="14"
          className="gauge-needle"
        />
      </svg>
      <div className="craft-gauge-footer">
        <small>{helper ?? feedback.coachingHint}</small>
        <button
          type="button"
          className="craft-gauge-btn"
          onClick={handleToggleOrCommit}
        >
          {running
            ? `Chốt ${Math.round(needle)}% (Mục tiêu ${target}%)`
            : `Canh lại (${Math.round(needle)}%)`}
        </button>
      </div>
    </div>
  );
}
