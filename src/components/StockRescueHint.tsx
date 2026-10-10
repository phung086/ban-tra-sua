import { DRINKS, RESTOCK_ITEMS } from "../game/content";
import { updateDraft } from "../game/engine";
import { listStockRescueOptions, missingDraftStock } from "../game/stockRescue";
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
  const rescues = listStockRescueOptions(game);
  const labels = missing.map(
    key => RESTOCK_ITEMS.find(item => item.key === key)?.label ?? key,
  ).join(", ");
  return (
    <aside className="stock-rescue" role="status" aria-live="polite">
      <p>⚠️ Kho thiếu <strong>{labels}</strong>. Ghé Kho để nhập đúng nguyên liệu,
        hoặc đổi công thức và chấp nhận điểm chất lượng thấp hơn.</p>
      {rescues.length ? (
        <div className="stock-rescue-options" aria-label="Chọn phương án thay thế">
          {rescues.length > 1 && <p>Chọn vị thay thế: điểm công thức càng cao càng gần yêu cầu khách.</p>}
          {rescues.map((rescue, index) => (
            <button key={rescue.patch.base ?? "single"} type="button"
              style={{ minHeight: 48, display: "block", width: "100%", marginBlock: 8 }}
              onClick={() => {
                const next = updateDraft(game, rescue.patch);
                onGame({
                  ...next,
                  notice: `Đã cứu đơn: ${rescue.changes.join(", ")}. Điểm công thức dự kiến ${rescue.predictedScore}/100; khách vẫn đang chờ.`,
                });
              }}>
              🧋 Cứu đơn{rescues.length > 1 ? ` ${index + 1}: ${DRINKS[rescue.patch.base ?? game.draft.base].shortName}` : ""} · {rescue.changes.join(", ")} · {rescue.predictedScore}/100
            </button>
          ))}
        </div>
      ) : (
        <p>Chưa có phương án thay thế đủ nguyên liệu. Hãy nhập thêm ở Kho.</p>
      )}
    </aside>
  );
}
