import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { getCustomer } from "../game/engine";
import type { GameState } from "../game/types";
import {
  canGreetRememberedCustomer, greetRememberedCustomer,
  hasGreetedRememberedCustomer, hasRememberedLowSugar,
} from "../game/lifeSim/rememberedCustomer";
import { CustomerQueueStatus } from "./CustomerQueueStatus";
import { ChibiPortrait } from "./ChibiCustomer";
import "./life/review-care.css";

export function CustomerScene({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const order = game.currentOrder;
  if (!order) return null;
  const customer = getCustomer(order.customerId);
  const remembered = hasRememberedLowSugar(game, order.customerId);
  const greeted = remembered && hasGreetedRememberedCustomer(game);
  return <div className="customer-service">
    <div className="customer-heading"><ChibiPortrait customer={customer} /><div><small>ĐƠN {game.served + 1} / {game.targetOrders}</small><b>{customer.name}</b><span>{customer.archetype}</span></div></div>
    <CustomerQueueStatus game={game} now={now} />
    {remembered && <aside className="life-review-care life-remembered-order" aria-label="Sở thích khách quen">
      <strong>💗 Nhớ khách thích ít ngọt</strong>
      <p>Khách đặt {order.sugar}% đường hôm nay — ưu tiên đúng đơn, không tự đổi công thức.</p>
      {greeted ? <div role="status" aria-live="polite" className="life-remembered-reply">
        <small>✓ Đã chào khách theo sở thích.</small>
        <p>“Ồ, tiệm còn nhớ mình! Hôm nay mình đặt {order.sugar}% đường nhé.”</p>
      </div> :
        <div className="life-review-followup-actions" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <button type="button" disabled={!canGreetRememberedCustomer(game)}
            onClick={() => onGame(current => greetRememberedCustomer(current))}>
            Chào khách quen · 2 phút · 1 năng lượng · +1 thân thiết
          </button>
        </div>}
      {!greeted && !canGreetRememberedCustomer(game) && <small role="status">Không đủ năng lượng hoặc đã muộn để chào thêm; bạn vẫn có thể pha và giao trà bình thường.</small>}
    </aside>}
  </div>;
}
