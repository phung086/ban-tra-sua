import { useEffect, useMemo, useState } from "react";
import { getCustomerMoodMeta, getCustomerServiceFeedback } from "../game/customerAi";
import { getCustomer } from "../game/engine";
import type { GameState } from "../game/types";

const cardStyle = {
  border: "1px solid rgba(112, 76, 67, 0.16)",
  borderRadius: 18,
  background: "rgba(255, 255, 255, 0.86)",
  padding: "10px 12px",
  boxShadow: "0 8px 24px rgba(84, 56, 50, 0.08)",
} as const;

export function CustomerQueueStatus({ game }: { game: GameState }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [game.currentOrder?.id]);

  const current = useMemo(() => {
    if (!game.currentOrder || game.currentOrderQueuedAt === null) return null;
    const customer = getCustomer(game.currentOrder.customerId);
    const feedback = getCustomerServiceFeedback(
      game,
      customer,
      game.currentOrderQueuedAt,
      now,
    );
    return { customer, feedback, meta: getCustomerMoodMeta(feedback.mood) };
  }, [game, now]);

  if (!current) return null;

  return (
    <aside aria-label="Nhịp phục vụ khách" style={{ ...cardStyle, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <small style={{ opacity: 0.62, fontWeight: 800, letterSpacing: ".04em" }}>
            NHỊP PHỤC VỤ
          </small>
          <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
            <b>{current.meta.emoji} {current.customer.name} · {current.meta.label}</b>
            <small style={{ opacity: 0.68 }}>
              {current.feedback.waitedSeconds}s / ~{current.feedback.patienceSeconds}s
            </small>
          </div>
        </div>
        <small style={{ textAlign: "right", maxWidth: 190, opacity: 0.72 }}>
          {current.meta.tone}
        </small>
      </div>

      <div
        aria-label={`Kiên nhẫn còn ${current.feedback.remainingPercent}%`}
        style={{
          height: 7,
          overflow: "hidden",
          borderRadius: 999,
          background: "rgba(112, 76, 67, 0.11)",
        }}
      >
        <i
          style={{
            display: "block",
            width: `${current.feedback.remainingPercent}%`,
            minWidth: current.feedback.remainingPercent > 0 ? 5 : 0,
            height: "100%",
            borderRadius: 999,
            background: "currentColor",
            opacity: current.feedback.mood === "upset" ? 0.5 : 0.28,
            transition: "width .25s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 1 }}>
        <small style={{ flex: "0 0 auto", opacity: 0.58, paddingTop: 5 }}>Tiếp theo:</small>
        {game.customerQueue.length === 0 ? (
          <small style={{ opacity: 0.7, paddingTop: 5 }}>chưa có khách xếp hàng</small>
        ) : (
          game.customerQueue.map((entry) => {
            const queuedCustomer = getCustomer(entry.order.customerId);
            const arrivesIn = Math.max(0, Math.ceil((entry.joinedAt - now) / 1000));
            const queuedFeedback = getCustomerServiceFeedback(
              game,
              queuedCustomer,
              entry.joinedAt,
              now,
            );
            const queuedMeta = getCustomerMoodMeta(queuedFeedback.mood);
            return (
              <span
                key={entry.order.id}
                title={arrivesIn > 0 ? `Sẽ tới sau khoảng ${arrivesIn}s` : queuedMeta.tone}
                style={{
                  flex: "0 0 auto",
                  border: "1px solid rgba(112, 76, 67, 0.12)",
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  background: "rgba(255,255,255,.62)",
                }}
              >
                {arrivesIn > 0 ? "🕒" : queuedMeta.emoji} {queuedCustomer.name}
                {arrivesIn > 0 ? ` · ${arrivesIn}s` : ` · ${queuedFeedback.waitedSeconds}s`}
              </span>
            );
          })
        )}
      </div>
    </aside>
  );
}
