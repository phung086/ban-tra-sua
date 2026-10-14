import type { Dispatch, SetStateAction } from "react";
import { formatMoney, getCustomer, getRestockPrice, restock, startDay } from "../../game/engine";
import { DRINKS, RESTOCK_ITEMS } from "../../game/content";
import { chooseShiftPlan, getRushCupRequirements, getRushCupShortage, getRushCupShortageBySize, getRushCommuterRequest, getRushCommuterPreferredBase, getRushOfficeCustomerId, getRushOrderSize, RUSH_UNLOCK_DAY, targetOrdersFor } from "../../game/shiftPlans";
import type { GameState, Screen } from "../../game/types";
import { GameIcon } from "../GameIcon";

interface Props {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
  onNavigate: (screen: Screen) => void;
}

/** A complete opening decision with a visible stock gate and different queue pace. */
export function RushShiftPanel({ game, onGame, onNavigate }: Props) {
  const available = game.day >= RUSH_UNLOCK_DAY;
  const isRush = available && game.shiftPlan === "rush";
  const shortage = isRush ? getRushCupShortage(game) : 0;
  const missing = getRushCupShortageBySize(game);
  const required = getRushCupRequirements(game);
  const normalOrders = targetOrdersFor(game.day, game.event.demandBonus);
  const commuterRequests = isRush ? [0, 1].flatMap(index => {
    const request = getRushCommuterRequest(game, index);
    return request ? [request] : [];
  }) : [];
  // The first two commuters are deterministic real orders, not decorative hints.
  // Only preview the drink when their favorite is actually unlocked; otherwise
  // the engine will choose a different available recipe at the counter.
  const commuterPreorders = isRush ? [0, 1].flatMap(index => {
    const customerId = getRushOfficeCustomerId(game, index);
    const size = getRushOrderSize(game, index);
    if (!customerId || !size) return [];
    const customer = getCustomer(customerId);
    const base = getRushCommuterPreferredBase(game, index, customer.favorite, game.unlockedBaseIds);
    const request = getRushCommuterRequest(game, index);
    return [{ index, name: customer.name, size, drink: base ? DRINKS[base].name : "Chọn món khi đến quầy",
      request: request?.sugar !== undefined ? `${request.sugar}% đường`
        : request?.ice !== undefined ? `${request.ice}% đá` : "Theo khẩu vị" }];
  }) : [];
  const cupRescue = (["cupsM", "cupsL"] as const).flatMap(key => {
    const short = missing[key];
    const item = RESTOCK_ITEMS.find(entry => entry.key === key);
    if (!isRush || short <= 0 || !item) return [];
    return [{ key, label: key === "cupsM" ? "ly M" : "ly L", amount: item.amount,
      price: getRestockPrice(game, key) }];
  });

  return <>
    {available && <section className="shift-decision" aria-label="Kế hoạch bán hàng hôm nay">
      <h3>📋 Chọn nhịp bán hôm nay</h3>
      <p>Bơ gọi trà sữa truyền thống, Đức thích cacao nếu tiệm đã mở món. Cả hai ghé sớm trước giờ làm và không muốn chờ lâu.</p>
      {isRush && <p className="shift-request-preview" role="status">
        <b>Yêu cầu riêng:</b> {commuterRequests.map(request => request.hint).join(" · ")}. Đơn thực tế sẽ hiển thị lượng đường và đá tương ứng.
      </p>}
      {isRush && <div className="shift-preorders" aria-label="Lịch hai khách ghé sớm">
        <h4>🗓️ Khách hẹn trước giờ làm</h4>
        <ol>{commuterPreorders.map(visit => <li key={visit.index}>
          <strong>{visit.name} · ly {visit.size}</strong>
          <span>{visit.drink} · {visit.request}</span>
        </li>)}</ol>
        <small>Đây là hai đơn đầu tiên. Các khách còn lại chọn món khi đến.</small>
      </div>}
      <div className="shift-choices">
        <button type="button" className="shift-choice" aria-pressed={!isRush} onClick={() => onGame(previous => chooseShiftPlan(previous, "regular"))}>
          <b>☕ Ca thường</b><small>{normalOrders} ly · khách vào hàng cách nhau 10 giây</small>
        </button>
        <button type="button" className="shift-choice" aria-pressed={isRush} onClick={() => onGame(previous => chooseShiftPlan(previous, "rush"))}>
          <b>⚡ Ca đông khách</b><small>{normalOrders + 2} ly · 7 giây/khách · cỡ M/L luân phiên · điểm trung bình ≥80 thưởng 20.000 ₫ và 2 fan</small>
        </button>
      </div>
      {isRush && shortage > 0 && <p role="alert" className="shift-stock-warning">
        ⚠️ Còn thiếu {missing.cupsM} ly M và {missing.cupsL} ly L (tổng {shortage} cốc).
        <button type="button" onClick={() => onNavigate("stock")}>Nhập kho</button>
      </p>}
      {isRush && shortage > 0 && <div className="shift-stock-rescue" aria-label="Nhập nhanh ly còn thiếu">
        <p>Nhập thêm ly ngay tại quầy, hoặc chuyển sang ca thường nếu chưa đủ tiền.</p>
        {cupRescue.map(({ key, label, amount, price }) => <button key={key} type="button"
          disabled={game.cash < price} onClick={() => onGame(previous => restock(previous, key))}>
          Nhập nhanh +{amount} {label} · {formatMoney(price)}
        </button>)}
      </div>}
      {isRush && shortage === 0 && <p role="status" className="shift-ready-note">✓ Đã đủ {required.cupsM} ly M và {required.cupsL} ly L cho ca này. Trà và topping vẫn cần kiểm tra riêng nhé!</p>}
    </section>}
    <button type="button" className="primary-button prep-open" disabled={shortage > 0} onClick={() => onGame(previous => startDay(previous))}>
      <GameIcon name="home"/><span>Mở cửa tiệm<small>Bắt đầu ca · {game.targetOrders} đơn</small></span>
    </button>
  </>;
}
