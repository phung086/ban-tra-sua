import type {GameState} from '../game/types';
import type {Position} from '../game/service';
import {CITY_PLACES,nearCityPlace,type CityPlace} from '../game/cityMap';
import {RESIDENTS,missionFor,missionDefinition,missionObjective,type ResidentId,type StoryAction} from '../game/neighborhoodStories';
import {CITY_EPISODES} from '../game/cityEpisodes';
import {HoldTask} from './HoldTask';

export function NeighborhoodTasks({game,position,onNavigate,onTalk,onAction}:{game:GameState;position:Position;onNavigate:(p:CityPlace)=>void;onTalk:(id:ResidentId)=>void;onAction:(a:StoryAction)=>void}) {
  const active=game.city.stories.missions.filter(m=>m.status!=='complete');
  return <section role="tabpanel" id="city-panel-tasks" aria-labelledby="city-tab-tasks" className="neighborhood-tasks">
    <h3>Việc nhỏ trong phố</h3><p className="city-section-copy">Gặp hàng xóm, nghe họ kể và chọn cách giúp. Mỗi lựa chọn mở một câu chuyện; việc chưa xong vẫn còn vào ngày mai.</p>
    {active.length>0&&<div className="active-errands">{active.map(m=>{
      const d=missionDefinition(m.id),objective=missionObjective(m),npc=RESIDENTS.find(r=>r.id===d.resident)!,near=nearCityPlace(position,objective.place);
      return <article key={m.id}><header><h4>{d.title}</h4><small>{m.status==='ready'?'Chờ báo tin':`${m.step+1}/${d.steps.length}`}</small></header><p>{objective.title}</p><small>{CITY_PLACES[objective.place].name}{m.status==='active'?` · ${objective.minutes} phút trong game`:''}</small>
        {m.status==='ready'?<button disabled={!near} onClick={()=>onTalk(npc.id)}>Báo tin cho {npc.name}</button>:near?<HoldTask key={`${m.id}-${m.step}`} label={objective.verb} disabled={game.city.energy<objective.energy} onComplete={()=>onAction({type:'task',mission:m.id,step:m.step})}/>:null}
        {!near&&<button onClick={()=>onNavigate(objective.place)}>Đi đến chỗ làm việc</button>}
      </article>;
    })}</div>}
    <h3 className="residents-title">Những người bạn trong xóm</h3>
    <div className="resident-list">{RESIDENTS.map(npc=>{const m=missionFor(game.city.stories,npc.id),near=nearCityPlace(position,npc.place);return <article key={npc.id}><span className="resident-initial" style={{background:npc.color}}>{npc.name.split(' ').at(-1)?.slice(0,1)}</span><div><h4>{npc.name}</h4><p>{npc.role}</p><small>{m?.status==='complete'?(CITY_EPISODES.some(next=>next.resident===npc.id&&next.episode===(missionDefinition(m.id).episode??1)+1)?'Chuyện mới · ':'Đã giúp · ')+(game.city.stories.bonds[npc.id]??0)+' thân thiết':m?.status==='ready'?'Đang chờ bạn báo tin':m?'Đã nhận việc':CITY_PLACES[npc.place].name}</small></div><button onClick={()=>near?onTalk(npc.id):onNavigate(npc.place)}>{near?'Nói chuyện':'Đến gặp'}</button></article>;})}</div>
    <p className="city-footer">Tối đa 3 việc đang nhận. Làm xong quay lại trò chuyện để chọn nhận tiền công hoặc giúp không lấy tiền.</p>
  </section>;
}
