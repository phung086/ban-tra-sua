import { useEffect, useRef, useState } from "react";
import { getCustomer } from "../game/engine";
import { ChibiReaction } from "./ChibiReaction";

interface Props {
  served: number;
  score: number | null;
  combo: number;
  customerId?: string;
  tip?: string;
}

function getMood(score: number) {
  if (score >= 97) return { emoji: "🌟", title: "PERFECT!", className: "perfect" };
  if (score >= 90) return { emoji: "✨", title: "Xuất sắc!", className: "excellent" };
  if (score >= 80) return { emoji: "💗", title: "Khách mê ly này!", className: "great" };
  if (score >= 65) return { emoji: "🌷", title: "Ổn áp!", className: "good" };
  return { emoji: "📝", title: "Rút kinh nghiệm", className: "retry" };
}

export function ServeCelebration({ served, score, combo, customerId, tip }: Props) {
  const previousServed = useRef(served);
  const [visible, setVisible] = useState(false);
  const [snapshot, setSnapshot] = useState<{ score: number; combo: number; customerId?: string; tip?: string } | null>(null);

  useEffect(() => {
    if (served === previousServed.current) return;
    previousServed.current = served;
    if (score === null) return;

    setSnapshot({ score, combo, customerId, tip });
    setVisible(true);

    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [served, score, combo, customerId, tip]);

  if (!visible || !snapshot) return null;
  const mood = getMood(snapshot.score);

  return (
    <div className={"serve-celebration " + mood.className} role="status" aria-live="polite">
      <div className="celebration-burst" aria-hidden="true">
        <i>✦</i><i>♡</i><i>✦</i><i>•</i><i>♡</i><i>✦</i>
      </div>
      {snapshot.customerId ? <ChibiReaction customer={getCustomer(snapshot.customerId)} mood={snapshot.score >= 90 ? "delighted" : snapshot.score >= 80 ? "happy" : snapshot.score >= 65 ? "neutral" : "upset"} celebrating={snapshot.score >= 80} /> : <span className="celebration-emoji">{mood.emoji}</span>}
      <div>
        <small>{snapshot.customerId ? `${getCustomer(snapshot.customerId).name} đã nhận ly` : "Ly vừa giao"}</small>
        <b>{mood.title}</b>
        <strong>{snapshot.score}/100</strong>
        {snapshot.combo > 1 && <em>COMBO x{snapshot.combo}</em>}
        {snapshot.tip && <p className="serve-coaching-tip"><span aria-hidden="true">💡</span> {snapshot.tip}</p>}
      </div>
    </div>
  );
}
