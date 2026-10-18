import { useEffect, useRef, useState } from "react";
import {
  deliveryFor,
  PLACES,
  type Place,
  type Position,
} from "../game/service";
import { getCustomer } from "../game/engine";
import type { GameState, Screen } from "../game/types";
import type { StreetRuntime } from "../scene/runtime";
import { CITY_PLACES, cityArea, nearCityPlace, type CityPlace } from '../game/cityMap';
import { cityTime, cityWeather } from '../game/city';
import {MovementStick} from './MovementStick';
import {HoldTask} from './HoldTask';
import {residentAt,missionDefinition,type ResidentId,type StoryAction,type NeighborhoodMission} from '../game/neighborhoodStories';
import {getUiPreferences} from '../game/preferences';
import {observeNavigationHeartbeat, observeRenderHeartbeat, shouldOfferNavigationAssist, NAVIGATION_ARRIVAL_RADIUS, type NavigationHeartbeat} from '../game/renderHeartbeat';
import {GameIcon} from './GameIcon';
import {CityCompass} from './CityCompass';

interface Props {
  game: GameState;
  screen: Screen;
  station: number;
  carrying: boolean;
  onPosition: (p: Position) => void;
  position: Position;
  onDeliver: () => void;
  exploring: boolean;
  cityNavigation: {place: CityPlace; serial: number; ride?: boolean} | null;
  onExplore: () => void;
  onReturn: () => void;
  paused:boolean;
  onTalk:(id:ResidentId)=>void;
  onStory:(a:StoryAction)=>void;
  onOpenTasks:()=>void;
  onOpenMap:()=>void;
  nearbyTask:NeighborhoodMission|undefined;
}
export function StreetWorld(props: Props) {
  const container = useRef<HTMLDivElement>(null),
    runtime = useRef<StreetRuntime | null>(null),
    latest = useRef(props);
  latest.current = props;
  const pendingShopPlace = useRef<Place | null>(null);
  const lastShopPlace = useRef<Place | null>(null);
  const [status, setStatus] = useState("loading"),
    [overview, setOverview] = useState(false);
  const [fallbackPlace, setFallbackPlace] = useState<Place>("counter");
  const [fallbackReason, setFallbackReason] = useState<'graphics' | 'navigation'>('graphics');
  const [navigationAssist, setNavigationAssist] = useState<Place | null>(null);
  const [showNotice,setShowNotice]=useState(false);
  useEffect(()=>{setShowNotice(true);const timer=setTimeout(()=>setShowNotice(false),4500);return()=>clearTimeout(timer);},[props.game.notice]);
  useEffect(() => {
    let cancelled = false;
    let generation=0;
    const initialize=async()=>{
      const ticket=++generation,prefs=getUiPreferences();
      const current=runtime.current;
      const initial=current?{position:{...current.player},yaw:current.yaw,pitch:current.pitch,overview:current.overview}:undefined;
      setOverview(initial?.overview??false);
      current?.dispose();runtime.current=null;setStatus('loading');
      try{
        const {StreetRuntime}=await import('../scene/runtime');
        const {loadPhotographicSurfaces}=await import('../scene/photoSurfaces');
        await loadPhotographicSurfaces();
        const factory=prefs.renderEngine==='babylon'?(await import('../scene/babylonRenderer')).BabylonSceneRenderer:undefined;
        if(cancelled||ticket!==generation||!container.current)return;
        runtime.current=new StreetRuntime(container.current,latest.current,p=>latest.current.onPosition(p),()=>{setFallbackReason('graphics');setStatus('fallback');},factory?(scene,camera,profile)=>new factory(scene,camera,profile):undefined,prefs.graphics,initial);
        setStatus('ready');
        setFallbackReason('graphics');
      }catch(error){
        if(cancelled||ticket!==generation)return;
        console.error('Không mở được đồ họa',error);setFallbackReason('graphics');setStatus('fallback');
      }
    };
    void initialize();
    let previous=getUiPreferences();
    const graphicsChange=()=>{const next=getUiPreferences();if(next.renderEngine!==previous.renderEngine||next.graphics!==previous.graphics){previous=next;void initialize();}};
    window.addEventListener('tea-graphics-change',graphicsChange);
    return () => {
      cancelled = true;
      window.removeEventListener('tea-graphics-change',graphicsChange);
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, []);
  useEffect(() => {
    runtime.current?.update(props);
  }, [props]);
  useEffect(() => {
    if (props.exploring) {
      setOverview(false);
      if (runtime.current) runtime.current.overview = false;
    } else {
      setOverview(false);
      if (runtime.current) runtime.current.overview = false;
    }
  }, [props.exploring]);
  useEffect(()=>{if(props.exploring&&status==='ready')runtime.current?.leaveShop();},[props.exploring,status]);
  useEffect(() => {
    const navigation = props.cityNavigation;
    if (!navigation || status === 'loading') return;
    if (status === 'ready' && runtime.current) {
      setOverview(false);runtime.current.overview=false;
      if (navigation.ride) runtime.current.rideHome();
      else runtime.current.goCity(navigation.place);
    } else props.onPosition(CITY_PLACES[navigation.place]);
    // Commands run once on arrival of a new serial or renderer initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.cityNavigation, status]);
  // Preserve a destination selected while the 3D scene is loading.
  useEffect(() => {
    if (status !== 'ready' && status !== 'fallback') return;
    const queued = pendingShopPlace.current;
    if (!queued) return;
    pendingShopPlace.current = null;
    if (props.exploring) return;
    if (status === 'ready' && runtime.current) runtime.current.go(queued);
    else {
      setFallbackPlace(queued);
      latest.current.onPosition(PLACES[queued]);
      lastShopPlace.current = null;
    }
    // Navigation must not be replayed when unrelated game state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // A hung renderer OR a route that makes no progress must not softlock
  // the tea-delivery interaction. This uses the existing 2D place fallback.
  useEffect(() => {
    if (status !== 'ready' || !runtime.current) return;
    const start = performance.now();
    let render = { frames: runtime.current.renderSamples, lastProgressAt: start };
    let navigation: NavigationHeartbeat = { place: null, distance: Infinity, lastProgressAt: start };
    const timer = window.setInterval(() => {
      const live = runtime.current;
      if (!live) return;
      const now = performance.now();
      const active = !document.hidden && live.visible;
      const frame = observeRenderHeartbeat(render, live.renderSamples, now, active);
      render = frame.heartbeat;
      const place = lastShopPlace.current;
      const navigating = active && !latest.current.paused && !latest.current.exploring;
      const distance = place
        ? Math.hypot(live.player.x - PLACES[place].x, live.player.z - PLACES[place].z)
        : Infinity;
      if (place && distance <= NAVIGATION_ARRIVAL_RADIUS) lastShopPlace.current = null;
      const route = observeNavigationHeartbeat(
        navigation, lastShopPlace.current, distance, now, navigating,
      );
      navigation = route.heartbeat;
      setNavigationAssist(shouldOfferNavigationAssist(navigation, now, navigating) ? lastShopPlace.current : null);
      if (!frame.stalled && !route.stalled) return;
      const destination = lastShopPlace.current;
      live.dispose();
      runtime.current = null;
      setNavigationAssist(null);
      setFallbackReason(route.stalled ? 'navigation' : 'graphics');
      setStatus('fallback');
      if (destination && !latest.current.exploring) {
        setFallbackPlace(destination);
        latest.current.onPosition(PLACES[destination]);
        lastShopPlace.current = null;
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [status]);

  const go = (place: Place) => {
    setNavigationAssist(null);
    lastShopPlace.current = place;
    if (status === 'loading') {
      pendingShopPlace.current = place;
      setFallbackPlace(place);
      return;
    }
    if (runtime.current && status === 'ready') runtime.current.go(place);
    else {
      pendingShopPlace.current = null;
      setFallbackPlace(place);
      props.onPosition(PLACES[place]);
      lastShopPlace.current = null;
    }
  };
  const useSimplePlaceNavigation = () => {
    const place = navigationAssist;
    if (!place || status !== 'ready' || !runtime.current || latest.current.paused || latest.current.exploring) return;
    runtime.current.dispose();
    runtime.current = null;
    pendingShopPlace.current = null;
    lastShopPlace.current = null;
    setNavigationAssist(null);
    setFallbackReason('navigation');
    setFallbackPlace(place);
    setStatus('fallback');
    latest.current.onPosition(PLACES[place]);
  };
  const order = props.game.currentOrder,
    location = order ? deliveryFor(order) : null;
  const near = location
    ? Math.hypot(
        props.position.x - PLACES[location].x,
        props.position.z - PLACES[location].z,
      ) <= 1.15
    : false;
  const npc=props.exploring?residentAt(props.position):undefined;
  const task=props.nearbyTask;
  const step=task?missionDefinition(task.id).steps[task.step]:undefined;
  return (
    <section className={`street-world ${props.exploring ? 'city-world' : ''}`} aria-label="Tiệm trà và khu phố">
      <div
        className="world-viewport"
        ref={container}
        data-renderer={status}
        onKeyDownCapture={(event) => {
          if (
            [
              "w",
              "a",
              "s",
              "d",
              "arrowup",
              "arrowdown",
              "arrowleft",
              "arrowright",
            ].includes(event.key.toLowerCase())
          )
            setOverview(false);
        }}
      >
        {status !== "ready" && (
          <div className="world-fallback">
            <span>TIỆM TRÀ • PHỐ NHỎ</span>
            <h2>
              {status === "loading" ? "Đang mở cửa tiệm…" : props.exploring ? 'Khám phá khu An Hòa' : "Đi quanh tiệm"}
            </h2>
            <p>
              {status === "loading"
                ? "Dựng quầy, bàn ghế và khách trong xóm."
                : fallbackReason === 'navigation'
                  ? `Đường đi bị kẹt. Đã chuyển sang nút địa điểm để bạn tiếp tục giao trà tại ${PLACES[fallbackPlace].label.toLowerCase()}.`
                  : `Thiết bị chưa mở được đồ họa 3D. Bạn vẫn pha chế và giao tại ${PLACES[fallbackPlace].label.toLowerCase()} bằng các nút địa điểm.`}
            </p>
          </div>
        )}
      </div>
      <div className="world-heading">
        <span className="live-dot" />
        <b>
          {props.game.phase === "open"
            ? "ĐANG ĐÓN KHÁCH"
            : props.game.phase === "prep"
              ? "TRƯỚC GIỜ MỞ CỬA"
              : "SAU MỘT CA BÁN"}
        </b>
        <small>{props.exploring ? `Hà Nội · ${cityTime(props.game.city.minutes)}` : `Hà Nội · ngày ${props.game.day}`}</small>
      </div>
      {props.screen === "shop" && (
        <>
          <div className="view-controls">
            <button disabled={props.game.phase === 'open'} onClick={props.exploring ? props.onReturn : props.onExplore}><GameIcon name={props.exploring?'home':'map'}/><span>{props.exploring ? 'Về tiệm' : 'Khám phá khu phố'}</span></button>
            <button
              disabled={status !== "ready"}
              aria-pressed={overview}
              onClick={() => {
                const next = !overview;
                setOverview(next);
                if (runtime.current) runtime.current.overview = next;
              }}
            >
              <GameIcon name={overview?'person':'camera'}/><span>{props.exploring ? overview ? 'Theo chân nhân vật' : 'Nhìn toàn khu phố' : overview ? "Đứng tại quầy" : "Nhìn toàn tiệm"}</span>
            </button>
          </div>
          {props.exploring&&<CityCompass position={props.position} onOpen={props.onOpenMap}/>}
          {props.exploring && <><div className="city-scene-caption"><h2>{cityArea(props.position)}</h2><p>Hà Nội · ngày {props.game.day}</p><div className="city-vitals"><span><GameIcon name="sun"/>{cityTime(props.game.city.minutes)}</span><span><GameIcon name="leaf"/><b>{Math.ceil(props.game.city.energy)}</b><small>/100</small></span></div><meter min="0" max="100" value={props.game.city.energy} aria-label="Sức lực"/><small>{cityWeather(props.game.day).name}</small></div>{showNotice&&!props.paused&&<p className="city-play-notice" role="status">{props.game.notice}</p>}<div className="city-context-actions">
            {task&&step?<HoldTask key={`${task.id}-${task.step}`} label={step.verb} disabled={props.paused||props.game.city.energy<step.energy} onComplete={()=>props.onStory({type:'task',mission:task.id,step:task.step})}/>:npc?<button className="primary-button" disabled={props.paused} onClick={()=>props.onTalk(npc.id)}>Nói chuyện với {npc.name}</button>:props.game.city.contract?.packed&&nearCityPlace(props.position,props.game.city.contract.destination)?<button onClick={props.onOpenTasks}>Mở sổ để giao trà</button>:null}
            {task&&npc&&<button disabled={props.paused} onClick={()=>props.onTalk(npc.id)}>Nói chuyện với {npc.name}</button>}
          </div></>}
          {order && !props.exploring && (
            <div
              className={`delivery-tag ${props.carrying ? "carrying" : ""}`}
              role="status"
            >
              <small>
                {location === "counter"
                  ? "MANG ĐI · GIAO TẠI QUẦY"
                  : `DÙNG TẠI TIỆM · ${PLACES[location!].label.toUpperCase()}`}
              </small>
              <b>{getCustomer(order.customerId).name}</b>
              <p>
                {props.carrying
                  ? near
                    ? "Đã đến đúng chỗ. Giao ly cho khách nhé."
                    : "Ly đã trên tay. Mang đến đúng vị trí của khách."
                  : getCustomer(order.customerId).greeting}
              </p>
              {props.carrying && navigationAssist && !near && location === navigationAssist && !props.paused && (
                <div role="status" aria-live="polite">
                  <p>Đường tới {PLACES[navigationAssist].label.toLowerCase()} chưa tiến triển. Bạn có thể dùng điều khiển địa điểm đơn giản.</p>
                  <button type="button" onClick={useSimplePlaceNavigation}>
                    Đi tới {PLACES[navigationAssist].label} bằng chế độ đơn giản
                  </button>
                </div>
              )}
              {props.carrying && (
                <button
                  className="primary-button"
                  disabled={!near}
                  onClick={props.onDeliver}
                >
                  Giao ly cho {getCustomer(order.customerId).name}
                </button>
              )}
            </div>
          )}
          <div className="walk-ui">
            {!props.exploring && <div className="place-buttons" aria-label="Đi đến địa điểm">
              {(
                Object.entries(PLACES) as [Place, (typeof PLACES)[Place]][]
              ).map(([id, place]) => (
                <button
                  key={id}
                  className={location === id ? "destination" : ""}
                  onClick={() => go(id)}
                >
                  <span>
                    {id === "counter"
                      ? "▰"
                      : id === "door"
                        ? "↗"
                        : id.slice(-1).padStart(2, "0")}
                  </span>
                  {place.label}
                  {location === id && <i>Khách chờ</i>}
                </button>
              ))}
            </div>}
            <div className="movement-row">
              <small>
                {overview ? "Chạm sàn để đi · kéo để xoay" : "Kéo núm tròn để đi · vuốt cảnh để xoay camera"}
              </small>
              <MovementStick disabled={props.paused||status!=='ready'} onMove={stick=>{runtime.current?.analog(stick);if(stick.x||stick.y){lastShopPlace.current=null;pendingShopPlace.current=null;setNavigationAssist(null);setOverview(false);}}}/>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
