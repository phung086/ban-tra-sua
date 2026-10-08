import {CityMapDrawing} from './CityMapDrawing';
import { useState } from 'react';
import type { BaseId, GameState } from '../game/types';
import type { Position } from '../game/service';
import { CITY_PLACES, nearCityPlace, type CityPlace } from '../game/cityMap';
import { CITY_PROJECTS, cityContracts, cityTime, cityWeather, type CityAction } from '../game/city';
import { formatMoney, getDrink } from '../game/engine';
import { CraftGauge } from './CraftGauge';
import { GameIcon } from './GameIcon';
import {NeighborhoodTasks} from './NeighborhoodTasks';
import {RESIDENTS,type ResidentId,type StoryAction} from '../game/neighborhoodStories';
import {CityLeisure} from './CityLeisure';
import type {LifeAction} from '../game/cityLife';

interface Props {
  game: GameState; position: Position;
  onNavigate: (place: CityPlace) => void;
  onAction: (action: CityAction) => void;
  onReturn: () => void;
  onRide: () => void;
  onTalk:(id:ResidentId)=>void;
  onStory:(a:StoryAction)=>void;
  expanded:boolean;
  onExpand:(open:boolean)=>void;
  tab:'map'|'tasks'|'orders'|'community'|'leisure';
  onTab:(tab:Props['tab'])=>void;
  onLife:(action:LifeAction)=>void;
}
export function Neighborhood({game, position, onNavigate, onAction, onReturn, onRide,onTalk,onStory,expanded,onExpand,tab,onTab,onLife}: Props) {
  const [wideMap,setWideMap]=useState(false);
  const [selected, setSelected] = useState<CityPlace>('shop');
  const [base, setBase] = useState<BaseId>('classic-milk-tea');
  const [sugar, setSugar] = useState(50), [fill, setFill] = useState(0);
  const city = game.city, contract = city.contract, weather = cityWeather(game.day);
  const near = nearCityPlace(position, selected);
  const travel = (place: CityPlace) => { setSelected(place); onExpand(false); onNavigate(place); };
  const remaining = contract ? Math.max(0, Math.ceil(contract.deadline - city.minutes)) : 0;
  return <div className={`neighborhood ${expanded?'sheet-open':'sheet-closed'}`}>
    <button className="neighborhood-sheet-toggle" aria-expanded={expanded} onClick={()=>onExpand(!expanded)}>{expanded?'Thu gọn để đi phố':'Mở sổ tay khu phố'}<span className="sheet-grip"/></button>
    <header className="city-title"><div><h2>Một vòng Hà Nội</h2><p>Khu An Hòa · khu phố hư cấu</p></div><button onClick={onReturn}>Về phục vụ</button></header>
    <div className="city-almanac" aria-label="Tình trạng khu phố">
      <strong>{cityTime(city.minutes)}</strong><span>{weather.name} · {weather.temperature}°C</span><span>Sức lực <b>{Math.ceil(city.energy)}/100</b></span>
    </div>
    <p className="city-intro">Tiệm là nhà, khu phố là những người khách quen. Nhập hàng, pha đơn đặt trước rồi mang trà đến tận nơi.</p>
    <div className="city-tabs" role="tablist" aria-label="Hoạt động khu phố">
      {([['tasks','Việc trong xóm','board'],['map','Bản đồ','map'],['orders','Giao trà','cup'],['leisure','Dạo chơi','fish'],['community','Sổ xóm','chat']] as const).map(([id,name,icon]) => <button key={id} id={`city-tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`city-panel-${id}`} onClick={()=>{onTab(id);onExpand(true);}}><GameIcon name={icon}/><span>{name}</span></button>)}
    </div>
    <div className="neighborhood-sheet-content" id="neighborhood-sheet-content">
    <p className="neighborhood-feedback" role="status" aria-live="polite" aria-atomic="true">{game.notice}</p>
    {tab==='tasks'&&<NeighborhoodTasks game={game} position={position} onNavigate={travel} onTalk={onTalk} onAction={onStory}/>}
    {tab==='leisure'&&<CityLeisure game={game} position={position} onNavigate={travel} onAction={onLife}/>}
    {contract && <div className="city-trip" role="status"><GameIcon name="cup"/><div><b>{contract.packed ? 'Đang mang túi trà' : 'Đơn chờ pha'} · {contract.count} ly</b><p>{CITY_PLACES[contract.destination].name} · {remaining ? `còn ${remaining} phút` : 'đã quá hẹn'}</p></div><button onClick={() => travel(contract.packed ? contract.destination : 'shop')}>{contract.packed ? 'Đi giao' : 'Về pha'}</button></div>}
    {tab === 'map' && <section role="tabpanel" id="city-panel-map" aria-labelledby="city-tab-map">
      <div className="map-scale-controls"><button aria-pressed={!wideMap} onClick={()=>setWideMap(false)}>Khu An Hòa</button><button aria-pressed={wideMap} onClick={()=>setWideMap(true)}>Toàn thành phố</button></div>
      <div className="city-map" aria-label={wideMap?"Bản đồ toàn thành phố":"Bản đồ khu An Hòa"}>
        <CityMapDrawing position={position} wide={wideMap}/>
        {(Object.entries(CITY_PLACES) as [CityPlace,typeof CITY_PLACES[CityPlace]][]).filter(([id,p])=>wideMap?(id==='shop'||Math.abs(p.x)>37||p.z<-46):(Math.abs(p.x)<=37&&p.z>=-46)).map(([id,p])=><button key={id} className={`map-pin ${selected===id?'selected':''}`} style={{left:`${(p.x+(wideMap?80:40))/(wideMap?160:80)*100}%`,top:`${(p.z+(wideMap?100:48))/(wideMap?116:60)*100}%`}} aria-label={`Đi đến ${p.name}`} aria-pressed={selected===id} onClick={()=>travel(id)}>{Object.keys(CITY_PLACES).indexOf(id)+1}</button>)}
      </div>
      <div className="map-legend">Chấm hồng là bạn · chọn một điểm để tự đi theo đường phố.</div>
      <div className="city-place-list">{(Object.entries(CITY_PLACES) as [CityPlace, typeof CITY_PLACES[CityPlace]][]).map(([id,p],i) => <button key={id} aria-pressed={selected===id} onClick={() => travel(id)}><span>{i+1}</span>{p.name}{city.visited.includes(id) && <small>Đã ghé</small>}</button>)}</div>
      <div className="city-location"><h3>{CITY_PLACES[selected].name}</h3><p>{CITY_PLACES[selected].detail}</p><small>Mở {cityTime(CITY_PLACES[selected].hours[0])} đến {cityTime(CITY_PLACES[selected].hours[1])} · {near ? 'Bạn đã đến nơi' : 'Đang chọn điểm đến'}</small>
        {!near && <button onClick={() => travel(selected)}>Đi đến đây</button>}
        {selected === 'shop' ? <button disabled={!near} onClick={onReturn}>Trở lại quầy pha chế</button> : RESIDENTS.some(r=>r.place===selected)&&<button disabled={!near} onClick={() => onTalk(RESIDENTS.find(r=>r.place===selected)!.id)}>Trò chuyện với {RESIDENTS.find(r=>r.place===selected)!.name}</button>}
        {selected === 'market' && <><p className="market-offer">Gói hàng 48.000 ₫: 8 trà đen, 6 trà đào, 12 ly M, 8 đường và 12 đá. Mỗi ngày một gói.</p><button disabled={!near || city.errands.includes('market') || game.cash<48000} onClick={() => onAction({type:'market'})}><GameIcon name="box"/>{city.errands.includes('market') ? 'Đã nhập hàng hôm nay' : 'Mua gói nguyên liệu'}</button></>}
        {['lake','plaza','riverside','temple'].includes(selected) && <button disabled={!near || city.energy>=100} onClick={() => onAction({type:'rest',place:selected})}>Nghỉ 20 phút · hồi 35 sức lực</button>}
        {selected === 'park' && <button disabled={!near || city.errands.includes('garden')} onClick={() => onAction({type:'garden'})}>{city.errands.includes('garden') ? 'Vườn đã được chăm' : 'Chăm vườn hoa · 15 phút'}</button>}
        {selected === 'bus' && <><p>Xe buýt chạy qua khu phố. Lượt về tiệm tốn 7.000 ₫ và 10 phút.</p><button disabled={!near || game.cash<7000} onClick={onRide}>Lên xe về tiệm</button></>}
      </div>
    </section>}
    {tab === 'orders' && <section role="tabpanel" id="city-panel-orders" aria-labelledby="city-tab-orders">
      <h3>Trà mang đến những cuộc hẹn</h3><p className="city-section-copy">Nhận một chuyến, pha tại quầy rồi đi giao. Tiền thưởng và fan về tiệm; ly và nguyên liệu lấy từ kho.</p>
      {!contract && <div className="city-contract-list">{cityContracts(game).map(c => <article key={c.id}><div><h4>{CITY_PLACES[c.destination].name}</h4><p>{c.count} ly {getDrink(c.base).name.toLowerCase()} · {c.sugar}% đường</p><small>Giao trong {c.deadline} phút · {formatMoney(c.reward)}</small></div><button disabled={city.completed.includes(c.destination) || city.minutes>=1080} onClick={() => {setFill(0); onAction({type:'accept', destination:c.destination});}}>{city.completed.includes(c.destination) ? 'Đã giao' : 'Nhận đơn'}</button></article>)}</div>}
      {!game.unlockedBaseIds.includes('oolong-milk-tea') && <p className="city-unlock">Cấp 2 mở đơn trà ô long của hiệu sách.</p>}
      {contract && !contract.packed && <div className="city-brew" key={contract.id}>
        <h3>Pha {contract.count} ly mang đi</h3><p>Khách đặt {getDrink(contract.base).name}, {contract.sugar}% đường. Rót đến 70%, sau đó đóng túi.</p>
        {!nearCityPlace(position,'shop') && <button onClick={() => travel('shop')}>Về quầy để pha đơn</button>}
        <fieldset disabled={!nearCityPlace(position,'shop') || remaining===0}>
          <label htmlFor="city-recipe-base">Loại trà</label><select id="city-recipe-base" value={base} onChange={e => setBase(e.target.value as BaseId)}>{game.unlockedBaseIds.map(id => <option key={id} value={id}>{getDrink(id).name}</option>)}</select>
          <label htmlFor="city-recipe-sugar">Lượng đường</label><select id="city-recipe-sugar" value={sugar} onChange={e => setSugar(Number(e.target.value))}>{[0,25,50,75,100].map(n => <option key={n} value={n}>{n}%</option>)}</select>
          <CraftGauge label="Rót trà cho chuyến giao" icon="" value={fill} target={70} tolerance={6} speed={43} onCommit={setFill} helper="Canh rót gần vạch 70%. Có thể thử lại trước khi đóng túi."/>
          <label className="city-assisted">Rót bằng thanh chỉnh (hỗ trợ thao tác)<input type="range" min="0" max="100" value={fill} aria-label="Mức rót đơn mang đi" onChange={e=>setFill(Number(e.target.value))}/></label>
          <button className="primary-button" onClick={() => onAction({type:'pack',base,sugar,timing:Math.max(0,100-Math.abs(fill-70)*3)})}>Dập nắp và đóng túi {contract.count} ly</button>
        </fieldset>
      </div>}
      {contract?.packed && <div className="city-location"><h3>Túi trà đã sẵn sàng</h3><p>Mang tới {CITY_PLACES[contract.destination].name}. Còn {remaining} phút trong game.</p><button onClick={() => travel(contract.destination)}>Đi đến điểm giao</button><button className="primary-button" disabled={!nearCityPlace(position,contract.destination) || remaining===0} onClick={() => onAction({type:'deliver'})}>Giao trà · {formatMoney(Math.round(contract.reward*(city.projects.includes('lights')?1.1:1)))}</button></div>}
      {contract && <button className="city-cancel" onClick={() => onAction({type:'cancel'})}>Hủy chuyến{contract.packed ? ' (mất nguyên liệu đã pha)' : ''}</button>}
    </section>}
    {tab === 'community' && <section role="tabpanel" id="city-panel-community" aria-labelledby="city-tab-community">
      <div className="community-stats"><p><b>{city.goodwill}</b> thiện cảm trong xóm</p><p><b>{city.deliveries}</b> chuyến giao · {formatMoney(city.income)} thu về</p></div>
      <h3>Cùng chăm chút khu phố</h3><p className="city-section-copy">Gặp hàng xóm và chăm vườn để tăng thiện cảm. Đến vườn hoa để góp tiền cho các dự án có lợi cho tiệm.</p>
      {!nearCityPlace(position,'park') && <button onClick={()=>travel('park')}>Đi đến vườn hoa</button>}
      <div className="city-projects">{CITY_PROJECTS.map(p => <article key={p.id}><h4>{p.name}</h4><p>{p.detail}</p><button disabled={!nearCityPlace(position,'park') || city.projects.includes(p.id) || game.cash<p.cost || (p.id==='club' && city.goodwill<12)} onClick={()=>onAction({type:'project',id:p.id})}>{city.projects.includes(p.id) ? 'Đã hoàn thành' : `Góp ${formatMoney(p.cost)}`}</button></article>)}</div>
      <h3 className="city-journal-title">Chuyện hôm nay</h3><ol className="city-journal">{city.journal.slice(0,8).map((line,i)=><li key={`${i}-${line}`}>{line}</li>)}</ol>
    </section>}
    <footer className="city-footer">Đi phố trước hoặc sau ca bán. Giờ và sức lực tiến theo quãng đường, pha trà và hoạt động; nghỉ dừng màn hình không làm đơn trễ.</footer>
    </div>
  </div>;
}
