import type { Screen } from "../../game/types";

interface Props {
  screen: Screen;
  cash: string;
  reputation: number;
  day: number;
  level: number;
  seasonEmoji: string;
  notice: string;
  score: number | null;
  reviewBadge: number;
  goalBadge: number;
  onNavigate: (screen: Screen) => void;
}

const navItems: Array<{ id: Screen; icon: string; label: string; room: string }> = [
  { id: "shop", icon: "🧋", label: "Quầy", room: "BAR" },
  { id: "stock", icon: "🧺", label: "Kho", room: "PANTRY" },
  { id: "upgrades", icon: "🛠️", label: "Xưởng", room: "WORKSHOP" },
  { id: "reviews", icon: "📱", label: "Social", room: "PHONE" },
  { id: "goals", icon: "📌", label: "Bảng tin", room: "BOARD" },
];

export function WorldChrome({
  screen,
  cash,
  reputation,
  day,
  level,
  seasonEmoji,
  notice,
  score,
  reviewBadge,
  goalBadge,
  onNavigate,
}: Props) {
  return (
    <>
      <header className="v6-hud">
        <div className="v6-brand">
          <span>🧋</span>
          <div><small>TIỆM TRÀ</small><b>Chibi</b></div>
        </div>
        <div className="v6-hud-cluster">
          <span><i>🪙</i><b>{cash}</b></span>
          <span><i>💗</i><b>{reputation}</b></span>
          <span><i>✨</i><b>Lv.{level}</b></span>
          <span><i>{seasonEmoji}</i><b>Ngày {day}</b></span>
        </div>
      </header>

      <aside className="v6-world-nav" aria-label="Bản đồ tiệm">
        <div className="v6-world-nav-sign">MAP</div>
        {navItems.map((item) => {
          const badge = item.id === "reviews" ? reviewBadge : item.id === "goals" ? goalBadge : 0;
          return (
            <button
              key={item.id}
              className={screen === item.id ? "active" : ""}
              onClick={() => onNavigate(item.id)}
              aria-pressed={screen === item.id}
            >
              <span>{item.icon}</span>
              <b>{item.label}</b>
              <small>{item.room}</small>
              {badge > 0 && <i className="v6-nav-badge">{Math.min(9, badge)}</i>}
            </button>
          );
        })}
      </aside>

      <div className="v6-toast" role="status">
        <span>{score !== null ? "✨" : "🌷"}</span>
        <p>{notice}</p>
        {score !== null && <b>{score}/100</b>}
      </div>
    </>
  );
}
