import { useEffect, useMemo, useState } from "react";
import { DRINKS, TOPPINGS } from "../game/content";
import type { DrinkDraft, Order } from "../game/types";
import { OrderRecallDrill } from "./OrderRecallDrill";
import "../styles-order-service.css";

interface OrderExperienceProps {
  order: Order;
  draft: DrinkDraft;
  customerName: string;
  orderNumber: number;
  priceText: string;
}

type Check = {
  id: string;
  label: string;
  icon: string;
  ok: boolean;
  expected?: string;
  actual?: string;
};

export function OrderExperience({
  order,
  draft,
  customerName,
  orderNumber,
  priceText,
}: OrderExperienceProps) {
  const [memoryMode, setMemoryMode] = useState(false);
  const [coachMode, setCoachMode] = useState(false);
  const [peekSeconds, setPeekSeconds] = useState(0);
  const [peekCount, setPeekCount] = useState(0);

  useEffect(() => {
    if (peekSeconds <= 0) return;
    const timer = window.setTimeout(
      () => setPeekSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [peekSeconds]);

  const toggleMemoryMode = () => {
    if (memoryMode) setPeekSeconds(0);
    setMemoryMode(!memoryMode);
  };

  const quickPeek = () => {
    setPeekCount((count) => count + 1);
    setPeekSeconds(3);
  };

  const checks = useMemo<Check[]>(
    () => [
      {
        id: "base",
        label: "Nền trà",
        icon: DRINKS[draft.base].emoji,
        ok: draft.base === order.base,
        expected: DRINKS[order.base].shortName,
        actual: DRINKS[draft.base].shortName,
      },
      {
        id: "size",
        label: "Size",
        icon: "🥤",
        ok: draft.size === order.size,
        expected: order.size,
        actual: draft.size,
      },
      {
        id: "topping",
        label: "Topping",
        icon: TOPPINGS[draft.topping].emoji,
        ok: draft.topping === order.topping,
        expected: TOPPINGS[order.topping].name,
        actual: TOPPINGS[draft.topping].name,
      },
      {
        id: "sugar",
        label: "Đường",
        icon: "🍬",
        ok: draft.sugar === order.sugar,
        expected: `${order.sugar}%`,
        actual: `${draft.sugar}%`,
      },
      {
        id: "ice",
        label: "Đá",
        icon: "🧊",
        ok: draft.ice === order.ice,
        expected: `${order.ice}%`,
        actual: `${draft.ice}%`,
      },
      {
        id: "fill",
        label: "Mức rót",
        icon: "🫗",
        ok: draft.fill === order.targetFill,
        expected: `${order.targetFill}%`,
        actual: `${draft.fill}%`,
      },
      {
        id: "shake",
        label: "Độ lắc",
        icon: "🌀",
        ok: draft.shake === order.targetShake,
        expected: `${order.targetShake}%`,
        actual: `${draft.shake}%`,
      },
      {
        id: "seal",
        label: "Dập nắp",
        icon: "🎀",
        ok: draft.sealed,
        expected: "Đã dập",
        actual: draft.sealed ? "Đã dập" : "Chưa dập",
      },
    ],
    [draft, order],
  );

  const matched = checks.filter((item) => item.ok).length;
  const progress = Math.round((matched / checks.length) * 100);
  const ready = matched === checks.length;
  const mismatch = checks.filter((item) => !item.ok);
  const recipeChecks = checks.slice(0, 5);
  const techniqueChecks = checks.slice(5);
  const recipeScore = Math.round((recipeChecks.filter((item) => item.ok).length / recipeChecks.length) * 100);
  const techniqueScore = Math.round((techniqueChecks.filter((item) => item.ok).length / techniqueChecks.length) * 100);

  const mood =
    ready
      ? { emoji: "🥰", label: `${customerName} mê ly này rồi!` }
      : progress >= 75
        ? { emoji: "😊", label: "Sắp chạm perfect rồi" }
        : progress >= 50
          ? { emoji: "🙂", label: "Đang đi đúng hướng" }
          : { emoji: "👀", label: "Kiểm tra lại ticket nhé" };

  return (
    <div className="order-experience">
      <section className={`order-ticket v2-ticket order-ticket-v4 ${memoryMode ? "is-memory-mode" : ""}`}>
        <div className="ticket-pin">📌</div>
        <div className="ticket-head">
          <div>
            <span className="eyebrow">ORDER #{orderNumber}</span>
            <h3>{DRINKS[order.base].name}</h3>
          </div>
          <b>{priceText}</b>
        </div>
        <div className="order-chips">
          <span>🥤 Size {order.size}</span>
          <span>🍬 {order.sugar}% đường</span>
          <span>🧊 {order.ice}% đá</span>
          <span>{TOPPINGS[order.topping].emoji} {TOPPINGS[order.topping].name}</span>
          <span>🫗 Rót {order.targetFill}%</span>
          <span>🌀 Lắc {order.targetShake}%</span>
        </div>
        {memoryMode && peekSeconds === 0 && (
          <div className="memory-cover" role="status">
            <span>🧠</span>
            <b>MEMORY MODE</b>
            <small>Ticket đang được che — pha bằng trí nhớ.</small>
            <button type="button" className="memory-quick-peek" onClick={quickPeek}>
              👀 Liếc ticket 3 giây
            </button>
            <em>{peekCount === 0 ? "No-peek run đang giữ nguyên ✨" : `Đã quick peek ${peekCount} lần`}</em>
          </div>
        )}
        {memoryMode && peekSeconds > 0 && (
          <div className="memory-peek-status" role="status" aria-live="polite">
            <span>👀 QUICK PEEK</span>
            <b>{peekSeconds}s</b>
            <small>Ghi nhớ nhanh trước khi ticket bị che lại</small>
          </div>
        )}
      </section>

      <aside className={`order-service-panel ${ready ? "ready" : ""}`} aria-label="Kiểm tra order trước khi giao">
        <div className="service-panel-head">
          <div>
            <span className="eyebrow">ORDER CHECK · KHÔNG TRỪ ĐIỂM</span>
            <h3>{mood.emoji} {mood.label}</h3>
          </div>
          <div className="service-mode-actions">
            <button
              type="button"
              className={memoryMode ? "active" : ""}
              aria-pressed={memoryMode}
              onClick={toggleMemoryMode}
            >
              <span>🧠</span>{memoryMode ? "Hiện ticket" : "Nhớ order"}
            </button>
            <button
              type="button"
              className={coachMode ? "active" : ""}
              aria-pressed={coachMode}
              onClick={() => setCoachMode((value) => !value)}
            >
              <span>💡</span>{coachMode ? "Tắt coach" : "Coach nhẹ"}
            </button>
          </div>
        </div>

        <div className="recipe-readiness">
          <div>
            <span>Độ khớp công thức</span>
            <b>{matched}/{checks.length} · {progress}%</b>
          </div>
          <div className="readiness-track" aria-label={`Độ khớp ${progress}%`}>
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="service-radar" aria-label="Tách độ chính xác công thức và kỹ thuật">
          <div>
            <span>🍹 Công thức</span>
            <b>{recipeScore}%</b>
            <div><i style={{ width: `${recipeScore}%` }} /></div>
          </div>
          <div>
            <span>🪄 Kỹ thuật</span>
            <b>{techniqueScore}%</b>
            <div><i style={{ width: `${techniqueScore}%` }} /></div>
          </div>
        </div>

        <div className="order-check-grid">
          {checks.map((item) => (
            <div className={item.ok ? "matched" : ""} key={item.id}>
              <span>{item.icon}</span>
              <b>{item.label}</b>
              <i aria-label={item.ok ? "Đã đúng" : "Chưa đúng"}>{item.ok ? "✓" : "·"}</i>
            </div>
          ))}
        </div>

        {memoryMode && <OrderRecallDrill order={order} peekCount={peekCount} />}

        {coachMode && mismatch.length > 0 && (
          <div className="coach-card">
            <div className="coach-head">
              <span>💡</span>
              <div><b>Coach đang gợi ý</b><small>Chỉ chỉ ra chỗ lệch, không tự sửa ly.</small></div>
            </div>
            <div className="coach-list">
              {mismatch.slice(0, 3).map((item) => (
                <div key={item.id}>
                  <span>{item.icon}</span>
                  <p><b>{item.label}</b><small>{item.actual} → {item.expected}</small></p>
                </div>
              ))}
            </div>
            {mismatch.length > 3 && <small className="coach-more">Còn {mismatch.length - 3} mục chưa khớp.</small>}
          </div>
        )}

        <p className="service-hint">
          {ready
            ? "Ly đã khớp toàn bộ order và dập nắp. Có thể giao ngay."
            : memoryMode
              ? "Memory mode không ảnh hưởng điểm; bật lại ticket bất cứ lúc nào."
              : coachMode
                ? "Coach chỉ gợi ý sai lệch để người chơi vẫn tự thao tác."
                : "Có thể bật Memory để tăng thử thách hoặc Coach để học flow nhanh hơn."}
        </p>
      </aside>
    </div>
  );
}
