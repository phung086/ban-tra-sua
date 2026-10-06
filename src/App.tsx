import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdaptiveCraftHint } from "./components/AdaptiveCraftHint";
import { CafeAtmosphere, CafeSceneChrome } from "./components/CafeAtmosphere";
import { ChibiCustomer } from "./components/ChibiCustomer";
import { CraftGauge } from "./components/CraftGauge";
import { CraftHotkeys } from "./components/CraftHotkeys";
import { DecorPlanner } from "./components/DecorPlanner";
import { DrinkCup } from "./components/DrinkCup";
import { OrderExperience } from "./components/OrderExperience";
import { GameSettings } from "./components/GameSettings";
import { HoldDispenser } from "./components/HoldDispenser";
import { PerformancePulse } from "./components/PerformancePulse";
import { PlayCoach } from "./components/PlayCoach";
import { RecipeChecklist } from "./components/RecipeChecklist";
import { ServeCelebration } from "./components/ServeCelebration";
import { ToppingTray } from "./components/ToppingTray";
import {
  ACHIEVEMENTS,
  CUSTOMERS,
  DECORATIONS,
  DRINKS,
  RESEARCH,
  RESTOCK_ITEMS,
  STAFF,
  TOPPINGS,
  UPGRADES,
} from "./game/content";
import {
  buyDecoration,
  buyResearch,
  buyUpgrade,
  claimQuest,
  createInitialState,
  formatMoney,
  getCustomer,
  getRelationshipTier,
  getRestockPrice,
  getUpgradeCost,
  hireStaff,
  nextDay,
  replyToReview,
  reorderDecorations,
  restock,
  serveCurrentDrink,
  setActiveStaff,
  startDay,
  toggleDecoration,
  updateDraft,
} from "./game/engine";
import { feedbackForScore } from "./game/feedback";
import { recordCraftPerformance } from "./game/performance";
import { getSeasonForDay } from "./game/season";
import { clearSave, loadGame, saveGame } from "./game/storage";
import type {
  BaseId,
  DecorationId,
  GameState,
  ReplyStyle,
  ResearchId,
  Screen,
  StaffId,
  ToppingId,
  UpgradeId,
} from "./game/types";

const stars = (value: number) => "★".repeat(value) + "☆".repeat(5 - value);

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame());
  const [screen, setScreen] = useState<Screen>("shop");
  const season = getSeasonForDay(game.day);

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
    <main className={`app-shell v2-shell v6-theater-shell season-${season.id}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <CafeAtmosphere phase={game.phase} season={season.id} />
      <PlayCoach />
      <GameSettings />
      <ServeCelebration served={game.served} score={game.lastScore} combo={game.combo} />

      <header className="topbar v2-topbar v6-hud">
        <div className="brand">
          <div className="brand-mark">🧋</div>
          <div>
            <p>TIỆM TRÀ</p>
            <h1>Chibi</h1>
          </div>
        </div>
        <div className="season-pill" title={season.subtitle}><span>{season.emoji}</span><b>{season.name}</b></div>
        <div className="top-stats v2-stats">
          <div className="stat-pill coin"><span>🪙</span><b>{formatMoney(game.cash)}</b></div>
          <div className="stat-pill heart"><span>💗</span><b>{game.reputation}</b></div>
          <div className="stat-pill fans"><span>📱</span><b>{game.fans}</b></div>
          <div className="stat-pill level"><span>✨</span><b>Lv.{game.level}</b></div>
          <div className="stat-pill day"><span>🌸</span><b>Ngày {game.day}</b></div>
        </div>
      </header>

      <section className="content v6-content">
        <div className="notice-card v2-notice v6-marquee">
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

      <nav className="bottom-nav v2-nav v6-dock" aria-label="Điều hướng chính">
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

function ShopScreen({ game, onGame, customer, onNavigate }: ShopProps) {
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
          <CafeSceneChrome />
          <div className="event-banner">
            <span>{game.event.emoji}</span>
            <div><b>{game.event.name}</b><small>{game.event.description}</small></div>
          </div>
          <SceneDecor game={game} />
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
            <div><span>🧠</span><b>{game.researchPoints}</b><small>research point</small></div>
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
            <div><span>🧠</span><small>Research</small><b>+{summary.researchGained} RP</b></div>
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
  const serveDrink = () => {
    const next = serveCurrentDrink(game);
    const servedSuccessfully = next.served > game.served;
    onGame(next);
    if (servedSuccessfully && next.lastScore !== null) {
      feedbackForScore(next.lastScore);
      recordCraftPerformance(next.lastScore, next.combo);
    }
  };

  return (
    <section className="game-layout v6-game-layout">
      <div className="play-column v6-customer-stage">
        <div className="shop-scene live-scene v6-live-scene">
          <div className="scene-sky">
            <span className="scene-cloud c1" />
            <span className="scene-cloud c2" />
            <span className="hanging-lamp">{game.event.emoji}</span>
          </div>
          <CafeSceneChrome />
          <SceneDecor game={game} compact />
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

        <PerformancePulse />

        <OrderExperience
          key={order.id}
          order={order}
          draft={game.draft}
          customerName={customer.name}
          orderNumber={game.served + 1}
          priceText={formatMoney(order.price)}
        />
      </div>

      <div className="panel workstation v6-brew-bench">
        <div className="workstation-head">
          <div>
            <span className="eyebrow">QUẦY PHA CHẾ · COMBO x{game.combo}</span>
            <h2>Đọc order, pha bằng tay</h2>
          </div>
          <span className="workstation-badge">🔥 best x{game.bestCombo}</span>
        </div>

        <div className="craft-grid v6-craft-grid">
          <DrinkCup draft={game.draft} />

          <div className="craft-controls v6-craft-controls">
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

              <ControlGroup title="3. Topping · kéo thả" icon="🍮">
                <ToppingTray
                  unlockedIds={game.unlockedToppingIds}
                  selected={game.draft.topping}
                  onSelect={(id) => onGame(updateDraft(game, { topping: id as ToppingId, sealed: false }))}
                />
              </ControlGroup>
            </div>

            <ControlGroup title="4. Định lượng · giữ để rót" icon="🎚️">
              <div className="dosing-grid">
                <HoldDispenser
                  label="Đường"
                  icon="🍬"
                  value={game.draft.sugar}
                  target={order.sugar}
                  onChange={(value) => onGame(updateDraft(game, { sugar: value, sealed: false }))}
                />
                <HoldDispenser
                  label="Đá"
                  icon="🧊"
                  value={game.draft.ice}
                  target={order.ice}
                  onChange={(value) => onGame(updateDraft(game, { ice: value, sealed: false }))}
                />
              </div>
            </ControlGroup>

            <ControlGroup title="5. Kỹ thuật tay · timing" icon="🪄">
              <div className="timing-grid">
                <CraftGauge
                  label="Rót"
                  icon="🫗"
                  value={game.draft.fill}
                  target={order.targetFill}
                  tolerance={5 + game.upgrades.brewer}
                  speed={62 - Math.min(15, game.upgrades.brewer * 3)}
                  helper="Bấm bắt đầu, canh kim vào vùng hồng rồi CHỐT."
                  onCommit={(value) => onGame(updateDraft(game, { fill: value, sealed: false }))}
                />
                <CraftGauge
                  label="Lắc"
                  icon="🌀"
                  value={game.draft.shake}
                  target={order.targetShake}
                  tolerance={5 + game.upgrades.shaker * 2}
                  speed={72 - Math.min(20, game.upgrades.shaker * 4)}
                  helper="Máy lắc cấp cao làm kim chậm hơn và vùng chuẩn rộng hơn."
                  onCommit={(value) => onGame(updateDraft(game, { shake: value, sealed: false }))}
                />
              </div>
            </ControlGroup>

            <AdaptiveCraftHint order={order} draft={game.draft} />
            <RecipeChecklist order={order} draft={game.draft} />
            <CraftHotkeys
              enabled
              sealed={game.draft.sealed}
              onSeal={() => onGame(updateDraft(game, { sealed: true }))}
              onServe={serveDrink}
            />

            <div className="finish-actions">
              <button
                className={`seal-button ${game.draft.sealed ? "sealed" : ""}`}
                onClick={() => onGame(updateDraft(game, { sealed: !game.draft.sealed }))}
              >
                <span>{game.draft.sealed ? "🎀" : "🔘"}</span>
                {game.draft.sealed ? "Nắp đã chuẩn" : "Dập nắp ly"}
              </button>
              <button className="primary-button serve-button" onClick={serveDrink}>
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
    <div className="control-group v6-control-drawer">
      <h4><span>{icon}</span>{title}</h4>
      {children}
    </div>
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

      <div className="panel management-panel decor-panel">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">DECOR · TỐI ĐA 3 MÓN ĐANG TRƯNG</span>
            <h2>Trang trí có chiến thuật 🌷</h2>
            <p>Mỗi món decor có buff thật lên tip, doanh thu, fan, viral hoặc research.</p>
          </div>
        </div>
        <DecorPlanner
          ownedIds={game.ownedDecorations}
          equippedIds={game.equippedDecorations}
          onToggle={(id) => onGame(toggleDecoration(game, id))}
          onReorder={(ids) => onGame(reorderDecorations(game, ids))}
        />
        <div className="decor-grid">
          {DECORATIONS.map((decoration) => {
            const owned = game.ownedDecorations.includes(decoration.id);
            const equipped = game.equippedDecorations.includes(decoration.id);
            const locked = decoration.unlockLevel > game.level;
            const buffs = [
              decoration.revenueBonus ? `+${Math.round(decoration.revenueBonus * 100)}% doanh thu` : "",
              decoration.tipBonus ? `+${Math.round(decoration.tipBonus * 100)}% tip` : "",
              decoration.fanBonus ? `+${decoration.fanBonus} fan` : "",
              decoration.viralBonus ? `+${decoration.viralBonus} viral` : "",
              decoration.researchBonus ? `+${decoration.researchBonus} RP/perfect` : "",
            ].filter(Boolean).join(" · ");

            return (
              <article className={`decor-card ${equipped ? "equipped" : ""} ${locked ? "locked" : ""}`} key={decoration.id}>
                <div className="decor-icon">{decoration.emoji}</div>
                <div>
                  <div className="decor-title"><b>{decoration.name}</b><span>{equipped ? "ĐANG TRƯNG" : `Lv.${decoration.unlockLevel}`}</span></div>
                  <p>{decoration.description}</p>
                  <small>{buffs}</small>
                </div>
                {owned ? (
                  <button onClick={() => onGame(toggleDecoration(game, decoration.id as DecorationId))}>
                    {equipped ? "Cất đi" : "Đặt vào tiệm"}
                  </button>
                ) : (
                  <button
                    disabled={locked || game.cash < decoration.cost}
                    onClick={() => onGame(buyDecoration(game, decoration.id as DecorationId))}
                  >
                    {locked ? `Mở Lv.${decoration.unlockLevel}` : formatMoney(decoration.cost)}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel management-panel research-panel">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">RESEARCH LAB · {game.researchPoints} RP</span>
            <h2>Nghiên cứu công thức vận hành 🧠</h2>
            <p>RP kiếm từ mỗi ly, bonus khi perfect. Research thay đổi trực tiếp luật game.</p>
          </div>
        </div>
        <div className="research-grid">
          {RESEARCH.map((research) => {
            const done = game.researchedIds.includes(research.id);
            const missing = research.prerequisiteIds.filter((id) => !game.researchedIds.includes(id));
            return (
              <article className={`research-card ${done ? "done" : ""}`} key={research.id}>
                <div className="research-icon">{research.emoji}</div>
                <div>
                  <span>{research.category}</span>
                  <h3>{research.name}</h3>
                  <p>{research.description}</p>
                  {missing.length > 0 && (
                    <small>Cần: {missing.map((id) => RESEARCH.find((item) => item.id === id)?.name ?? id).join(", ")}</small>
                  )}
                </div>
                <button
                  disabled={done || missing.length > 0 || game.researchPoints < research.cost}
                  onClick={() => onGame(buyResearch(game, research.id as ResearchId))}
                >
                  {done ? "Đã nghiên cứu ✓" : `${research.cost} RP`}
                </button>
              </article>
            );
          })}
        </div>
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
                <div className="review-stars">
                  {stars(review.stars)}
                  <small>
                    {review.score}/100 · {getRelationshipTier(game.customerBond[review.customerId] ?? 0).emoji} bond {game.customerBond[review.customerId] ?? 0}
                  </small>
                </div>
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

      <div className="panel goals-panel relationship-panel">
        <span className="eyebrow">CUSTOMER RELATIONSHIP</span>
        <h2>Khách quen của tiệm 💞</h2>
        <p className="section-copy">Pha tốt cho cùng một khách để tăng bond. Khách có bond cao sẽ quay lại thường xuyên hơn.</p>
        <div className="relationship-grid">
          {[...CUSTOMERS]
            .sort((a, b) => (game.customerBond[b.id] ?? 0) - (game.customerBond[a.id] ?? 0))
            .map((customer) => {
              const bond = game.customerBond[customer.id] ?? 0;
              const visits = game.customerVisits[customer.id] ?? 0;
              const tier = getRelationshipTier(bond);
              const nextTarget = bond < 5 ? 5 : bond < 12 ? 12 : bond < 25 ? 25 : 25;
              const percent = bond >= 25 ? 100 : Math.min(100, (bond / nextTarget) * 100);
              return (
                <article className="relationship-card" key={customer.id}>
                  <div className="relationship-avatar" style={{ background: customer.shirt }}>{customer.name.slice(0, 1)}</div>
                  <div>
                    <div className="relationship-title"><b>{customer.name}</b><span>{tier.emoji} {tier.label}</span></div>
                    <p>{customer.archetype} · {visits} lần ghé</p>
                    <div className="bond-track"><i style={{ width: `${percent}%` }} /></div>
                    <small>Bond {bond}{customer.favorite ? ` · mê ${DRINKS[customer.favorite].shortName}` : ""}</small>
                  </div>
                </article>
              );
            })}
        </div>
      </div>

      <div className="panel goals-panel story-panel">
        <span className="eyebrow">STORY MOMENTS</span>
        <h2>Những chuyện nhỏ ở tiệm 💌</h2>
        {game.storyLog.length === 0 ? (
          <div className="story-empty">
            <span>📖</span>
            <p>Khi bond với một vị khách đủ cao, câu chuyện riêng của họ sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <div className="story-list">
            {game.storyLog.slice(0, 8).map((story) => (
              <article className="story-card" key={story.id}>
                <div>💌</div>
                <div>
                  <span>{story.customerName} · Ngày {story.day}</span>
                  <h3>{story.title}</h3>
                  <p>{story.text}</p>
                  <small>Thưởng quan hệ: +{story.rewardFans} fan</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SceneDecor({ game, compact = false }: { game: GameState; compact?: boolean }) {
  const visible = DECORATIONS.filter((item) => game.equippedDecorations.includes(item.id));
  if (visible.length === 0) return null;

  return (
    <div className={`scene-decor ${compact ? "compact" : ""}`} aria-label="Trang trí đang trưng">
      {visible.map((item, index) => (
        <span className={`decor-slot decor-slot-${index + 1}`} title={item.name} key={item.id}>
          {item.emoji}
        </span>
      ))}
    </div>
  );
}

export default App;
