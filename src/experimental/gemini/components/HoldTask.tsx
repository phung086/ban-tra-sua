import { useEffect, useRef, useState } from 'react';
import { pulseFeedback } from '../../../game/feedback';
import { computeHoldMilestone } from '../game/tactileCraft';

export function HoldTask({
  label,
  onComplete,
  disabled = false,
}: {
  label: string;
  onComplete: () => void;
  disabled?: boolean;
}) {
  const button = useRef<HTMLButtonElement | null>(null);
  const frame = useRef<number | null>(null);
  const started = useRef<number | null>(null);
  const pointer = useRef<number | null>(null);
  const ignoreClick = useRef(false);
  const completed = useRef(false);
  const stageRef = useRef<0 | 1 | 2 | 3>(0);
  const [working, setWorking] = useState(false);
  const [stageLabel, setStageLabel] = useState('Chạm và giữ để làm');

  const stop = (resetProgress = true) => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = null;
    started.current = null;
    pointer.current = null;
    stageRef.current = 0;
    setWorking(false);
    setStageLabel('Chạm và giữ để làm');
    if (resetProgress && button.current) {
      button.current.style.setProperty('--work-progress', '0%');
    }
  };

  useEffect(() => {
    const onBlur = () => stop();
    const onVis = () => {
      if (document.hidden) stop();
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const tick = (now: number) => {
    if (started.current === null) started.current = now;
    const elapsed = now - started.current;
    const milestone = computeHoldMilestone(elapsed, 1300, stageRef.current);

    if (button.current) {
      button.current.style.setProperty('--work-progress', `${milestone.progress * 100}%`);
    }
    if (milestone.stageIndex !== stageRef.current) {
      stageRef.current = milestone.stageIndex;
      setStageLabel(milestone.stageLabel);
      if (milestone.shouldPulse) {
        pulseFeedback(milestone.stageIndex === 3 ? 'good' : 'tap');
      }
    }

    if (milestone.progress >= 1) {
      completed.current = true;
      stop(false);
      onComplete();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  };

  const start = (pointerId: number) => {
    if (disabled || working) return;
    completed.current = false;
    ignoreClick.current = true;
    pointer.current = pointerId;
    started.current = performance.now();
    stageRef.current = 0;
    setWorking(true);
    setStageLabel('Bắt đầu thao tác... giữ nguyên tay nhé');
    pulseFeedback('tap');
    frame.current = requestAnimationFrame(tick);
  };

  return (
    <button
      ref={button}
      type="button"
      disabled={disabled}
      className={`hold-task ${working ? 'is-working' : ''}`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start(e.pointerId);
      }}
      onPointerUp={(e) => {
        if (pointer.current === e.pointerId && !completed.current) stop();
      }}
      onPointerCancel={() => stop()}
      onLostPointerCapture={() => {
        if (!completed.current) stop();
      }}
      onClick={() => {
        if (ignoreClick.current) {
          ignoreClick.current = false;
          return;
        }
        if (!disabled) onComplete();
      }}
    >
      <span>{label}</span>
      <small>
        {disabled
          ? 'Tạm dừng hoặc cần hồi sức'
          : working
          ? stageLabel
          : 'Chạm và giữ để làm'}
      </small>
    </button>
  );
}
