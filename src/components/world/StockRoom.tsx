import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { RESTOCK_ITEMS } from "../../game/content";
import { formatMoney, getRestockPrice, restock } from "../../game/engine";
import type { GameState } from "../../game/types";
import { RoomBackdrop } from "./RoomBackdrop";

interface Props {
  game: GameState;
  onGame: (state: GameState) => void;
}

export function StockRoom({ game, onGame }: Props) {
  const availableItems = RESTOCK_ITEMS.filter((item) => item.unlockLevel <= game.level);
  const [selectedKey, setSelectedKey] = useState(availableItems[0]?.key ?? null);
  const selected = useMemo(
    () => availableItems.find((item) => item.key === selectedKey) ?? availableItems[0],
    [availableItems, selectedKey],
  );
  const lockedCount = RESTOCK_ITEMS.length - availableItems.length;

  return (
    <section className="v6-room v6-stock-room">
      <RoomBackdrop kind="stock">
        <div className="v6-room-title">
          <small>PANTRY · FRESHNESS · WASTE</small>
          <h2>Kho sau quầy</h2>
          <p>Chạm trực tiếp vào hũ hoặc khay trên kệ để nhập hàng.</p>
        </div>

        <div className="v6-pantry-magnets">
          <span>🧊 Tủ mát Lv.{game.upgrades.fridge}</span>
          <span>🗑️ Hao hụt {formatMoney(game.stats.waste)}</span>
          <span>🔒 {lockedCount} chưa mở</span>
        </div>

        <div className="v6-pantry-shelf-grid">
          {availableItems.map((item, index) => {
            const low = game.inventory[item.key] <= 3;
            const freshness = game.freshness[item.key] ?? 100;
            const selectedItem = selected?.key === item.key;
            return (
              <button
                key={item.key}
                className={`v6-pantry-item ${low ? "low" : ""} ${selectedItem ? "selected" : ""}`}
                onClick={() => setSelectedKey(item.key)}
                style={{ "--pantry-index": index } as CSSProperties}
              >
                <span className="v6-jar-lid" />
                <strong>{item.emoji}</strong>
                <b>{item.label}</b>
                <small>{game.inventory[item.key]}</small>
                {item.perishable && <i style={{ height: `${Math.max(8, freshness)}%` }} />}
                {low && <em>!</em>}
              </button>
            );
          })}
        </div>

        {selected && (() => {
          const price = getRestockPrice(game, selected.key);
          const freshness = game.freshness[selected.key] ?? 100;
          const low = game.inventory[selected.key] <= 3;
          return (
            <aside className="v6-pantry-drawer">
              <div className="v6-drawer-tab">STOCK CARD</div>
              <div className="v6-stock-hero">{selected.emoji}</div>
              <div>
                <small>{low ? "SẮP HẾT" : selected.perishable ? "HÀNG TƯƠI" : "HÀNG KHÔ"}</small>
                <h3>{selected.label}</h3>
                <p>Còn <b>{game.inventory[selected.key]}</b> · nhập thêm <b>{selected.amount}</b></p>
              </div>
              {selected.perishable && (
                <div className="v6-freshness-meter">
                  <span>Freshness</span>
                  <div><i style={{ width: `${freshness}%` }} /></div>
                  <b>{freshness}%</b>
                </div>
              )}
              <button disabled={game.cash < price} onClick={() => onGame(restock(game, selected.key))}>
                <span>🪙</span>
                <b>Nhập +{selected.amount}</b>
                <strong>{formatMoney(price)}</strong>
              </button>
              <small className="v6-drawer-tip">Kiki giảm 10% giá nhập · tủ mát giữ freshness lâu hơn.</small>
            </aside>
          );
        })()}

        <div className="v6-pantry-cash">
          <small>TIỀN QUỸ</small>
          <b>{formatMoney(game.cash)}</b>
        </div>
      </RoomBackdrop>
    </section>
  );
}
