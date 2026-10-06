import { useEffect, useRef, useState } from "react";
import { pulseFeedback } from "../game/feedback";

interface Props {
  label: string;
  icon: string;
  value: number;
  target: number;
  onChange: (value: number) => void;
}

export function HoldDispenser({ label, icon, value, target, onChange }: Props) {
  const [holding, setHolding] = useState(false);
  const valueRef = useRef(value);
  const frameRef = useRef<number | null>(null);
  const previousRef = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!holding) return;

    const tick = (time: number) => {
      const previous = previousRef.current ?? time;
      const delta = Math.min(50, time - previous);
      previousRef.current = time;

      const next = Math.min(100, valueRef.current + delta * 0.045);
      if (Math.floor(next / 10) !== Math.floor(valueRef.current / 10)) pulseFeedback("tap");
      valueRef.current = next;
      onChange(Math.round(next));

      if (next >= 100) {
        setHolding(false);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      previousRef.current = null;
    };
  }, [holding, onChange]);

  const stop = () => {
    if (!holding) return;
    setHolding(false);
    const distance = Math.abs(valueRef.current - target);
    pulseFeedback(distance <= 5 ? "perfect" : distance <= 12 ? "good" : "tap");
  };

  const reset = () => {
    setHolding(false);
    valueRef.current = 0;
    onChange(0);
    pulseFeedback("tap");
  };

  const close = Math.abs(value - target) <= 5;

  return (
    <div className={`hold-dispenser ${holding ? "is-holding" : ""} ${close ? "is-close" : ""}`}>
      <div className="hold-head">
        <span>{icon} {label}</span>
        <b>{value}%</b>
      </div>
      <div className="hold-tank" aria-label={`${label} hiện tại ${value}%`}>
        <i className="hold-target" style={{ bottom: `${target}%` }} />
        <i className="hold-fill" style={{ height: `${value}%` }} />
        <span>{target}%</span>
      </div>
      <div className="hold-actions">
        <button
          type="button"
          className="hold-main"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setHolding(true);
            pulseFeedback("tap");
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerLeave={stop}
          onKeyDown={(event) => {
            if ((event.key === " " || event.key === "Enter") && !holding) {
              event.preventDefault();
              setHolding(true);
            }
          }}
          onKeyUp={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              stop();
            }
          }}
        >
          {holding ? "Đang rót…" : "Giữ để rót"}
        </button>
        <button type="button" className="hold-reset" onClick={reset}>↺</button>
      </div>
      <small>Giữ nút và nhả gần mốc {target}%.</small>
    </div>
  );
}
