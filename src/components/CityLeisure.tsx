import {useState} from 'react';
import type {GameState} from '../game/types';
import type {Position} from '../game/service';
import {CITY_PLACES,nearCityPlace,type CityPlace} from '../game/cityMap';
import {DAILY_ACTIVITIES,FISH,dailyProgress,type LifeAction} from '../game/cityLife';
import {CraftGauge} from './CraftGauge';
import {formatMoney} from '../game/engine';

export function CityLeisure({game,position,onAction,onNavigate}:{game:GameState;position:Position;onAction:(a:LifeAction)=>void;onNavigate:(p:CityPlace)=>void}){
  const [section,setSection]=useState<'daily'|'album'|'fish'>('daily'),[pull,setPull]=useState(0),[outcome,setOutcome]=useState<'keep'|'release'>('release');
  const life=game.city.life,atLake=nearCityPlace(position,'lake');
  return <section role="tabpanel" id="city-panel-leisure" aria-labelledby="city-tab-leisure" className="city-leisure">
    <h3>Nhịp sống An Hòa</h3><p className="city-section-copy">Một việc có ích, một dấu mốc mới, một lúc ngồi bên hồ. Đem những câu chuyện ấy về tiệm trà.</p>
    <div className="leisure-sections" aria-label="Chọn hoạt động">{([['daily','Việc mỗi ngày'],['album','Sổ khám phá'],['fish','Câu cá']] as const).map(([id,label])=><button key={id} aria-pressed={section===id} onClick={()=>setSection(id)}>{label}</button>)}</div>
    {section==='daily'&&<><p className="leisure-note">Ngày {game.day} · nhận mỗi phần thưởng một lần. Bắt đầu ngày bán mới sẽ có bảng việc mới.</p><div className="daily-activities">{DAILY_ACTIVITIES.map(d=>{
      const value=Math.min(d.target,dailyProgress(life,d.id)),claimed=life.today.claimed.includes(d.id);
      return <article key={d.id}><header><h4>{d.title}</h4><span>{value}/{d.target}</span></header><p>{d.detail}</p><progress max={d.target} value={value} aria-label={`Tiến độ ${d.title}`}/><small>{formatMoney(d.cash)} · {d.fans} fan</small><button disabled={claimed||value<d.target} onClick={()=>onAction({type:'daily',id:d.id})}>{claimed?'Đã nhận thưởng':value>=d.target?'Nhận thưởng':'Đang thực hiện'}</button></article>;
    })}</div></>}
    {section==='album'&&<><div className="album-heading"><strong>{life.stamps.length}/{Object.keys(CITY_PLACES).length}</strong><p>Dấu mốc của bạn trong thành phố.<br/>Đến nơi rồi ghi dấu vào sổ.</p></div><div className="stamp-grid">{(Object.entries(CITY_PLACES) as [CityPlace,typeof CITY_PLACES[CityPlace]][]).map(([id,p],i)=>{
      const collected=life.stamps.includes(id),near=nearCityPlace(position,id);
      return <article key={id} className={collected?'collected':''}><span className="place-stamp">{String(i+1).padStart(2,'0')}</span><h4>{p.name}</h4><button disabled={collected} onClick={()=>near?onAction({type:'stamp',place:id}):onNavigate(id)}>{collected?'Đã ghi dấu':near?'Ghi dấu nơi này':'Đi khám phá'}</button></article>;
    })}</div><button className="primary-button" disabled={life.stamps.length<Object.keys(CITY_PLACES).length||life.albumClaimed} onClick={()=>onAction({type:'album'})}>{life.albumClaimed?'Đã nhận kỷ niệm An Hòa':'Đủ 12 dấu · nhận 25.000 ₫ và 5 fan'}</button></>}
    {section==='fish'&&<><div className="fishing-scene" aria-hidden="true"><svg viewBox="0 0 64 40"><path d="M8 9v20l10-7c8 15 33 11 39-5-7-14-29-17-39-4Z" fill="#95ada3"/><circle cx="46" cy="15" r="2" fill="#475b51"/><path d="M30 7l6-6 7 6M28 28l7 8 7-6" fill="#718c7b"/></svg><span>Hồ An Hòa</span></div><h4>Mượn cần câu của bác Minh</h4><p className="city-section-copy">Mỗi ngày 3 lượt · mỗi lượt 6 phút và 5 sức lực. Dừng thanh kéo gần 70% để bắt cá. Chọn thả về hồ hoặc bán tại sạp.</p><p className="fishing-attempts">Còn {Math.max(0,3-life.attempts)} lượt hôm nay</p>
      {!atLake&&<button onClick={()=>onNavigate('lake')}>Đi ra bờ hồ</button>}
      <fieldset disabled={!atLake||life.attempts>=3||game.city.energy<5}>
        <CraftGauge key={life.attempts} label="Kéo dây câu" icon="" value={pull} target={70} tolerance={10} speed={37} onCommit={setPull} helper="Giữ rồi thả khi dây gần vạch. Có thể chỉnh trước khi chốt lượt."/>
        <label className="city-assisted">Hỗ trợ canh dây<input type="range" min="0" max="100" value={pull} onChange={e=>setPull(Number(e.target.value))} aria-label="Mức kéo dây câu"/></label>
        <div className="fish-outcome"><button aria-pressed={outcome==='release'} onClick={()=>setOutcome('release')}>Thả về hồ<small>+2 thiện cảm khi bắt được</small></button><button aria-pressed={outcome==='keep'} onClick={()=>setOutcome('keep')}>Bán tại sạp<small>4.000–12.000 ₫ tùy loài</small></button></div>
        <button className="primary-button" onClick={()=>{onAction({type:'fish',precision:Math.max(0,100-Math.abs(pull-70)*3),outcome});setPull(0);}}>Chốt lượt câu</button>
      </fieldset><p className="leisure-note" role="status">{game.notice}</p><h4 className="fish-catalog-title">Những loài đã gặp · {FISH.filter(f=>life.fish[f.id]).length}/4</h4><div className="fish-catalog">{FISH.map(f=><article key={f.id} className={life.fish[f.id]?'discovered':''}><span style={{background:f.color}} aria-hidden="true"/><div><h5>{f.name}</h5><p>{life.fish[f.id]?`${life.fish[f.id]} lần bắt · ${f.note}`:'Chưa ghi vào sổ'}</p></div></article>)}</div>
    </>}
  </section>;
}
