import { useMemo } from "react";
import { DRINKS, TOPPINGS } from "../game/content";
import type { DrinkDraft, Order } from "../game/types";

interface OrderServicePanelProps {
  order: Order;
  draft: DrinkDraft;
  customerName: string;
  focusMode: boolean;
  onFocusModeChange: (enabled: boolean) => void;
}

const check = (label: string, icon: string, ok: boolean) => ({ label, icon, ok });

export function OrderServicePanel({
  order,
  draft,
  customerName,
  focusMode,
  onFocusModeChange,
}: OrderServicePanelProps) {
  const checks = useMemo(
    () => [
      check("Nền trà", DRINKS[draft.base].emoji, draft.base === order.base),
      check("Size", "🥤", draft.size === order.size),
      check("Topping", TOPPINGS[draft.topping].emoji, draft.topping === order.topping),
      check("Đường", "🍬", draft.sugar === order.sugar),
      check("Đá", "🧊", draft.ice === order.ice),
      check("Mức rót", "🫗", draft.fill === order.targetFill),
      check("Độ lắc", "🌀", draft.shake === order.targetShake),
    ],
    [draft, order],
  );

  const matched = checks.filter((item) => item.ok).length;
  const recipeReady = matched === checks.length;
  const ready = recipeReady && draft.sealed;
  const progress = Math.round((matched / checks.length) * 100);

  const mood =
    ready
      ? { emoji: "🥰", label: `${customerName} mê ly này rồi!` }
      : progress >= 70
        ? { emoji: "😊", label: "Gần đúng order rồi" }
        : progress >= 40
          ? { emoji: "🙂", label: "Đang đi đúng hướng" }
          : { emoji: "👀", label: "Đọc kỹ ticket thêm chút nhé" };

  return (
    <aside className={`order-service-panel ${ready ? "ready" : ""}`} aria-label="Kiểm tra order trước khi giao">
      <div className="service-panel-head">
        <div>
          <span className="eyebrow">ORDER CHECK · KHÔNG TRỪ ĐIỂM</span>
          <h3>{mood.emoji} {mood.label}</h3>
        </div>
        <button
          type="button"
          className={`memory-toggle ${focusMode ? "active" : ""}`}
          aria-pressed={focusMode}
          onClick={() => onFocusModeChange(!focusMode)}
        >
          <span>{focusMode ? "🧠" : "📌"}</span>
          {focusMode ? "Đang che ticket" : "Thử nhớ order"}
        </button>
      </div>

      <div className="recipe-readiness">
        <div>
          <span>Độ khớp công thức</span>
          <b>{matched}/{checks.length}</b>
        </div>
        <div className="readiness-track" aria-label={`Độ khớp ${progress}%`}>
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="order-check-grid">
        {checks.map((item) => (
          <div className={item.ok ? "matched" : ""} key={item.label}>
            <span>{item.icon}</span>
            <b>{item.label}</b>
            <i aria-label={item.ok ? "Đã đúng" : "Chưa đúng"}>{item.ok ? "✓" : "·"}</i>
          </div>
        ))}
        <div className={draft.sealed ? "matched" : ""}>
          <span>🎀</span>
          <b>Dập nắp</b>
          <i aria-label={draft.sealed ? "Đã dập nắp" : "Chưa dập nắp"}>{draft.sealed ? "✓" : "·"}</i>
        </div>
      </div>

      <p className="service-hint">
        {ready
          ? "Ly đã khớp toàn bộ order và được dập nắp. Giao thôi!"
          : focusMode
            ? "Memory mode đang che chi tiết ticket. Có thể bật lại bất cứ lúc nào."
            : "Muốn tăng thử thách? Che ticket sau khi đọc rồi pha bằng trí nhớ."}
      </p>
    </aside>
  );
}
