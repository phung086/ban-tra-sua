import { useEffect, useMemo, useState } from "react";
import { ChibiCustomer } from "./components/ChibiCustomer";
import { DrinkCup } from "./components/DrinkCup";
import { BASE_IDS, DRINKS, RESTOCK_ITEMS, TOPPING_IDS, TOPPINGS } from "./game/content";
import {
  createInitialState,
  formatMoney,
  getCustomer,
  nextDay,
  restock,
  serveCurrentDrink,
  startDay,
  updateDraft,
} from "./game/engine";
import { clearSave, loadGame, saveGame } from "./game/storage";
import type { BaseId, GameState, Screen, ToppingId } from "./game/types";

const stars = (value: number) => "★".repeat(value) + "☆".repeat(5 - value);

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame());
  const [screen, setScreen] = useState<Screen>("shop");

  useEffect(() => {
    saveGame(game);
  }, [game]);

  const order = game.currentOrder;
  const customer = useMemo(
    () => (order ? getCustomer(order.customerId) : getCustomer("miu")),
    [order],
  );

  const resetProgress = () => {
    if (!window.confirm("Xóa toàn bộ tiến trình và mở lại tiệm từ ngày 1?")) return;
    clearSave();
    setGame(createInitialState());
    setScreen("shop");
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">🧋</div>
          <div>
            <p>TIỆM TRÀ</p>
            <h1>Chibi</h1>
          </div>
        </div>
        <div className="top-stats">
          <div className="stat-pill coin"><span>🪙</span><b>{formatMoney(game.cash)}</b></div>
          <div className="stat-pill heart"><span>💗</span><b>{game.reputation}</b></div>
          <div className="stat-pill day"><span>🌸</span><b>Ngày {game.day}</b></div>
        </div>
      </header>

      <section className="content">
        <div className="notice-card">
          <span className="notice-icon">{game.lastScore !== null ? "✨" : "💌"}</span>
          <p>{game.notice}</p>
          {game.lastScore !== null && <b>{game.lastScore}/100</b>}
        </div>

        {screen === "shop" && (
          <ShopScreen
            game={game}
            onGame={setGame}
            customer={customer}
          />
        )}

        {screen === "stock" && (
          <StockScreen game={game} onGame={setGame} />
        )}

        {screen === "reviews" && (
          <ReviewsScreen game={game} onReset={resetProgress} />
        )}
      </section>

      <nav className="bottom-nav" aria-label="Điều hướng chính">
        <button className={screen === "shop" ? "active" : ""} onClick={() => setScreen("shop")}>
          <span>🧋</span><b>Pha chế</b>
        </button>
        <button className={screen === "stock" ? "active" : ""} onClick={() => setScreen("stock")}>
          <span>🧺</span><b>Kho</b>
        </button>
        <button className={screen === "reviews" ? "active" : ""} onClick={() => setScreen("reviews")}>
          <span>💬</span><b>Đánh giá</b>
          {game.reviews.length > 0 && <i>{Math.min(9, game.reviews.length)}</i>}
        </button>
      </nav>
    </main>
  );
}

interface ShopProps {
  game: GameState;
  onGame: (state: GameState) => void;
  customer: ReturnType<typeof getCustomer>;
}

function ShopScreen({ game, onGame, customer }: ShopProps) {
  if (game.phase === "prep") {
    const lowStock = RESTOCK_ITEMS.filter((item) => game.inventory[item.key] <= 3).slice(0, 3);
    return (
      <section className="prep-layout">
        <div className="shop-scene prep-scene">
          <div className="awning"><span /><span /><span /><span /><span /></div>
          <div className="shop-sign"><span>♡</span> Tiệm Trà Chibi <span>♡</span></div>
          <div className="window-panel">
            <div className="cloud cloud-a" />
            <div className="cloud cloud-b" />
            <div className="shelf">
              <i>🫙</i><i>🍵</i><i>🧋</i><i>🍑</i>
            </div>
          </div>
          <div className="counter-front">
            <div className="counter-flower">🌼</div>
            <div className="counter-logo">milk &amp; love</div>
            <div className="counter-flower">🌼</div>
          </div>
        </div>

        <div className="panel prep-card">
          <span className="eyebrow">CHUẨN BỊ CA · NGÀY {game.day}</span>
          <h2>Tiệm sắp mở cửa rồi! 🌷</h2>
          <p>Kiểm tra nhanh nguyên liệu rồi bắt đầu phục vụ {game.targetOrders} vị khách đầu tiên nhé.</p>
          <div className="prep-summary">
            <div><span>🎯</span><b>{game.targetOrders}</b><small>đơn mục tiêu</small></div>
            <div><span>🪙</span><b>{formatMoney(game.cash)}</b><small>vốn hiện có</small></div>
            <div><span>✨</span><b>{game.xp}</b><small>kinh nghiệm</small></div>
          </div>
          {lowStock.length > 0 && (
            <div className="low-stock">
              <b>Nhắc nhẹ từ kho</b>
              <p>{lowStock.map((item) => item.label).join(", ")} đang hơi ít.</p>
            </div>
          )}
          <button className="primary-button jumbo" onClick={() => onGame(startDay(game))}>
            <span>🌸</span> Mở cửa đón khách
          </button>
        </div>
      </section>
    );
  }

  if (game.phase === "summary" && game.summary) {
    const summary = game.summary;
    return (
      <section className="summary-wrap">
        <div className="panel summary-card">
          <div className="summary-mascot">🎀</div>
          <span className="eyebrow">TỔNG KẾT NGÀY {summary.day}</span>
          <h2>Một ngày ngọt ngào đã xong!</h2>
          <p className="summary-score">Điểm pha chế trung bình <b>{summary.averageScore}/100</b></p>
          <div className="summary-grid">
            <div><span>🧾</span><small>Đơn đã phục vụ</small><b>{summary.orders}</b></div>
            <div><span>💰</span><small>Doanh thu</small><b>{formatMoney(summary.revenue)}</b></div>
            <div><span>🧺</span><small>Chi phí</small><b>-{formatMoney(summary.ingredientCost)}</b></div>
            <div className="profit"><span>✨</span><small>Lợi nhuận</small><b>{formatMoney(summary.profit)}</b></div>
          </div>
          <button className="primary-button jumbo" onClick={() => onGame(nextDay(game))}>
            Sang ngày {game.day + 1} <span>→</span>
          </button>
        </div>
      </section>
    );
  }

  if (!game.currentOrder) return null;
  const order = game.currentOrder;
  const progress = (game.served / game.targetOrders) * 100;

  return (
    <section className="game-layout">
      <div className="play-column">
        <div className="shop-scene live-scene">
          <div className="scene-sky">
            <span className="scene-cloud c1" />
            <span className="scene-cloud c2" />
            <span className="hanging-lamp">💡</span>
          </div>
          <div className="awning mini"><span /><span /><span /><span /><span /></div>
          <div className="customer-zone">
            <div className="speech-bubble">
              <small>{customer.name} nói</small>
              <p>{customer.greeting}</p>
            </div>
            <ChibiCustomer customer={customer} talking />
          </div>
          <div className="counter-edge">
            <span>🌷</span><b>made with love</b><span>🌷</span>
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-row">
            <span>Ca hôm nay</span>
            <b>{game.served}/{game.targetOrders} đơn</b>
          </div>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="order-ticket">
          <div className="ticket-pin">📌</div>
          <div className="ticket-head">
            <div>
              <span className="eyebrow">ORDER #{game.served + 1}</span>
              <h3>{DRINKS[order.base].name}</h3>
            </div>
            <b>{formatMoney(order.price)}</b>
          </div>
          <div className="order-chips">
            <span>🥤 Size {order.size}</span>
            <span>🍬 {order.sugar}% đường</span>
            <span>🧊 {order.ice}% đá</span>
            <span>{TOPPINGS[order.topping].emoji} {TOPPINGS[order.topping].name}</span>
          </div>
        </div>
      </div>

      <div className="panel workstation">
        <div className="workstation-head">
          <div>
            <span className="eyebrow">QUẦY PHA CHẾ</span>
            <h2>Tạo chiếc ly thật chuẩn</h2>
          </div>
          <span className="workstation-badge">✨ tay nghề +XP</span>
        </div>

        <div className="craft-grid">
          <DrinkCup draft={game.draft} />

          <div className="craft-controls">
            <ControlGroup title="1. Chọn món" icon="🫖">
              <div className="choice-grid drink-choices">
                {BASE_IDS.map((id) => {
                  const drink = DRINKS[id];
                  const selected = game.draft.base === id;
                  return (
                    <button
                      key={id}
                      className={`choice-card ${selected ? "selected" : ""}`}
                      onClick={() => onGame(updateDraft(game, { base: id as BaseId, sealed: false }))}
                    >
                      <span>{drink.emoji}</span>
                      <b>{drink.name}</b>
                      <small>Còn {game.inventory[drink.ingredient]}</small>
                    </button>
                  );
                })}
              </div>
            </ControlGroup>

            <div className="two-col-controls">
              <ControlGroup title="2. Size ly" icon="🥤">
                <div className="segmented">
                  {(["M", "L"] as const).map((size) => (
                    <button
                      key={size}
                      className={game.draft.size === size ? "selected" : ""}
                      onClick={() => onGame(updateDraft(game, { size, sealed: false }))}
                    >
                      {size}<small>còn {game.inventory[size === "M" ? "cupsM" : "cupsL"]}</small>
                    </button>
                  ))}
                </div>
              </ControlGroup>

              <ControlGroup title="3. Topping" icon="🍮">
                <select
                  className="cute-select"
                  value={game.draft.topping}
                  onChange={(event) => onGame(updateDraft(game, { topping: event.target.value as ToppingId, sealed: false }))}
                >
                  {TOPPING_IDS.map((id) => (
                    <option value={id} key={id}>{TOPPINGS[id].emoji} {TOPPINGS[id].name}</option>
                  ))}
                </select>
              </ControlGroup>
            </div>

            <ControlGroup title="4. Định lượng" icon="🎚️">
              <div className="meters">
                <Meter
                  label="Đường"
                  icon="🍬"
                  value={game.draft.sugar}
                  onChange={(value) => onGame(updateDraft(game, { sugar: value, sealed: false }))}
                />
                <Meter
                  label="Đá"
                  icon="🧊"
                  value={game.draft.ice}
                  onChange={(value) => onGame(updateDraft(game, { ice: value, sealed: false }))}
                />
              </div>
            </ControlGroup>

            <div className="finish-actions">
              <button
                className={`seal-button ${game.draft.sealed ? "sealed" : ""}`}
                onClick={() => onGame(updateDraft(game, { sealed: !game.draft.sealed }))}
              >
                <span>{game.draft.sealed ? "🎀" : "🔘"}</span>
                {game.draft.sealed ? "Đã đóng nắp" : "Đóng nắp ly"}
              </button>
              <button className="primary-button serve-button" onClick={() => onGame(serveCurrentDrink(game))}>
                <span>💗</span> Giao cho {customer.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlGroup({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="control-group">
      <h4><span>{icon}</span>{title}</h4>
      {children}
    </div>
  );
}

function Meter({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="meter">
      <div><span>{icon} {label}</span><b>{value}%</b></div>
      <input
        type="range"
        min="0"
        max="100"
        step="10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="meter-marks"><span>0%</span><span>50%</span><span>100%</span></div>
    </label>
  );
}

function StockScreen({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  return (
    <section className="panel stock-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">KHO NGUYÊN LIỆU</span>
          <h2>Góc nhập hàng 🧺</h2>
          <p>Nhập theo lô nhỏ để không bị kẹt vốn. Kho được lưu tự động trên máy.</p>
        </div>
        <div className="wallet-card"><small>Ví của tiệm</small><b>{formatMoney(game.cash)}</b></div>
      </div>
      <div className="stock-grid">
        {RESTOCK_ITEMS.map((item) => {
          const low = game.inventory[item.key] <= 3;
          return (
            <article className={`stock-item ${low ? "low" : ""}`} key={item.key}>
              <div className="stock-emoji">{item.emoji}</div>
              <div className="stock-info">
                <small>{low ? "Sắp hết" : "Trong kho"}</small>
                <h3>{item.label}</h3>
                <p>Còn <b>{game.inventory[item.key]}</b> · Nhập +{item.amount}</p>
              </div>
              <button
                onClick={() => onGame(restock(game, item.key))}
                disabled={game.cash < item.price}
              >
                + {formatMoney(item.price)}
              </button>
            </article>
          );
        })}
      </div>
      <div className="stock-tip">💡 <b>Mẹo:</b> Có thể ghé kho cả trong ca. Bản mở rộng sau sẽ thêm hạn sử dụng, batch và nhà cung cấp.</div>
    </section>
  );
}

function ReviewsScreen({ game, onReset }: { game: GameState; onReset: () => void }) {
  const average = game.reviews.length
    ? game.reviews.reduce((total, item) => total + item.stars, 0) / game.reviews.length
    : 0;

  return (
    <section className="reviews-layout">
      <div className="panel review-overview">
        <span className="eyebrow">SỔ TAY KHÁCH HÀNG</span>
        <h2>Hôm nay khách nói gì? 💬</h2>
        <div className="rating-hero">
          <b>{average ? average.toFixed(1) : "—"}</b>
          <div>
            <span>{stars(Math.round(average))}</span>
            <small>{game.reviews.length} đánh giá đã nhận</small>
          </div>
        </div>
        <div className="mini-stats">
          <div><span>💗</span><b>{game.reputation}</b><small>uy tín</small></div>
          <div><span>✨</span><b>{game.xp}</b><small>XP</small></div>
          <div><span>📅</span><b>{game.day}</b><small>ngày mở tiệm</small></div>
        </div>
        <button className="ghost-danger" onClick={onReset}>Xóa save &amp; chơi lại</button>
      </div>

      <div className="review-feed">
        {game.reviews.length === 0 ? (
          <div className="panel empty-reviews">
            <div>🐰</div>
            <h3>Chưa có review nào</h3>
            <p>Mở cửa, pha vài ly rồi quay lại đây. Khách chibi đang chuẩn bị “đánh giá có tâm” đó!</p>
          </div>
        ) : (
          game.reviews.map((review) => (
            <article className="panel review-card" key={review.id}>
              <div className="review-avatar">{review.customerName.slice(0, 1)}</div>
              <div>
                <div className="review-meta">
                  <b>{review.customerName}</b>
                  <span>Ngày {review.day}</span>
                </div>
                <div className="review-stars">{stars(review.stars)} <small>{review.score}/100</small></div>
                <p>{review.text}</p>
                <button className="reply-chip">↩ Rep khách <span>sắp mở</span></button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default App;
