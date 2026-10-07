import { useEffect, useMemo, useState } from "react";
import { CraftWorkbench } from "./components/CraftWorkbench";
import { CustomerScene } from "./components/CustomerScene";
import { OrderExperience } from "./components/OrderExperience";
import { GameSettings } from "./components/GameSettings";
import { PlayCoach } from "./components/PlayCoach";
import { ServeCelebration } from "./components/ServeCelebration";
import { StreetWorld } from "./components/StreetWorld";
import { GoalsRoom } from "./components/world/GoalsRoom";
import { PrepWorld } from "./components/world/PrepWorld";
import { ReviewsRoom } from "./components/world/ReviewsRoom";
import { StockRoom } from "./components/world/StockRoom";
import { UpgradesRoom } from "./components/world/UpgradesRoom";
import { WorldChrome } from "./components/world/WorldChrome";
import {
  createInitialState,
  formatMoney,
  getCustomer,
  nextDay,
} from "./game/engine";
import {
  deliverDrink,
  deliveryFor,
  PLACES,
  type Position,
} from "./game/service";
import { feedbackForScore } from "./game/feedback";
import { recordCraftPerformance } from "./game/performance";
import { getSeasonForDay } from "./game/season";
import { clearSave, loadGame, saveGame } from "./game/storage";
import type { GameState, Screen } from "./game/types";

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame());
  const [screen, setScreen] = useState<Screen>("shop");
  const [station, setStation] = useState(0);
  const [carrying, setCarrying] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, z: 3.15 });
  const season = getSeasonForDay(game.day);
  useEffect(() => {
    saveGame(game);
  }, [game]);
  useEffect(() => {
    setStation(0);
    setCarrying(false);
  }, [game.currentOrder?.id]);
  const order = game.currentOrder;
  const customer = useMemo(
    () => getCustomer(order?.customerId ?? "miu"),
    [order?.customerId],
  );
  const claimable = game.quests.filter(
    (q) => !q.claimed && q.progress >= q.target,
  ).length;
  const unreplied = game.reviews.filter((r) => !r.replyStyle).length;
  const atCounter =
    Math.hypot(position.x, position.z - PLACES.counter.z) <= 1.45;
  const deliver = () => {
    if (!order) return;
    const next = deliverDrink(game, carrying, position, order.id);
    if (next.served > game.served && next.lastScore !== null) {
      setCarrying(false);
      feedbackForScore(next.lastScore);
      recordCraftPerformance(next.lastScore, next.combo);
    }
    setGame(next);
  };
  const pickUp = () => {
    if (!game.draft.sealed) {
      setGame({ ...game, notice: "Dập nắp ly trước khi mang ra khách." });
      return;
    }
    if (atCounter) setCarrying(true);
  };
  const reset = () => {
    if (!window.confirm("Xóa toàn bộ tiến trình và mở lại tiệm từ ngày 1?"))
      return;
    clearSave();
    setGame(createInitialState());
    setScreen("shop");
    setCarrying(false);
  };
  return (
    <main className={`app-shell season-${season.id}`}>
      <PlayCoach />
      <GameSettings />
      <ServeCelebration
        served={game.served}
        score={game.lastScore}
        combo={game.combo}
        customerId={game.lastService?.customerId}
      />
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
      <div className="street-layout">
        <StreetWorld
          game={game}
          screen={screen}
          station={station}
          carrying={carrying}
          position={position}
          onPosition={setPosition}
          onDeliver={deliver}
        />
        <section
          id="game-content"
          tabIndex={-1}
          className={`content screen-${screen}`}
        >
          {game.phase === "open" && screen !== "shop" && (
            <button
              className="return-to-counter"
              onClick={() => setScreen("shop")}
            >
              ← Về phục vụ · {customer.name} đang chờ
            </button>
          )}
          {screen === "shop" && game.phase === "prep" && (
            <PrepWorld game={game} onGame={setGame} onNavigate={setScreen} />
          )}
          {screen === "shop" && game.phase === "summary" && game.summary && (
            <div className="panel summary-card">
              <span className="eyebrow">HẾT CA · NGÀY {game.day}</span>
              <h2>Cảm ơn một ngày bận rộn.</h2>
              <p>
                {game.summary.eventName} · điểm trung bình{" "}
                {game.summary.averageScore}/100
              </p>
              <div className="summary-grid">
                {[
                  ["Đơn hoàn tất", game.summary.orders],
                  ["Ly perfect", game.summary.perfectOrders],
                  ["Doanh thu", formatMoney(game.summary.revenue)],
                  ["Lợi nhuận", formatMoney(game.summary.profit)],
                  ["Fan tăng", `+${game.summary.fansGained}`],
                  ["Nghiên cứu", `+${game.summary.researchGained} RP`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
              {claimable > 0 && (
                <button onClick={() => setScreen("goals")}>
                  Nhận thưởng {claimable} mục tiêu đã xong →
                </button>
              )}
              <button
                className="primary-button"
                onClick={() => setGame(nextDay(game))}
              >
                Chuẩn bị ngày {game.day + 1} →
              </button>
            </div>
          )}
          {screen === "shop" && game.phase === "open" && order && (
            <>
              <CustomerScene game={game} />
              <OrderExperience
                key={order.id}
                order={order}
                draft={game.draft}
                customerName={customer.name}
                orderNumber={game.served + 1}
                priceText={formatMoney(order.price)}
              />
              {carrying ? (
                <section className="panel carry-card">
                  <span className="eyebrow">ĐANG BÊ LY</span>
                  <h2>
                    Mang đến {PLACES[deliveryFor(order)].label.toLowerCase()}
                  </h2>
                  <p>
                    Chọn địa điểm trong tiệm hoặc tự đi bằng phím / nút mũi tên.
                    Đến gần đúng khách, nút giao ly sẽ mở.
                  </p>
                  <button
                    disabled={!atCounter}
                    onClick={() => setCarrying(false)}
                  >
                    Đặt ly lại quầy để chỉnh
                  </button>
                </section>
              ) : (
                <>
                  {!atCounter && (
                    <p className="counter-reminder" role="status">
                      Bạn đang rời quầy. Chọn “Quầy pha chế” để tiếp tục pha.
                    </p>
                  )}
                  <fieldset disabled={!atCounter} className="craft-fieldset">
                    <CraftWorkbench
                      key={order.id}
                      game={game}
                      customerName={customer.name}
                      onGame={setGame}
                      onServe={pickUp}
                      station={station}
                      onStation={setStation}
                    />
                  </fieldset>
                </>
              )}
            </>
          )}
          {screen === "stock" && <StockRoom game={game} onGame={setGame} />}
          {screen === "upgrades" && (
            <UpgradesRoom game={game} onGame={setGame} />
          )}
          {screen === "reviews" && (
            <ReviewsRoom game={game} onGame={setGame} onReset={reset} />
          )}
          {screen === "goals" && <GoalsRoom game={game} onGame={setGame} />}
        </section>
      </div>
    </main>
  );
}
export default App;
