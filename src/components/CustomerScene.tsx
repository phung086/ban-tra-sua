import { useEffect, useState } from "react";
import { getCustomer } from "../game/engine";
import type { GameState } from "../game/types";
import { CustomerQueueStatus } from "./CustomerQueueStatus";
import { ChibiPortrait } from "./ChibiCustomer";
export function CustomerScene({ game }: { game: GameState }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const order = game.currentOrder;
  if (!order) return null;
  const customer = getCustomer(order.customerId);
  return <div className="customer-service"><div className="customer-heading"><ChibiPortrait customer={customer} /><div><small>ĐƠN {game.served + 1} / {game.targetOrders}</small><b>{customer.name}</b><span>{customer.archetype}</span></div></div><CustomerQueueStatus game={game} now={now} /></div>;
}
