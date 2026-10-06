import { useEffect, useRef, useState } from "react";

interface Props {
  served: number;
  score: number | null;
  combo: number;
}

function getMood(score: number) {
  if (score >= 97) return { emoji: "🌟", title: "PERFECT!", className: "perfect" };
  if (score >= 90) return { emoji: "✨", title: "Xuất sắc!", className: "excellent" };
  if (score >= 80) return { emoji: "💗", title: "Khách mê ly này!", className: "great" };
  if (score >= 65) return { emoji: "🌷", title: "Ổn áp!", className: "good" };
  return { emoji: "📝", title: "Rút kinh nghiệm", className: "retry" };
}

export function ServeCelebration({ served, score, combo }: Props) {
  const previousServed = useRef(served);
  const [visible, setVisible] = useState(false);
  const [snapshot, setSnapshot] = useState<{ score: number; combo: number } | null>(null);

  useEffect(() => {
    if (served === previousServed.current) return;
    previousServed.current = served;
    if (score === null) return;

    setSnapshot({ score, combo });
    setVisible(true);

    const timer = window.setTimeout(() => setVisible(false), 1550);
    return () => window.clearTimeout(timer);
  }, [served, score, combo]);

  if (!visible || !snapshot) return null;
  const mood = getMood(snapshot.score);

  return (
    <div className={"serve-celebration " + mood.className} role="status" aria-live="polite">
      <div className="celebration-burst" aria-hidden="true">
        <i>✦</i><i>♡</i><i>✦</i><i>•</i><i>♡</i><i>✦</i>
      </div>
      <span className="celebration-emoji">{mood.emoji}</span>
      <div>
        <small>LY VỪA GIAO</small>
        <b>{mood.title}</b>
        <strong>{snapshot.score}/100</strong>
        {snapshot.combo > 1 && <em>COMBO x{snapshot.combo}</em>}
      </div>
    </div>
  );
}
