import { useEffect, useRef, useState } from "react";
import { pulseFeedback } from "../game/feedback";

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
  const [running, setRunning] = useState(false);
  const [needle, setNeedle] = useState(value);
  const needleRef = useRef(value);
  const directionRef = useRef(1);
  const frameRef = useRef<number | null>(null);
  const previousRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      needleRef.current = value;
      setNeedle(value);
    }
  }, [running, value]);

  useEffect(() => {
    if (!running) return;

    const tick = (time: number) => {
      const previous = previousRef.current ?? time;
      const delta = Math.min(40, time - previous) / 1000;
      previousRef.current = time;

      let next = needleRef.current + directionRef.current * speed * delta;
      if (next >= 100) {
        next = 100;
        directionRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        directionRef.current = 1;
      }

      needleRef.current = next;
      setNeedle(next);
      frameRef.current = requestAnimationFrame(tick);
    };

    previousRef.current = null;
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      previousRef.current = null;
    };
  }, [running, speed]);

  const targetStart = Math.max(0, target - tolerance);
  const targetEnd = Math.min(100, target + tolerance);
  const distance = Math.abs(Math.round(needle) - target);
  const grade = distance <= tolerance ? "perfect" : distance <= tolerance * 2 ? "good" : "miss";

  const toggle = () => {
    if (!running) {
      directionRef.current = needleRef.current >= 95 ? -1 : 1;
      pulseFeedback("tap");
      setRunning(true);
      return;
    }

    const committed = Math.round(needleRef.current);
    setRunning(false);
    onCommit(committed);
    pulseFeedback(Math.abs(committed - target) <= tolerance ? "good" : "tap");
  };

  return (
    <div className={`craft-gauge ${running ? "is-running" : ""}`}>
      <div className="craft-gauge-head">
        <span>{icon} {label}</span>
        <b>{running ? `${Math.round(needle)}%` : `${value}%`}</b>
      </div>

      <div
        className="timing-track"
        role="progressbar"
        aria-label={`${label}: mục tiêu ${target}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(needle)}
      >
        <i
          className="target-zone"
          style={{ left: `${targetStart}%`, width: `${targetEnd - targetStart}%` }}
        />
        <i className="target-line" style={{ left: `${target}%` }} />
        <i className={`timing-needle grade-${grade}`} style={{ left: `${needle}%` }} />
      </div>

      <div className="gauge-scale">
        <span>0</span>
        <span>Mục tiêu {target}%</span>
        <span>100</span>
      </div>

      {helper && <p className="gauge-helper">{helper}</p>}

      <button className={`timing-button ${running ? "stop" : ""}`} type="button" onClick={toggle}>
        {running ? <><span>🎯</span> CHỐT!</> : <><span>▶</span> Bắt đầu {label.toLowerCase()}</>}
      </button>
    </div>
  );
}
