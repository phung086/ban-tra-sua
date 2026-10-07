import { useEffect, useState } from "react";
import { DECORATIONS } from "../game/content";
import { getCustomerServiceFeedback } from "../game/customerAi";
import { getCustomer } from "../game/engine";
import type { GameState } from "../game/types";
import { CafeSceneChrome } from "./CafeAtmosphere";
import { ChibiCustomer } from "./ChibiCustomer";
import { CustomerQueueStatus } from "./CustomerQueueStatus";

export function CustomerScene({ game }: { game: GameState }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [game.currentOrder?.id]);

  if (!game.currentOrder) return null;
  const customer = getCustomer(game.currentOrder.customerId);
  const feedback = getCustomerServiceFeedback(game, customer, game.currentOrderQueuedAt ?? now, now);
  const impatient = feedback.mood === "restless" || feedback.mood === "upset";
  const ready = game.draft.sealed;
  const greeting = ready ? "Ly của mình xong rồi hả? Mong quá!" : impatient ? "Bạn ơi, ly của mình sắp xong chưa?" : customer.greeting;

  return (
    <>
      <div className={`shop-scene live-scene v6-live-scene customer-scene mood-${feedback.mood}`}>
        <div className="scene-sky"><span className="scene-cloud c1" /><span className="scene-cloud c2" /></div>
        <CafeSceneChrome />
        <div className="scene-decor compact" aria-label="Trang trí đang trưng">
          {DECORATIONS.filter(item => game.equippedDecorations.includes(item.id)).map((item, index) => (
            <span className={`decor-slot decor-slot-${index + 1}`} title={item.name} key={item.id}>{item.emoji}</span>
          ))}
        </div>
        <div className="awning mini"><span /><span /><span /><span /><span /></div>
        <div className="customer-zone">
          <div className="speech-bubble">
            <small>{customer.name} · {customer.archetype}</small>
            <p>{greeting}</p>
          </div>
          <ChibiCustomer key={game.currentOrder.id} customer={customer} mood={feedback.mood} ready={ready} />
        </div>
        <div className="counter-edge"><span aria-hidden="true">♡</span><b>{game.combo > 1 ? `COMBO x${game.combo}` : "Một chút trà, thật nhiều thương"}</b><span aria-hidden="true">♡</span></div>
      </div>
      <CustomerQueueStatus game={game} now={now} />
    </>
  );
}
