import { DRINKS, RESTOCK_ITEMS, STAFF } from "../../game/content";
import { startDay } from "../../game/engine";
import type { GameState, Screen } from "../../game/types";
import { RoomBackdrop } from "./RoomBackdrop";


interface Props {
  game: GameState;
  onGame: (state: GameState) => void;
  onNavigate: (screen: Screen) => void;
}

export function PrepWorld({ game, onGame, onNavigate }: Props) {
  const visibleStock = RESTOCK_ITEMS.filter((item) => item.unlockLevel <= game.level);
  const lowStock = visibleStock.filter((item) => game.inventory[item.key] <= 3).slice(0, 4);
  const activeStaff = STAFF.find((staff) => staff.id === game.activeStaff);
  const xpInLevel = game.xp % 160;
  const nextDrink = Object.values(DRINKS)
    .filter((drink) => drink.unlockLevel > game.level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)[0];

  return (
    <section className="v6-room v6-prep-room">
      <RoomBackdrop kind="prep">
        <div className="v6-room-title">
          <small>CHUẨN BỊ CA · NGÀY {game.day}</small>
          <h2>{game.event.emoji} {game.event.name}</h2>
          <p>{game.event.description}</p>
        </div>

        <div className="v6-prep-clipboard">
          <div className="v6-clipboard-pin">✦</div>
          <div className="v6-clipboard-head">
            <span>CA HÔM NAY</span>
            <b>Lv.{game.level}</b>
          </div>
          <div className="v6-xp-line">
            <i style={{ width: `${(xpInLevel / 160) * 100}%` }} />
          </div>
          <small>{nextDrink ? `Lv.${nextDrink.unlockLevel} mở ${nextDrink.name}` : "Menu đã mở toàn bộ."}</small>

          <div className="v6-prep-stats">
            <div><span>🎯</span><b>{game.targetOrders}</b><small>đơn</small></div>
            <div><span>📱</span><b>{game.fans}</b><small>fan</small></div>
            <div><span>🔥</span><b>{game.viral}</b><small>viral</small></div>
            <div><span>🧠</span><b>{game.researchPoints}</b><small>RP</small></div>
          </div>

          <div className="v6-prep-meta">
            <p><span>👩🏻‍🍳</span>{activeStaff ? `${activeStaff.name} · ${activeStaff.role}` : "Chủ tiệm tự vận hành"}</p>
            <p><span>🍹</span>{game.unlockedBaseIds.length} món · {game.unlockedToppingIds.length} topping</p>
          </div>
        </div>

        {lowStock.length > 0 && (
          <button className="v6-stock-crate-alert" onClick={() => onNavigate("stock")}>
            <span>🧺</span>
            <div><b>Kho sắp cạn</b><small>{lowStock.map((item) => item.label).join(" · ")}</small></div>
            <i>→</i>
          </button>
        )}

        <div className="prep-greeting">

          <button className="v6-open-sign" onClick={() => onGame(startDay(game))}>
          <span className="v6-open-rope" />
          <small>SẴN SÀNG RỒI?</small>
          <b>MỞ TIỆM</b>
          <em>{game.targetOrders} đơn trong ca hôm nay</em>
          </button>
        </div>


      </RoomBackdrop>
    </section>
  );
}
