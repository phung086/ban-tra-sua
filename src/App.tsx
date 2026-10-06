import { useEffect, useMemo, useState } from "react";
import { CafeAtmosphere, CafeSceneChrome } from "./components/CafeAtmosphere";
import { ChibiCustomer } from "./components/ChibiCustomer";
import { CraftWorkbench } from "./components/CraftWorkbench";
import { CustomerQueueStatus } from "./components/CustomerQueueStatus";
import { OrderExperience } from "./components/OrderExperience";
import { GameSettings } from "./components/GameSettings";
import { PerformancePulse } from "./components/PerformancePulse";
import { PlayCoach } from "./components/PlayCoach";
import { ServeCelebration } from "./components/ServeCelebration";
import { GoalsRoom } from "./components/world/GoalsRoom";
import { PrepWorld } from "./components/world/PrepWorld";
import { ReviewsRoom } from "./components/world/ReviewsRoom";
import { StockRoom } from "./components/world/StockRoom";
import { UpgradesRoom } from "./components/world/UpgradesRoom";
import { WorldChrome } from "./components/world/WorldChrome";
import { DECORATIONS } from "./game/content";
import {
  createInitialState,
  formatMoney,
  getCustomer,
  nextDay,
  serveCurrentDrink,
} from "./game/engine";
import { feedbackForScore } from "./game/feedback";
import { recordCraftPerformance } from "./game/performance";
import { getSeasonForDay } from "./game/season";
import { clearSave, loadGame, saveGame } from "./game/storage";
import type { GameState, Screen } from "./game/types";

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame());
  const [screen, setScreen] = useState<Screen>("shop");
  const [station, setStation] = useState(0);
  const season = getSeasonForDay(game.day);

  useEffect(() => {
    saveGame(game);
  }, [game]);

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  useEffect(() => {
    setStation(0);
    window.scrollTo(0, 0);
  }, [game.currentOrder?.id]);

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

      <WorldChrome
        screen={screen}
        cash={formatMoney(game.cash)}
        reputation={game.reputation}
        day={game.day}
        level={game.level}
        seasonEmoji={season.emoji}
        notice={game.notice}
        score={game.lastScore}
        reviewBadge={unreplied}
        goalBadge={claimable}
        onNavigate={setScreen}
      />

      <section id="game-content" tabIndex={-1} className={`content v6-world-content v6-screen-${screen}`}>
        {game.phase === "open" && screen !== "shop" && (
          <button className="return-to-counter" onClick={() => setScreen("shop")}>
            ← Về quầy · {customer.name} đang chờ ly thứ {game.served + 1}
          </button>
        )}
        {screen === "shop" && (
          <ShopScreen game={game} onGame={setGame} customer={customer} onNavigate={setScreen} station={station} onStation={setStation} />
        )}
        {screen === "stock" && <StockScreen game={game} onGame={setGame} />}
        {screen === "upgrades" && <UpgradesScreen game={game} onGame={setGame} />}
        {screen === "reviews" && <ReviewsScreen game={game} onGame={setGame} onReset={resetProgress} />}
        {screen === "goals" && <GoalsScreen game={game} onGame={setGame} />}
      </section>

    </main>
  );
}

interface ShopProps {
  game: GameState;
  onGame: (state: GameState) => void;
  customer: ReturnType<typeof getCustomer>;
  onNavigate: (screen: Screen) => void;
  station: number;
  onStation: (station: number) => void;
}

function ShopScreen({ game, onGame, customer, onNavigate, station, onStation }: ShopProps) {
  if (game.phase === "prep") {
    return <PrepWorld game={game} onGame={onGame} onNavigate={onNavigate} />;
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
    <section className="game-layout v6-craft-theater v6-game-layout">
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

        <CustomerQueueStatus game={game} />

        <div className="progress-card">
          <div className="progress-row">
            <span>{game.event.emoji} {game.event.name}</span>
            <b>{game.served}/{game.targetOrders} đơn</b>
          </div>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
        </div>

        <details className="craft-performance"><summary>Phong độ pha chế</summary><PerformancePulse /></details>

        <OrderExperience
          key={order.id}
          order={order}
          draft={game.draft}
          customerName={customer.name}
          orderNumber={game.served + 1}
          priceText={formatMoney(order.price)}
        />
      </div>

      <CraftWorkbench key={order.id} game={game} customerName={customer.name} onGame={onGame} onServe={serveDrink} station={station} onStation={onStation} />
    </section>
  );
}

function StockScreen({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  return <StockRoom game={game} onGame={onGame} />;
}

function UpgradesScreen({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  return <UpgradesRoom game={game} onGame={onGame} />;
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
  return <ReviewsRoom game={game} onGame={onGame} onReset={onReset} />;
}

function GoalsScreen({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  return <GoalsRoom game={game} onGame={onGame} />;
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
