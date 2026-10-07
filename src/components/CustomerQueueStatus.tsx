import { getCustomerMoodMeta, getCustomerServiceFeedback } from "../game/customerAi";
import { getCustomer } from "../game/engine";
import type { GameState } from "../game/types";

export function CustomerQueueStatus({ game, now }: { game: GameState; now: number }) {
  if (!game.currentOrder || game.currentOrderQueuedAt === null) return null;
  const customer = getCustomer(game.currentOrder.customerId);
  const feedback = getCustomerServiceFeedback(game, customer, game.currentOrderQueuedAt, now);
  const meta = getCustomerMoodMeta(feedback.mood);
  return (
    <aside className={`customer-queue mood-${feedback.mood}`} aria-label="Nhịp phục vụ khách">
      <div className="queue-current"><b>{meta.emoji} {customer.name} · {meta.label}</b><span>{feedback.waitedSeconds}s đã chờ</span></div>
      <div className="patience-track" role="progressbar" aria-label={`Kiên nhẫn của ${customer.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={feedback.remainingPercent}>
        <i style={{ transform: `scaleX(${feedback.remainingPercent / 100})` }} />
      </div>
      <p>{meta.tone}</p>
      <div className="queue-next"><span>Tiếp theo</span>
        {game.customerQueue.length === 0 ? <span>Khách cuối ca</span> : game.customerQueue.map((entry) => {
          const queued = getCustomer(entry.order.customerId);
          const arrivesIn = Math.max(0, Math.ceil((entry.joinedAt - now) / 1000));
          const status = getCustomerServiceFeedback(game, queued, entry.joinedAt, now);
          return <span key={entry.order.id}>{queued.name} · {arrivesIn > 0 ? `tới sau ${arrivesIn}s` : `đã chờ ${status.waitedSeconds}s`}</span>;
        })}
      </div>
    </aside>
  );
}
