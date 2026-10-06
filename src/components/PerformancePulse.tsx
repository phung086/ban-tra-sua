import { useEffect, useState } from "react";
import { getPerformanceSnapshot, subscribePerformance } from "../game/performance";

export function PerformancePulse() {
  const [snapshot, setSnapshot] = useState(() => getPerformanceSnapshot());

  useEffect(() => subscribePerformance(() => setSnapshot(getPerformanceSnapshot())), []);

  if (snapshot.recent.length === 0) {
    return (
      <div className="performance-pulse empty">
        <span>📈</span>
        <div><b>Nhịp tay nghề</b><small>Giao ly đầu tiên để bắt đầu theo dõi phong độ.</small></div>
      </div>
    );
  }

  const trendText =
    snapshot.trend > 0 ? "+" + snapshot.trend :
    snapshot.trend < 0 ? String(snapshot.trend) :
    "±0";

  return (
    <div className="performance-pulse">
      <div className="performance-copy">
        <span>📈</span>
        <div>
          <b>Nhịp tay nghề</b>
          <small>{snapshot.recent.length} ly gần nhất · streak 85+ x{snapshot.strongRun}</small>
        </div>
      </div>
      <div className="performance-stats">
        <span><small>AVG</small><b>{snapshot.average}</b></span>
        <span><small>BEST</small><b>{snapshot.best}</b></span>
        <span className={snapshot.trend > 0 ? "up" : snapshot.trend < 0 ? "down" : ""}><small>TREND</small><b>{trendText}</b></span>
      </div>
      <div className="performance-bars" aria-label="Điểm các ly gần đây">
        {snapshot.recent.slice(-10).map((entry, index) => (
          <i
            key={entry.at + "-" + index}
            title={entry.score + "/100"}
            style={{ height: Math.max(18, entry.score) + "%" }}
            className={entry.score >= 95 ? "perfect" : entry.score >= 85 ? "strong" : ""}
          />
        ))}
      </div>
    </div>
  );
}
