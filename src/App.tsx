import { useEffect, useMemo, useRef, useState } from "react";
import { layoutIsMobile, selectPlayLayout } from "./game/playLayout";
import { Neighborhood } from './components/Neighborhood';
import { cityAction, walkCity, type CityAction } from './game/city';
import { CITY_PLACES, nearCityPlace, type CityPlace } from './game/cityMap';
import {storyAction,nearbyTask,type ResidentId,type StoryAction} from './game/neighborhoodStories';
import {NeighborhoodDialogue} from './components/NeighborhoodDialogue';
import {lifeAction,type LifeAction} from './game/cityLife';
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
  getDrinkCoachingTip,
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
import {installGameAudio,duckMusic} from './game/audio';
import type { GameState, Screen } from "./game/types";

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame());
  const [screen, setScreen] = useState<Screen>("shop");
  const [station, setStation] = useState(0);
  const [carrying, setCarrying] = useState(false);
  // Transient post-delivery guidance: do not modify persisted save schema.
  const [lastServeTip, setLastServeTip] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, z: 3.15 });
  const [exploring, setExploring] = useState(false);
  const [cityNavigation, setCityNavigation] = useState<{place: CityPlace; serial: number; ride?: boolean} | null>(null);
  const [returning, setReturning] = useState(false);
  const [talking,setTalking]=useState<ResidentId|null>(null);
  useEffect(installGameAudio,[]);
  useEffect(()=>{duckMusic(!!talking);},[talking]);
  const [sheetOpen,setSheetOpen]=useState(false);
  const [cityPanel,setCityPanel]=useState<'tasks'|'map'|'orders'|'community'|'leisure'>('tasks');
  // A landscape phone can be wider than 900 CSS pixels. Keep controls and
  // notebook mobile-sized across rotation without remounting the 3D renderer.
  const [playLayout,setPlayLayout]=useState(()=>
    selectPlayLayout(window.innerWidth,window.innerHeight,matchMedia('(pointer: coarse)').matches));
  const mobile=layoutIsMobile(playLayout);
  useEffect(()=>{
    const coarse=matchMedia('(pointer: coarse)');
    let raf=0;
    const sync=()=>{
      // Update viewport height before the next animation frame: software WebGL,
      // browser chrome and orientation transitions can delay requestAnimationFrame.
      const height=window.visualViewport?.height||window.innerHeight;
      document.documentElement.style.setProperty('--play-viewport-height',Math.max(200,Math.round(height))+'px');
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>
        setPlayLayout(selectPlayLayout(window.innerWidth,window.innerHeight,coarse.matches)));
    };
    sync();
    window.addEventListener('resize',sync);
    window.addEventListener('orientationchange',sync);
    window.visualViewport?.addEventListener('resize',sync);
    coarse.addEventListener('change',sync);
    return()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener('resize',sync);
      window.removeEventListener('orientationchange',sync);
      window.visualViewport?.removeEventListener('resize',sync);
      coarse.removeEventListener('change',sync);
      document.documentElement.style.removeProperty('--play-viewport-height');
    };
  },[]);
  const doStory=(action:StoryAction)=>setGame(state=>storyAction(state,action,position));
  const doLife=(action:LifeAction)=>setGame(state=>lifeAction(state,action,position));
  const openTalk=(id:ResidentId)=>{setTalking(id);setSheetOpen(false);};
  const walked = useRef(0), previousPosition = useRef(position), riding = useRef(false);
  const navigateCity = (place: CityPlace) => {
    setSheetOpen(false);setTalking(null);
    setReturning(false);
    setCityNavigation(previous => ({place, serial:(previous?.serial ?? 0)+1}));
  };
  const updatePosition = (p: Position) => {
    if (exploring && !riding.current) {
      walked.current += Math.hypot(p.x-previousPosition.current.x, p.z-previousPosition.current.z);
      if (walked.current >= 1 || Object.keys(CITY_PLACES).some(id=>nearCityPlace(p,id as CityPlace))) {
        const distance = walked.current; walked.current = 0;
        if (distance > 0) setGame(state => walkCity(state, distance, p));
      }
    }
    riding.current = false;
    previousPosition.current = p;
    setPosition(p);
  };
  const returnToShop = () => {
    setSheetOpen(false);setTalking(null);
    if (nearCityPlace(position,'shop')) { setExploring(false); setReturning(false); }
    else { navigateCity('shop'); setReturning(true); }
  };
  useEffect(() => {
    if (returning && nearCityPlace(position,'shop')) { setExploring(false); setReturning(false); }
  }, [returning, position]);
  const actInCity = (action: CityAction) => setGame(state => cityAction(state, action, position));
  const rideHome = () => {
    const next = cityAction(game, {type:'bus'}, position);
    setGame(next);
    if (next.cash < game.cash) {
      riding.current = true;
      setCityNavigation(previous => ({place:'shop',serial:(previous?.serial ?? 0)+1,ride:true}));
    }
  };
  const season = getSeasonForDay(game.day);
  useEffect(() => {
    const timer=setTimeout(()=>saveGame(game),400);
    const saveOnExit=()=>saveGame(game);
    window.addEventListener('pagehide',saveOnExit);
    return()=>{clearTimeout(timer);window.removeEventListener('pagehide',saveOnExit);};
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
      setLastServeTip(getDrinkCoachingTip(order, game.draft));
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
    setLastServeTip(null);
    setGame(createInitialState());
    setScreen("shop");
    setCarrying(false);
    setExploring(false);
    setReturning(false);
    setTalking(null);setSheetOpen(false);
  };
  return (
    <main data-play-layout={playLayout} className={`app-shell season-${season.id} ${exploring&&screen==='shop'?'exploring-city':''}`}>
      {talking&&<NeighborhoodDialogue key={talking} id={talking} game={game} onClose={()=>setTalking(null)} onAction={doStory} onNavigate={navigateCity}/>}
      <PlayCoach />
      <GameSettings />
      <ServeCelebration
        served={game.served}
        score={game.lastScore}
        combo={game.combo}
        customerId={game.lastService?.customerId}
        tip={lastServeTip ?? undefined}
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
        onNavigate={(next) => {setScreen(next);setTalking(null);setSheetOpen(false); if (next !== 'shop') {setExploring(false); setReturning(false);}}}
      />
      <div className="street-layout">
        <StreetWorld
          game={game}
          screen={screen}
          station={station}
          carrying={carrying}
          position={position}
          onPosition={updatePosition}
          onDeliver={deliver}
          exploring={exploring}
          cityNavigation={cityNavigation}
          onExplore={() => {setExploring(true);setSheetOpen(false);setCityPanel('tasks'); setScreen('shop');}}
          onReturn={returnToShop}
          paused={!!talking||(exploring&&mobile&&sheetOpen)}
          onTalk={openTalk}
          onStory={doStory}
          onOpenTasks={()=>{setCityPanel('orders');setSheetOpen(true);}}
          onOpenMap={()=>{setCityPanel('map');setSheetOpen(true);}}
          nearbyTask={nearbyTask(game.city.stories,position)}
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
          {screen === 'shop' && exploring && <Neighborhood game={game} position={position} onNavigate={navigateCity} onAction={actInCity} onReturn={returnToShop} onRide={rideHome} onTalk={openTalk} onStory={doStory} expanded={sheetOpen} onExpand={setSheetOpen} tab={cityPanel} onTab={setCityPanel} onLife={doLife}/>}
          {screen === "shop" && !exploring && game.phase === "prep" && (
            <PrepWorld game={game} onGame={setGame} onNavigate={setScreen} />
          )}
          {screen === "shop" && !exploring && game.phase === "summary" && game.summary && (
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
                    Chọn địa điểm trong tiệm hoặc kéo núm tròn để đi.
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
