import { getRushShiftProgress } from "../../game/shiftPlans";
import type { GameState } from "../../game/types";

/** Non-blocking feedback during the real rush shift and its summary. */
export function RushShiftProgress({ game }: { game: GameState }) {
  if (game.phase !== "open" && game.phase !== "summary") return null;
  const progress = getRushShiftProgress(game);
  if (!progress) return null;
  return <aside className="panel rush-shift-progress" aria-label="Tiến độ ca đông khách" role="status">
    <b>⚡ Ca đông khách · {progress.served}/{game.targetOrders} đơn</b>
    <p>{game.phase === "summary"
      ? progress.bonusEarned ? "Đã đạt mục tiêu: thưởng 20.000 ₫ và 2 fan." : "Ca đã kết thúc: chưa đạt mức thưởng chất lượng."
      : `${progress.remaining} đơn còn lại · điểm trung bình ${progress.average ?? "—"}/100. ${progress.requiredAverage === null
        ? "Đang cập nhật mục tiêu chất lượng."
        : progress.requiredAverage > 100
          ? "Không còn đủ đơn để đạt thưởng chất lượng; hãy phục vụ tốt nhất có thể."
          : `Cần trung bình ≥${progress.requiredAverage}/100 cho các đơn còn lại để nhận thưởng.`}`}</p>
  </aside>;
}
