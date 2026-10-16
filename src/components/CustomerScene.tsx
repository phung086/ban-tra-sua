import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { getCustomer } from "../game/engine";
import { getCustomerServiceFeedback } from "../game/customerAi";
import type { GameState } from "../game/types";
import {
  canGreetRememberedCustomer, greetRememberedCustomer,
  canKeepRememberedPreferencePrivate, keepRememberedPreferencePrivate,
  getRememberedGreetingChoice, hasRememberedLowSugar, shouldMentionLowSugar,
  getLatestRememberedReview, getPreviousRememberedServiceFeedback, getUnresolvedRememberedComplaint,
  canAskRememberedCustomerAboutComplaint, askRememberedCustomerAboutComplaint,
  hasAskedRememberedCustomerAboutComplaint,
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
  const mood = game.currentOrderQueuedAt === null
    ? "neutral"
    : getCustomerServiceFeedback(game, customer, game.currentOrderQueuedAt, now).mood;
  const remembered = hasRememberedLowSugar(game, order.customerId);
  const remembersSugar = remembered && shouldMentionLowSugar(game, order.customerId, order.sugar);
  const greetingChoice = remembered ? getRememberedGreetingChoice(game) : null;
  const previousServiceFeedback = remembered ? getPreviousRememberedServiceFeedback(game) : null;
  const savedReview = remembered ? getLatestRememberedReview(game, order.customerId) : null;
  const unresolvedComplaint = remembered ? getUnresolvedRememberedComplaint(game) : null;
  const askedAboutComplaint = remembered && hasAskedRememberedCustomerAboutComplaint(game);
  return <div className="customer-service">
    <div className="customer-heading" key={order.id} data-mood={mood}><ChibiPortrait customer={customer} mood={mood} /><div><small>ĐƠN {game.served + 1} / {game.targetOrders}</small><b>{customer.name}</b><span>{customer.archetype}</span></div></div>
    <CustomerQueueStatus game={game} now={now} />
    {remembered && <aside className="life-review-care life-remembered-order" aria-label="Góp ý khách quen">
      <strong>{remembersSugar ? '💗 Nhớ khách thích ít ngọt' : '💗 Nhớ góp ý của khách quen'}</strong>
      <p>Khách đặt {order.sugar}% đường hôm nay — ưu tiên đúng đơn, không tự đổi công thức.</p>
      {!previousServiceFeedback && savedReview && <p className="life-remembered-history" role="note">
        <b>Góp ý đã lưu (ngày {savedReview.day}):</b> {savedReview.text}
      </p>}
      {previousServiceFeedback && <p className="life-remembered-history" role="note">
        <b>Lần giao trước (ngày {previousServiceFeedback.day}):</b> {previousServiceFeedback.text}
      </p>}
      {unresolvedComplaint && greetingChoice === 'greet' && <div className="life-remembered-reply">
        {askedAboutComplaint ? <p role="status">✓ Đã hỏi kỹ góp ý cũ; hãy pha đúng đơn để khách thấy sự thay đổi.</p> :
          <button type="button" disabled={!canAskRememberedCustomerAboutComplaint(game)}
            onClick={() => onGame(current => askRememberedCustomerAboutComplaint(current))}>
            Hỏi kỹ lỗi lần trước · 3 phút · 1 năng lượng · +1 thân thiết
          </button>}
        {askedAboutComplaint && <p className="life-remembered-history" role="note">
          Khách nhắc: {unresolvedComplaint.text}
        </p>}
      </div>}
      {greetingChoice ? <div role="status" aria-live="polite" className="life-remembered-reply">
        {greetingChoice === 'greet' ? <>
          <small>{remembersSugar ? '✓ Đã chào khách theo sở thích.' : '✓ Đã chào khách và ghi nhận góp ý.'}</small>
          <p>{remembersSugar
            ? `“Ồ, tiệm còn nhớ mình! Hôm nay mình đặt ${order.sugar}% đường nhé.”`
            : '“Ồ, tiệm vẫn nhớ góp ý lần trước! Mình mong ly hôm nay đúng đơn nhé.”'}</p>
        </> : <>
          <small>✓ Đã chọn giữ riêng góp ý của khách.</small>
          <p>Chủ tiệm mỉm cười và chuẩn bị đúng đơn, không nhắc lại góp ý cũ.</p>
        </>}
      </div> :
        <div className="life-review-followup-actions life-remembered-actions">
          <button type="button" disabled={!canGreetRememberedCustomer(game)}
            onClick={() => onGame(current => greetRememberedCustomer(current))}>
            Chào khách quen · 2 phút · 1 năng lượng · +1 thân thiết
          </button>
          <button type="button" disabled={!canKeepRememberedPreferencePrivate(game)}
            onClick={() => onGame(current => keepRememberedPreferencePrivate(current))}>
            Giữ riêng góp ý · miễn phí
          </button>
        </div>}
      {!greetingChoice && !canGreetRememberedCustomer(game) && <small role="status">Không đủ năng lượng hoặc đã muộn để chào thêm; bạn vẫn có thể giữ riêng sở thích và pha trà bình thường.</small>}
    </aside>}
  </div>;
}
