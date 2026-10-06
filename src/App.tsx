import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChibiCustomer } from "./components/ChibiCustomer";
import { DrinkCup } from "./components/DrinkCup";\nimport { OrderServicePanel } from "./components/OrderServicePanel";
import {
  ACHIEVEMENTS,
  DRINKS,
  RESTOCK_ITEMS,
  STAFF,
  TOPPINGS,
  UPGRADES,
} from "./game/content";
import {
  buyUpgrade,
  claimQuest,
  createInitialState,
  formatMoney,
  getCustomer,
  getRestockPrice,
  getUpgradeCost,
  hireStaff,
  nextDay,
  replyToReview,
  restock,
  serveCurrentDrink,
  setActiveStaff,
  startDay,
  updateDraft,
} from "./game/engine";
import { clearSave, loadGame, saveGame } from "./game/storage";
import type {
  BaseId,
  GameState,
  ReplyStyle,
  Screen,
  StaffId,
  ToppingId,
  UpgradeId,
} from "./game/types";

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
  const claimable = game.quests.filter((quest) => !quest.claimed && quest.progress >= quest.target).length;
  const unreplied = game.reviews.filter((review) => !review.replyStyle).length;

  const resetProgress = () => {
    if (!window.confirm("Xóa toàn bộ tiến trình và mở lại tiệm từ ngày 1?")) return;
    clearSave();
    setGame(createInitialState());
    setScreen("shop");
  };

  return (
    <main className="app-shell v2-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar v2-topbar">
        <div className="brand">
          <div className="brand-mark">🧋</div>
          <div>
            <p>TIỆM TRÀ</p>
            <h1>Chibi</h1>
          </div>
        </div>
        <div className="top-stats v2-stats">
          <div className="stat-pill coin"><span>🪙</span><b>{formatMoney(game.cash)}</b></div>
          <div className="stat-pill heart"><span>💗</span><b>{game.reputation}</b></div>
          <div className="stat-pill fans"><span>📱</span><b>{game.fans}</b></div>
          <div className="stat-pill level"><span>✨</span><b>Lv.{game.level}</b></div>
          <div className="stat-pill day"><span>🌸</span><b>Ngày {game.day}</b></div>
        </div>
      </header>

      <section className="content">
        <div className="notice-card v2-notice">
          <span className="notice-icon">{game.lastScore !== null ? "✨" : game.event.emoji}</span>
          <p>{game.notice}</p>
          {game.lastScore !== null && <b>{game.lastScore}/100</b>}
        </div>

        {screen === "shop" && (
          <ShopScreen game={game} onGame={setGame} customer={customer} onNavigate={setScreen} />
        )}
        {screen === "stock" && <StockScreen game={game} onGame={setGame} />}
        {screen === "upgrades" && <UpgradesScreen game={game} onGame={setGame} />}
        {screen === "reviews" && <ReviewsScreen game={game} onGame={setGame} onReset={resetProgress} />}
        {screen === "goals" && <GoalsScreen game={game} onGame={setGame} />}
      </section>

      <nav className="bottom-nav v2-nav" aria-label="Điều hướng chính">
        <NavButton active={screen === "shop"} icon="🧋" label="Pha chế" onClick={() => setScreen("shop")} />
        <NavButton active={screen === "stock"} icon="🧺" label="Kho" onClick={() => setScreen("stock")} />
        <NavButton active={screen === "upgrades"} icon="🛠️" label="Nâng cấp" onClick={() => setScreen("upgrades")} />
        <NavButton active={screen === "reviews"} icon="💬" label="Review" badge={unreplied} onClick={() => setScreen("reviews")} />
        <NavButton active={screen === "goals"} icon="🎯" label="Mục tiêu" badge={claimable} onClick={() => setScreen("goals")} />
      </nav>
    </main>
  );
}

function NavButton({
  active,
  icon,
  label,
  badge = 0,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      <span>{icon}</span><b>{label}</b>
      {badge > 0 && <i>{Math.min(9, badge)}</i>}
    </button>
  );
}

interface ShopProps {
  game: GameState;
  onGame: (state: GameState) => void;
  customer: ReturnType<typeof getCustomer>;
  onNavigate: (screen: Screen) => void;
}

function ShopScreen({ game, onGame, customer, onNavigate }: ShopProps) {\n  const [orderFocus, setOrderFocus] = useState(false);\n\n  useEffect(() => {\n    setOrderFocus(false);\n  }, [game.currentOrder?.id]);
  if (game.phase === "prep") {
    const visibleStock = RESTOCK_ITEMS.filter((item) => item.unlockLevel <= game.level);
    const lowStock = visibleStock.filter((item) => game.inventory[item.key] <= 3).slice(0, 4);
    const activeStaff = STAFF.find((staff) => staff.id === game.activeStaff);
    const xpInLevel = game.xp % 160;
    const nextDrink = Object.values(DRINKS)
      .filter((drink) => drink.unlockLevel > game.level)
      .sort((a, b) => a.unlockLevel - b.unlockLevel)[0];

    return (
      <section className="prep-layout v2-prep">
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
          <div className="event-banner">
            <span>{game.event.emoji}</span>
            <div><b>{game.event.name}</b><small>{game.event.description}</small></div>
          </div>
          <div className="counter-front">
            <div className="counter-flower">🌼</div>
            <div className="counter-logo">milk &amp; love</div>
            <div className="counter-flower">🌼</div>
          </div>
        </div>

        <div className="panel prep-card v2-prep-card">
          <span className="eyebrow">CHUẨN BỊ CA · NGÀY {game.day}</span>
          <h2>Hôm nay tiệm có gì mới? 🌷</h2>
          <p>{game.event.description}</p>

          <div className="level-card">
            <div className="level-row">
              <span>✨ Level {game.level}</span>
              <b>{xpInLevel}/160 XP</b>
            </div>
            <div className="level-track"><i style={{ width: `${(xpInLevel / 160) * 100}%` }} /></div>
            <small>{nextDrink ? `Level ${nextDrink.unlockLevel} mở ${nextDrink.name}` : "Menu hiện tại đã mở toàn bộ món."}</small>
          </div>

          <div className="prep-summary v2-summary">
            <div><span>🎯</span><b>{game.targetOrders}</b><small>đơn mục tiêu</small></div>
            <div><span>📱</span><b>{game.fans}</b><small>fan theo dõi</small></div>
            <div><span>🔥</span><b>{game.viral}</b><small>điểm viral</small></div>
          </div>

          <div className="prep-brief">
            <div>
              <span>👩🏻‍🍳</span>
              <p><b>Nhân sự:</b> {activeStaff ? `${activeStaff.name} · ${activeStaff.role}` : "Chủ tiệm tự vận hành"}</p>
            </div>
            <div>
              <span>🍹</span>
              <p><b>Menu:</b> {game.unlockedBaseIds.length} món · {game.unlockedToppingIds.length} topping</p>
            </div>
          </div>

          {lowStock.length > 0 && (
            <button className="low-stock low-stock-button" onClick={() => onNavigate("stock")}>
              <span>🧺</span>
              <div><b>Kho cần chú ý</b><p>{lowStock.map((item) => item.label).join(", ")}</p></div>
              <i>→</i>
            </button>
          )}

          <button className="primary-button jumbo" onClick={() => onGame(startDay(game))}>
            <span>🌸</span> Mở cửa · {game.targetOrders} order
          </button>
        </div>
      </section>
    );
  }

  if (game.phase === "summary" && game.summary) {
    const summary = game.summary;
    const claimable = game.quests.filter((quest) => !quest.claimed && quest.progress >= quest.target).length;
    return (
      <section className="summary-wrap">
        <div className="panel summary-card v2-summary-card">
          <div className="summary-mascot">🎀</div>
          <span className="eyebrow">TỔNG KẾT NGÀY {summary.day} · {summary.eventName}</span>
          <h2>Một ca bán hàng thật trọn vẹn!</h2>
          <p className="summary-score">Điểm trung bình <b>{summary.averageScore}/100</b> · Combo tốt nhất <b>x{summary.bestCombo}</b></p>
          <div className="summary-grid v2-summary-grid">
            <div><span>🧾</span><small>Đơn hoàn tất</small><b>{summary.orders}</b></div>
            <div><span>✨</span><small>Ly perfect</small><b>{summary.perfectOrders}</b></div>
            <div><span>💰</span><small>Doanh thu</small><b>{formatMoney(summary.revenue)}</b></div>
            <div><span>🧺</span><small>Chi phí + hao hụt</small><b>-{formatMoney(summary.ingredientCost)}</b></div>
            <div><span>📱</span><small>Fan tăng</small><b>+{summary.fansGained}</b></div>
            <div className="profit"><span>🌷</span><small>Lợi nhuận</small><b>{formatMoney(summary.profit)}</b></div>
          </div>
          {claimable > 0 && (
            <button className="summary-quest-link" onClick={() => onNavigate("goals")}>
              🎁 Có {claimable} nhiệm vụ đã hoàn thành đang chờ nhận thưởng
            </button>
          )}
          <button className="primary-button jumbo" onClick={() => onGame(nextDay(game))}>
            Chuẩn bị ngày {game.day + 1} <span>→</span>
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
            <span className="hanging-lamp">{game.event.emoji}</span>
          </div>
          <div className="awning mini"><span /><span /><span /><span /><span /></div>
          <div className="customer-zone">
            <div className="speech-bubble">
              <small>{customer.name} · {customer.archetype}</small>
              <p>{customer.greeting}</p>
            </div>
            <ChibiCustomer customer={customer} talking />
          </div>
          <div className="counter-edge">
            <span>🌷</span><b>{game.combo > 1 ? `COMBO x${game.combo}` : "made with love"}</b><span>🌷</span>
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-row">
            <span>{game.event.emoji} {game.event.name}</span>
            <b>{game.served}/{game.targetOrders} đơn</b>
          </div>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
        </div>

        <div className={`order-ticket v2-ticket ${orderFocus ? "is-memory-mode" : ""}`}>
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
            <span>🫗 Rót {order.targetFill}%</span>
            <span>🌀 Lắc {order.targetShake}%</span>
          </div>
        </div>
      </div>

      <div className="panel workstation">
        <div className="workstation-head">
          <div>
            <span className="eyebrow">QUẦY PHA CHẾ · COMBO x{game.combo}</span>
            <h2>Đọc order, pha bằng tay</h2>
          </div>
          <span className="workstation-badge">🔥 best x{game.bestCombo}</span>
        </div>

        <div className="craft-grid">
          <DrinkCup draft={game.draft} />

          <div className="craft-controls">
            <ControlGroup title="1. Chọn nền trà" icon="🫖">
              <div className="choice-grid drink-choices v2-drink-choices">
                {game.unlockedBaseIds.map((id) => {
                  const drink = DRINKS[id];
                  const selected = game.draft.base === id;
                  const freshness = game.freshness[drink.ingredient] ?? 100;
                  return (
                    <button
                      key={id}
                      className={`choice-card ${selected ? "selected" : ""}`}
                      onClick={() => onGame(updateDraft(game, { base: id as BaseId, sealed: false }))}
                    >
                      <span>{drink.emoji}</span>
                      <b>{drink.shortName}</b>
                      <small>Còn {game.inventory[drink.ingredient]} · {freshness}% tươi</small>
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
                  {game.unlockedToppingIds.map((id) => (
                    <option value={id} key={id}>{TOPPINGS[id].emoji} {TOPPINGS[id].name}</option>
                  ))}
                </select>
              </ControlGroup>
            </div>

            <ControlGroup title="4. Công thức" icon="🎚️">
              <div className="meters v2-meters">
                <Meter label="Đường" icon="🍬" value={game.draft.sugar} onChange={(value) => onGame(updateDraft(game, { sugar: value, sealed: false }))} />
                <Meter label="Đá" icon="🧊" value={game.draft.ice} onChange={(value) => onGame(updateDraft(game, { ice: value, sealed: false }))} />
              </div>
            </ControlGroup>

            <ControlGroup title="5. Kỹ thuật tay" icon="🪄">
              <div className="meters v2-meters">
                <Meter label="Mức rót" icon="🫗" value={game.draft.fill} onChange={(value) => onGame(updateDraft(game, { fill: value, sealed: false }))} />
                <Meter label="Độ lắc" icon="🌀" value={game.draft.shake} onChange={(value) => onGame(updateDraft(game, { shake: value, sealed: false }))} />
              </div>
            </ControlGroup>

            <div className="finish-actions">
              <button
                className={`seal-button ${game.draft.sealed ? "sealed" : ""}`}
                onClick={() => onGame(updateDraft(game, { sealed: !game.draft.sealed }))}
              >
                <span>{game.draft.sealed ? "🎀" : "🔘"}</span>
                {game.draft.sealed ? "Nắp đã chuẩn" : "Dập nắp ly"}
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

function ControlGroup({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
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
      <input type="range" min="0" max="100" step="10" value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <div className="meter-marks"><span>0%</span><span>50%</span><span>100%</span></div>
    </label>
  );
}

function StockScreen({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  const availableItems = RESTOCK_ITEMS.filter((item) => item.unlockLevel <= game.level);
  const lockedCount = RESTOCK_ITEMS.length - availableItems.length;
  return (
    <section className="panel stock-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">KHO · FRESHNESS · WASTE</span>
          <h2>Kho nguyên liệu thông minh 🧺</h2>
          <p>Nguyên liệu tươi giảm chất lượng theo ngày. Nâng tủ mát để giữ hàng lâu hơn và giảm tiền bị mất vì quá hạn.</p>
        </div>
        <div className="wallet-card"><small>Ví của tiệm</small><b>{formatMoney(game.cash)}</b></div>
      </div>

      <div className="stock-overview">
        <div><span>🧊</span><b>Lv.{game.upgrades.fridge}</b><small>tủ mát</small></div>
        <div><span>🗑️</span><b>{formatMoney(game.stats.waste)}</b><small>hao hụt lifetime</small></div>
        <div><span>🔒</span><b>{lockedCount}</b><small>mặt hàng chưa mở</small></div>
      </div>

      <div className="stock-grid">
        {availableItems.map((item) => {
          const low = game.inventory[item.key] <= 3;
          const freshness = game.freshness[item.key] ?? 100;
          const price = getRestockPrice(game, item.key);
          return (
            <article className={`stock-item v2-stock-item ${low ? "low" : ""}`} key={item.key}>
              <div className="stock-emoji">{item.emoji}</div>
              <div className="stock-info">
                <small>{low ? "Sắp hết" : item.perishable ? `Độ tươi ${freshness}%` : "Không hết hạn"}</small>
                <h3>{item.label}</h3>
                <p>Còn <b>{game.inventory[item.key]}</b> · Nhập +{item.amount}</p>
                {item.perishable && <div className="fresh-track"><i style={{ width: `${freshness}%` }} /></div>}
              </div>
              <button onClick={() => onGame(restock(game, item.key))} disabled={game.cash < price}>
                + {formatMoney(price)}
              </button>
            </article>
          );
        })}
      </div>
      <div className="stock-tip">💡 <b>Chiến thuật:</b> Kiki giảm 10% giá nhập; tủ mát giảm tốc độ xuống freshness mỗi ngày.</div>
    </section>
  );
}

function UpgradesScreen({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  return (
    <section className="management-layout">
      <div className="panel management-panel">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">THIẾT BỊ & KHÔNG GIAN</span>
            <h2>Nâng cấp tiệm 🛠️</h2>
            <p>Mỗi cấp thay đổi trực tiếp economy, chất lượng pha chế hoặc độ tươi của kho.</p>
          </div>
        </div>
        <div className="upgrade-grid">
          {UPGRADES.map((upgrade) => {
            const level = game.upgrades[upgrade.id];
            const cost = getUpgradeCost(game, upgrade.id);
            const maxed = level >= upgrade.maxLevel;
            return (
              <article className="upgrade-card" key={upgrade.id}>
                <div className="upgrade-icon">{upgrade.emoji}</div>
                <div className="upgrade-copy">
                  <div className="upgrade-title"><b>{upgrade.name}</b><span>Lv.{level}/{upgrade.maxLevel}</span></div>
                  <p>{upgrade.description}</p>
                  <div className="upgrade-pips">
                    {Array.from({ length: upgrade.maxLevel }).map((_, index) => <i className={index < level ? "on" : ""} key={index} />)}
                  </div>
                </div>
                <button
                  className="upgrade-buy"
                  disabled={maxed || game.cash < cost}
                  onClick={() => onGame(buyUpgrade(game, upgrade.id as UpgradeId))}
                >
                  {maxed ? "MAX" : formatMoney(cost)}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel management-panel">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">NHÂN SỰ</span>
            <h2>Team chibi 👩🏻‍🍳</h2>
            <p>Chỉ một nhân viên trực ca tại một thời điểm, nên hãy chọn theo chiến thuật hôm đó.</p>
          </div>
        </div>
        <div className="staff-grid">
          {STAFF.map((staff) => {
            const hired = game.hiredStaff.includes(staff.id);
            const active = game.activeStaff === staff.id;
            return (
              <article className={`staff-card ${active ? "active" : ""}`} key={staff.id}>
                <div className="staff-avatar">{staff.emoji}</div>
                <div>
                  <span>{staff.role}</span>
                  <h3>{staff.name}</h3>
                  <p>{staff.description}</p>
                </div>
                {hired ? (
                  <button className={active ? "staff-active" : ""} onClick={() => onGame(setActiveStaff(game, staff.id as StaffId))}>
                    {active ? "Đang trực ✓" : "Cho trực"}
                  </button>
                ) : (
                  <button disabled={game.cash < staff.hireCost} onClick={() => onGame(hireStaff(game, staff.id as StaffId))}>
                    Tuyển · {formatMoney(staff.hireCost)}
                  </button>
                )}
              </article>
            );
          })}
        </div>
        {game.activeStaff && <button className="solo-shift" onClick={() => onGame(setActiveStaff(game, null))}>Ca sau chủ tiệm tự làm</button>}
      </div>
    </section>
  );
}

function ReviewsScreen({
  game,
  onGame,
  onReset,
}: {
  game: GameState;
  onGame: (state: GameState) => void;
  onReset: () => void;
}) {
  const average = game.reviews.length
    ? game.reviews.reduce((total, item) => total + item.stars, 0) / game.reviews.length
    : 0;
  const replyStyles: Array<{ id: ReplyStyle; emoji: string; label: string; hint: string }> = [
    { id: "sweet", emoji: "💗", label: "Ngọt ngào", hint: "+uy tín" },
    { id: "witty", emoji: "😌", label: "Duyên", hint: "+fan +viral" },
    { id: "spicy", emoji: "🔥", label: "Cà khịa", hint: "viral mạnh" },
  ];

  return (
    <section className="reviews-layout">
      <div className="panel review-overview">
        <span className="eyebrow">REVIEW → REP → VIRAL</span>
        <h2>Tiệm đang được nói gì? 💬</h2>
        <div className="rating-hero">
          <b>{average ? average.toFixed(1) : "—"}</b>
          <div>
            <span>{stars(Math.round(average))}</span>
            <small>{game.reviews.length} đánh giá · {game.stats.replies} đã rep</small>
          </div>
        </div>
        <div className="mini-stats v2-mini-stats">
          <div><span>💗</span><b>{game.reputation}</b><small>uy tín</small></div>
          <div><span>📱</span><b>{game.fans}</b><small>fan</small></div>
          <div><span>🔥</span><b>{game.viral}</b><small>viral</small></div>
        </div>
        <div className="social-explainer">
          <p><b>💗 Ngọt:</b> an toàn, tăng uy tín.</p>
          <p><b>😌 Duyên:</b> cân bằng giữa hình ảnh và viral.</p>
          <p><b>🔥 Cà khịa:</b> kéo fan mạnh nhưng có thể mất uy tín.</p>
        </div>
        <button className="ghost-danger" onClick={onReset}>Xóa save &amp; chơi lại</button>
      </div>

      <div className="review-feed">
        {game.reviews.length === 0 ? (
          <div className="panel empty-reviews">
            <div>🐰</div>
            <h3>Chưa có review nào</h3>
            <p>Mở cửa và phục vụ khách. Mỗi ly sẽ tạo một phản hồi có thể rep để xây cộng đồng cho tiệm.</p>
          </div>
        ) : (
          game.reviews.map((review) => (
            <article className={`panel review-card v2-review-card ${review.replyStyle ? "replied" : ""}`} key={review.id}>
              <div className="review-avatar">{review.customerName.slice(0, 1)}</div>
              <div>
                <div className="review-meta">
                  <b>{review.customerName}</b>
                  <span>Ngày {review.day}</span>
                </div>
                <div className="review-stars">{stars(review.stars)} <small>{review.score}/100</small></div>
                <p>{review.text}</p>
                {review.replyText ? (
                  <div className={`owner-reply reply-${review.replyStyle}`}>
                    <small>CHỦ TIỆM · {review.replyStyle === "sweet" ? "💗" : review.replyStyle === "witty" ? "😌" : "🔥"}</small>
                    <p>{review.replyText}</p>
                  </div>
                ) : (
                  <div className="reply-actions">
                    {replyStyles.map((style) => (
                      <button key={style.id} onClick={() => onGame(replyToReview(game, review.id, style.id))}>
                        <span>{style.emoji}</span><b>{style.label}</b><small>{style.hint}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function GoalsScreen({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  return (
    <section className="goals-layout">
      <div className="panel goals-panel">
        <span className="eyebrow">DAILY QUESTS</span>
        <h2>Mục tiêu ngày {game.day} 🎯</h2>
        <p className="section-copy">Quest reset theo ngày. Hoàn thành rồi nhớ nhận thưởng để tăng tốc mở món và nâng tiệm.</p>
        <div className="quest-list">
          {game.quests.map((quest) => {
            const done = quest.progress >= quest.target;
            const percent = Math.min(100, (quest.progress / quest.target) * 100);
            return (
              <article className={`quest-card ${done ? "done" : ""} ${quest.claimed ? "claimed" : ""}`} key={quest.id}>
                <div className="quest-top">
                  <div><span>{done ? "🎁" : "🌸"}</span><div><b>{quest.title}</b><small>{quest.description}</small></div></div>
                  <strong>{Math.min(quest.progress, quest.target)}/{quest.target}</strong>
                </div>
                <div className="quest-track"><i style={{ width: `${percent}%` }} /></div>
                <div className="quest-bottom">
                  <span>🪙 {formatMoney(quest.rewardCash)} · ✨ {quest.rewardXp} XP · 📱 {quest.rewardFans}</span>
                  <button disabled={!done || quest.claimed} onClick={() => onGame(claimQuest(game, quest.id))}>
                    {quest.claimed ? "Đã nhận ✓" : done ? "Nhận thưởng" : "Đang làm"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel goals-panel">
        <span className="eyebrow">ACHIEVEMENTS</span>
        <h2>Bộ sưu tập thành tựu 🏆</h2>
        <div className="achievement-grid">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = game.achievementIds.includes(achievement.id);
            const value = achievement.metric === "fans" ? game.fans : game.stats[achievement.metric];
            const percent = Math.min(100, (value / achievement.threshold) * 100);
            return (
              <article className={`achievement-card ${unlocked ? "unlocked" : ""}`} key={achievement.id}>
                <div className="achievement-icon">{achievement.emoji}</div>
                <div>
                  <div className="achievement-title"><b>{achievement.name}</b>{unlocked && <span>UNLOCKED</span>}</div>
                  <p>{achievement.description}</p>
                  <div className="achievement-track"><i style={{ width: `${percent}%` }} /></div>
                  <small>{Math.min(value, achievement.threshold).toLocaleString("vi-VN")} / {achievement.threshold.toLocaleString("vi-VN")}</small>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel goals-panel collection-panel">
        <span className="eyebrow">COLLECTION & PROGRESSION</span>
        <h2>Menu đang lớn dần 🍹</h2>
        <div className="collection-section">
          <h3>Món nước · {game.unlockedBaseIds.length}/{Object.keys(DRINKS).length}</h3>
          <div className="collection-grid">
            {Object.values(DRINKS).map((drink) => {
              const unlocked = game.unlockedBaseIds.includes(drink.id);
              return (
                <div className={unlocked ? "unlocked" : "locked"} key={drink.id}>
                  <span>{unlocked ? drink.emoji : "🔒"}</span>
                  <b>{unlocked ? drink.shortName : `Lv.${drink.unlockLevel}`}</b>
                </div>
              );
            })}
          </div>
        </div>
        <div className="collection-section">
          <h3>Topping · {game.unlockedToppingIds.length}/{Object.keys(TOPPINGS).length}</h3>
          <div className="collection-grid topping-collection">
            {Object.values(TOPPINGS).map((topping) => {
              const unlocked = game.unlockedToppingIds.includes(topping.id);
              return (
                <div className={unlocked ? "unlocked" : "locked"} key={topping.id}>
                  <span>{unlocked ? topping.emoji : "🔒"}</span>
                  <b>{unlocked ? topping.name : `Lv.${topping.unlockLevel}`}</b>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;
