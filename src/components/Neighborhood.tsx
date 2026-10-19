import {CityMapDrawing} from './CityMapDrawing';
import { useState } from 'react';
import type { BaseId, GameState } from '../game/types';
import type { Position } from '../game/service';
import { CITY_PLACES, nearCityPlace, type CityPlace } from '../game/cityMap';
import { CITY_PROJECTS, cityContracts, cityTime, cityWeather, getMarketOffers, type CityAction } from '../game/city';
import { RESTOCK_ITEMS } from '../game/content';
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
        {selected === 'market' && <div className="market-day-choices" aria-label="Chọn giỏ hàng tại chợ">
          {game.day === 10 && <p className="market-day-story" role="status">🥬 Ngày 10 · Chợ Ngọc Hà tăng giá. Cô Hạnh đưa ra hai giỏ nhập hàng, bạn chọn theo tiền quỹ và số đơn dự kiến.</p>}
          {game.day === 11 && <article className="market-basket" aria-label="Ngày 11: lời nhờ của cô Hạnh">
            <h4>📦 Ngày 11 · Cô Hạnh thiếu người dọn quầy</h4>
            <p>Bạn giúp cô dọn thùng hàng để được giảm 6.000 ₫ vào ngày mai, hay về tiệm sớm với 2 ly M dự phòng? Cả hai đều có hậu quả lưu qua ngày.</p>
            {game.relationshipRewardIds.includes('market.day11.help') || game.relationshipRewardIds.includes('market.day11.hurry')
              ? <p role="status">{game.relationshipRewardIds.includes('market.day11.help')
                  ? 'Đã giúp cô Hạnh. Ngày 12 cô sẽ giảm 6.000 ₫ giỏ nguyên liệu.'
                  : 'Đã chọn về tiệm sớm. Bạn nhận thêm 2 ly M hôm nay.'}</p>
              : <div className="market-day-actions">
                <button type="button" disabled={!near || game.phase === 'open' || city.energy < 12 || city.minutes + 20 > CITY_PLACES.market.hours[1]}
                  onClick={() => onAction({ type: 'supplier', choice: 'help' })}>Giúp dọn quầy · 20 phút · 12 sức lực</button>
                <button type="button" disabled={!near || game.phase === 'open' || city.energy < 2 || city.minutes + 5 > CITY_PLACES.market.hours[1]}
                  onClick={() => onAction({ type: 'supplier', choice: 'hurry' })}>Về tiệm sớm · 5 phút · 2 sức lực</button>
              </div>}
          </article>}
          {game.day === 17 && <article className="market-basket" aria-label="Ngày 17: Cô Hạnh giữ lạnh trà khi chợ mất điện">
            <h4>🧊 Ngày 17 · Chợ Ngọc Hà mất điện</h4>
            <p>Tủ mát ngừng chạy, cô Hạnh lo trà bị hỏng. Bạn mang 3 phần đá sạch từ tiệm, hay cùng cô nhờ quầy bên cạnh cho mượn thùng giữ nhiệt? Cô sẽ nhớ việc bạn làm khi nhập hàng Ngày 18.</p>
            {game.relationshipRewardIds.some(id => id.startsWith('market.day17.'))
              ? <p role="status">{game.relationshipRewardIds.includes('market.day17.ice')
                ? 'Đã mang đá giúp cô Hạnh. Giỏ nguyên liệu Ngày 18 giảm 8.000 ₫.'
                : 'Đã nhờ quầy bên cạnh giúp giữ nhiệt. Giỏ nguyên liệu Ngày 18 giảm 3.000 ₫.'}</p>
              : <div className="market-day-actions">
                <p>Mang đá cần 3 phần đá còn tươi. Không đủ đá vẫn có thể nhờ hàng xóm mà không mất tiền hay nguyên liệu.</p>
                <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 8 || city.minutes + 15 > Math.min(1260, CITY_PLACES.market.hours[1]) || game.inventory.ice < 3 || game.freshness.ice < 20}
                  onClick={() => onAction({ type: 'marketCooling', choice: 'ice' })}>Mang 3 phần đá · 15 phút · 8 sức</button>
                <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 2 || city.minutes + 6 > Math.min(1260, CITY_PLACES.market.hours[1])}
                  onClick={() => onAction({ type: 'marketCooling', choice: 'borrow' })}>Nhờ mượn thùng giữ nhiệt · 6 phút · 2 sức</button>
              </div>}
          </article>}
          {game.day === 18 && game.relationshipRewardIds.some(id => id.startsWith('market.day17.')) && <p role="status" className="market-day-story">Cô Hạnh nhớ chuyện mất điện hôm qua: giỏ nguyên liệu hôm nay được giảm giá.</p>}
          {getMarketOffers(game).map(offer => <article className="market-basket" key={offer.id}>
            <h4>{offer.title} · {formatMoney(offer.cost)}</h4>
            <p>{offer.detail}</p>
            <small>{offer.stock.map(([key, count]) => `${count} ${RESTOCK_ITEMS.find(item => item.key === key)?.label ?? key}`).join(' · ')} · {offer.minutes} phút · {offer.energy} sức lực</small>
            <button type="button" disabled={!near || city.errands.includes('market') || game.cash < offer.cost || city.energy < offer.energy || game.phase === 'open' || city.minutes + offer.minutes > CITY_PLACES.market.hours[1]}
              onClick={() => onAction({type:'market', basket:offer.id})}>
              <GameIcon name="box"/>{city.errands.includes('market') ? 'Đã mua hôm nay' : `Chọn giỏ · ${formatMoney(offer.cost)}`}
            </button>
          </article>)}
        </div>}
        {selected === 'school' && game.day === 12 && <article className="market-basket" aria-label="Ngày 12: Lan và nhóm trực nhật">
          <h4>☔ Ngày 12 · Lan trực nhật giữa mưa phùn</h4>
          <p>Nhóm Lan cần 2 ly trà đào. Bạn tặng nhóm, bán giá bạn bè 38.000 ₫, hay thành thật hẹn lần khác? Lựa chọn sẽ ảnh hưởng đơn giao Ngày 13.</p>
          {game.relationshipRewardIds.some(id => id.startsWith('school.day12.'))
            ? <p role="status">{game.relationshipRewardIds.includes('school.day12.gift')
                ? 'Bạn đã tặng 2 ly. Lan sẽ giới thiệu một đơn lớn hơn vào Ngày 13.'
                : game.relationshipRewardIds.includes('school.day12.sell')
                  ? 'Bạn đã bán 2 ly giá bạn bè. Nhóm sẽ đặt thêm vào Ngày 13.'
                  : 'Bạn đã hẹn lại, không mất nguyên liệu.'}</p>
            : <div className="market-day-actions">
              <p>Cần 2 trà đào, 2 ly M, 1 đường và 2 đá còn tươi. Thiếu hàng vẫn có thể hẹn lại.</p>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 10 || city.minutes + 20 > CITY_PLACES.school.hours[1] || game.inventory.peachTea < 2 || game.inventory.cupsM < 2 || game.inventory.sugar < 1 || game.inventory.ice < 2 || !(['peachTea','cupsM','sugar','ice'] as const).every(key => game.freshness[key] >= 20)} onClick={() => onAction({ type: 'school', choice: 'gift' })}>Tặng 2 ly · 20 phút · 10 sức · +4 thiện cảm</button>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 6 || city.minutes + 12 > CITY_PLACES.school.hours[1] || game.inventory.peachTea < 2 || game.inventory.cupsM < 2 || game.inventory.sugar < 1 || game.inventory.ice < 2 || !(['peachTea','cupsM','sugar','ice'] as const).every(key => game.freshness[key] >= 20)} onClick={() => onAction({ type: 'school', choice: 'sell' })}>Bán 2 ly · 38.000 ₫ · 12 phút · 6 sức</button>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 1 || city.minutes + 3 > CITY_PLACES.school.hours[1]} onClick={() => onAction({ type: 'school', choice: 'reschedule' })}>Hẹn lần sau · 3 phút · 1 sức</button>
            </div>}
        </article>}
        {selected === 'school' && game.day === 13 && (game.relationshipRewardIds.includes('school.day12.gift') || game.relationshipRewardIds.includes('school.day12.sell')) && <p role="status" className="market-day-story">Lan nhớ cuộc gặp hôm qua: đơn trà đào ở mục Giao trà hôm nay có giá trị cao hơn.</p>}
        {selected === 'school' && game.day === 13 && <article className="market-basket" aria-label="Ngày 13: Lan chuẩn bị hội chợ lớp">
          <h4>🎨 Ngày 13 · Lan chuẩn bị hội chợ lớp</h4>
          <p>Lan muốn có bảng giới thiệu quầy trà cho hội chợ ngày mai. Bạn mua màu ở lại vẽ bảng, hay đưa thực đơn để nhóm tự chia sẻ? Hai cách đều thay đổi đơn trà Ngày 14.</p>
          {game.relationshipRewardIds.some(id => id.startsWith('school.day13.'))
            ? <p role="status">{game.relationshipRewardIds.includes('school.day13.paint')
              ? 'Đã cùng Lan vẽ bảng. Ngày 14 nhóm sẽ đặt thêm 8.000 ₫ trà.'
              : 'Đã đưa thực đơn. Ngày 14 nhóm sẽ đặt thêm 3.000 ₫ trà.'}</p>
            : <div className="market-day-actions">
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || game.cash < 8000 || city.energy < 12 || city.minutes + 20 > CITY_PLACES.school.hours[1]}
                onClick={() => onAction({ type: 'schoolFair', choice: 'paint' })}>Cùng vẽ bảng · 8.000 ₫ · 20 phút · 12 sức</button>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 2 || city.minutes + 5 > CITY_PLACES.school.hours[1]}
                onClick={() => onAction({ type: 'schoolFair', choice: 'share' })}>Đưa thực đơn · 5 phút · 2 sức</button>
            </div>}
        </article>}
        {selected === 'apartments' && game.day === 14 && <article className="market-basket" aria-label="Ngày 14: Cô Thu chuẩn bị họp khu tập thể">
          <h4>🏘️ Ngày 14 · Buổi họp khu tập thể An Hòa</h4>
          <p>Thang máy hỏng, cô Thu đang kê ghế chuẩn bị họp tầng. Bạn mang 2 ly trà sữa và phụ kê ghế, hay nhờ hàng xóm cùng giúp? Lựa chọn ảnh hưởng đơn Ngày 15.</p>
          {game.relationshipRewardIds.some(id => id.startsWith('apartments.day14.'))
            ? <p role="status">{game.relationshipRewardIds.includes('apartments.day14.carry')
              ? 'Đã mang trà và kê ghế cùng cô Thu. Đơn khu tập thể Ngày 15 tăng 10.000 ₫.'
              : 'Đã nhờ hàng xóm phối hợp. Đơn khu tập thể Ngày 15 tăng 4.000 ₫.'}</p>
            : <div className="market-day-actions">
              <p>Mang trà cần 2 trà sữa truyền thống, 2 ly M, 1 đường và 2 đá còn tươi. Thiếu nguyên liệu vẫn có thể nhờ hàng xóm.</p>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 12 || city.minutes + 22 > CITY_PLACES.apartments.hours[1] || game.inventory.classicMilkTea < 2 || game.inventory.cupsM < 2 || game.inventory.sugar < 1 || game.inventory.ice < 2 || !(['classicMilkTea','cupsM','sugar','ice'] as const).every(key => game.freshness[key] >= 20)}
                onClick={() => onAction({ type: 'apartmentMeet', choice: 'carry' })}>Mang 2 ly và kê ghế · 22 phút · 12 sức</button>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 2 || city.minutes + 6 > CITY_PLACES.apartments.hours[1]}
                onClick={() => onAction({ type: 'apartmentMeet', choice: 'coordinate' })}>Nhờ hàng xóm cùng giúp · 6 phút · 2 sức</button>
            </div>}
        </article>}
        {selected === 'apartments' && game.day === 15 && game.relationshipRewardIds.some(id => id.startsWith('apartments.day14.')) && <p role="status" className="market-day-story">Cô Thu nhớ buổi họp hôm qua: đơn trà khu tập thể trong mục Giao trà hôm nay có giá trị cao hơn.</p>}
        {selected === 'library' && game.day === 15 && <article className="market-basket" aria-label="Ngày 15: Anh Nam chuẩn bị góc đọc sách">
          <h4>📚 Ngày 15 · Góc đọc sách của anh Nam</h4>
          <p>Anh Nam đang kê lại góc đọc cho trẻ trong xóm. Bạn pha 2 ly ô long mời nhóm hay giúp anh xếp sách và dán lịch đọc? Đơn hiệu sách Ngày 16 sẽ thay đổi.</p>
          {game.relationshipRewardIds.some(id => id.startsWith('library.day15.'))
            ? <p role="status">{game.relationshipRewardIds.includes('library.day15.brew')
              ? 'Đã pha trà cho góc đọc. Đơn hiệu sách Ngày 16 tăng 8.000 ₫.'
              : 'Đã giúp xếp sách. Đơn hiệu sách Ngày 16 tăng 3.000 ₫.'}</p>
            : <div className="market-day-actions">
              <p>Pha trà cần công thức ô long, 2 phần ô long, 2 ly M, 1 đường và 2 đá còn tươi. Thiếu hàng vẫn có thể giúp xếp sách.</p>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || !game.unlockedBaseIds.includes('oolong-milk-tea') || city.energy < 10 || city.minutes + 18 > CITY_PLACES.library.hours[1] || game.inventory.oolongMilkTea < 2 || game.inventory.cupsM < 2 || game.inventory.sugar < 1 || game.inventory.ice < 2 || !(['oolongMilkTea','cupsM','sugar','ice'] as const).every(key => game.freshness[key] >= 20)}
                onClick={() => onAction({ type: 'libraryCorner', choice: 'brew' })}>Pha 2 ly ô long · 18 phút · 10 sức</button>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 2 || city.minutes + 6 > CITY_PLACES.library.hours[1]}
                onClick={() => onAction({ type: 'libraryCorner', choice: 'organize' })}>Giúp xếp sách · 6 phút · 2 sức</button>
            </div>}
        </article>}
        {selected === 'library' && game.day === 16 && game.relationshipRewardIds.some(id => id.startsWith('library.day15.')) && <p role="status" className="market-day-story">Anh Nam nhớ bạn đã giúp góc đọc: đơn hiệu sách hôm nay có giá trị cao hơn.</p>}
        {selected === 'lake' && game.day === 16 && <article className="market-basket" aria-label="Ngày 16: Mưa phùn bên hồ An Hòa">
          <h4>🌧️ Ngày 16 · Mưa phùn bên hồ An Hòa</h4>
          <p>Bác Minh chuẩn bị buổi đi bộ khu phố nhưng ghế nghỉ bị mưa tạt. Bạn mua bạt che chỗ nghỉ, hay nhắn mọi người chuyển vào mái hiên? Cô Thu sẽ nhớ việc bạn làm khi đặt trà Ngày 17.</p>
          {game.relationshipRewardIds.some(id => id.startsWith('lake.day16.'))
            ? <p role="status">{game.relationshipRewardIds.includes('lake.day16.cover')
              ? 'Đã che chỗ nghỉ cho bác Minh. Đơn khu tập thể Ngày 17 tăng 7.000 ₫.'
              : 'Đã báo mọi người chuyển vào mái hiên. Đơn khu tập thể Ngày 17 tăng 3.000 ₫.'}</p>
            : <div className="market-day-actions">
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || game.cash < 9000 || city.energy < 10 || city.minutes + 18 > Math.min(1260, CITY_PLACES.lake.hours[1])}
                onClick={() => onAction({ type: 'lakeRain', choice: 'cover' })}>Mua bạt che ghế · 9.000 ₫ · 18 phút · 10 sức</button>
              <button type="button" disabled={!near || game.phase === 'open' || city.contract !== null || city.energy < 2 || city.minutes + 6 > Math.min(1260, CITY_PLACES.lake.hours[1])}
                onClick={() => onAction({ type: 'lakeRain', choice: 'move' })}>Chuyển vào mái hiên · 6 phút · 2 sức</button>
            </div>}
        </article>}
        {selected === 'lake' && game.day === 17 && game.relationshipRewardIds.some(id => id.startsWith('lake.day16.')) && <p role="status" className="market-day-story">Bác Minh nhớ buổi đi bộ trong mưa: cô Thu đặt thêm trà khu tập thể hôm nay.</p>}
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
