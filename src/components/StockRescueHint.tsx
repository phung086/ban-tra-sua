import { RESTOCK_ITEMS } from "../game/content";
import { updateDraft } from "../game/engine";
import { missingDraftStock, planStockRescue } from "../game/stockRescue";
import type { GameState } from "../game/types";

interface Props {
  game: GameState;
  onGame: (next: GameState) => void;
}

/** Small, self-contained rescue panel; mount in the brewing workbench. */
export function StockRescueHint({ game, onGame }: Props) {
  if (game.phase !== "open" || game.draft.sealed) return null;
  const missing = missingDraftStock(game);
  if (!missing.length) return null;
  const rescue = planStockRescue(game);
  const labels = missing.map(
    key => RESTOCK_ITEMS.find(item => item.key === key)?.label ?? key,
  ).join(", ");
  return (
    <aside className="stock-rescue" role="status" aria-live="polite">
      <p>⚠️ Kho thiếu <strong>{labels}</strong>. Ghé Kho để nhập đúng nguyên liệu,
        hoặc đổi công thức và chấp nhận điểm chất lượng thấp hơn.</p>
      {rescue ? (
        <button type="button" style={{ minHeight: 48 }} onClick={() => {
          const next = updateDraft(game, rescue.patch);
          onGame({
            ...next,
            notice: `Đã cứu đơn: ${rescue.changes.join(", ")}. Điểm công thức dự kiến ${rescue.predictedScore}/100; khách vẫn đang chờ.`,
          });
        }}>
          🧋 Cứu đơn: {rescue.changes.join(", ")} · {rescue.predictedScore}/100
        </button>
      ) : (
        <p>Chưa có phương án thay thế đủ nguyên liệu. Hãy nhập thêm ở Kho.</p>
      )}
    </aside>
  );
}
