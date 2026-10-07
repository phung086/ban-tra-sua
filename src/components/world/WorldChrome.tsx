import { GameIcon } from "../GameIcon";
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
  { id: "shop", icon: "cup", label: "Quầy", room: "Pha chế" },
  { id: "stock", icon: "box", label: "Kho", room: "Nguyên liệu" },
  { id: "upgrades", icon: "tool", label: "Xưởng", room: "Nâng cấp" },
  { id: "reviews", icon: "chat", label: "Đánh giá", room: "Khách nói" },
  { id: "goals", icon: "board", label: "Bảng tin", room: "Mục tiêu" },
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
      <a className="skip-to-game" href="#game-content">Đến nội dung game</a>
      <header className="v6-hud">
        <div className="v6-brand">
          <GameIcon />
          <div><small>TIỆM TRÀ CHIBI</small><b>Phố nhỏ</b></div>
        </div>
        <div className="v6-hud-cluster">
          <span aria-label={`Tiền quỹ ${cash}`}><GameIcon name="coin" /><b>{cash}</b></span>
          <span aria-label={`Uy tín ${reputation}`}><GameIcon name="person" /><b>{reputation}</b></span>
          <span aria-label={`Cấp độ ${level}`}><GameIcon name="star" /><b>Lv.{level}</b></span>
          <span><i>{seasonEmoji}</i><b>Ngày {day}</b></span>
        </div>
      </header>

      <nav className="v6-world-nav" aria-label="Bản đồ tiệm">
        <div className="v6-world-nav-sign">TIỆM</div>
        {navItems.map((item) => {
          const badge = item.id === "reviews" ? reviewBadge : item.id === "goals" ? goalBadge : 0;
          return (
            <button
              key={item.id}
              className={screen === item.id ? "active" : ""}
              onClick={() => onNavigate(item.id)}
              aria-pressed={screen === item.id}
              aria-current={screen === item.id ? "page" : undefined}
            >
              <GameIcon name={item.icon} />
              <b>{item.label}</b>
              <small>{item.room}</small>
              {badge > 0 && <i className="v6-nav-badge" aria-label={`${badge} mục đang chờ`}>{badge > 9 ? "9+" : badge}</i>}
            </button>
          );
        })}
      </nav>

      <div className="v6-toast" role="status">
        <GameIcon name="leaf" />
        <p>{notice}</p>
        {score !== null && <b>{score}/100</b>}
      </div>
    </>
  );
}
