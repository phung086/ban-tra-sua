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
  const [status, setStatus] = useState("loading"),
    [overview, setOverview] = useState(false);
  const [fallbackPlace, setFallbackPlace] = useState<Place>("counter");
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
        runtime.current=new StreetRuntime(container.current,latest.current,p=>latest.current.onPosition(p),()=>setStatus('fallback'),factory?(scene,camera,profile)=>new factory(scene,camera,profile):undefined,prefs.graphics,initial);
        setStatus('ready');
      }catch(error){
        if(cancelled||ticket!==generation)return;
        console.error('Không mở được đồ họa',error);setStatus('fallback');
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
  const go = (place: Place) => {
    if (runtime.current && status === "ready") runtime.current.go(place);
    else {
      setFallbackPlace(place);
      props.onPosition(PLACES[place]);
    }
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
              <MovementStick disabled={props.paused||status!=='ready'} onMove={stick=>{runtime.current?.analog(stick);if(stick.x||stick.y)setOverview(false);}}/>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
