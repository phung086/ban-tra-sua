import type {GameState} from './types';
import {CITY_PLACES,nearCityPlace,type CityPlace} from './cityMap';
import type {Position} from './service';

export const FISH=[
  {id:'ro' as const,name:'Cá rô',color:'#8f9b7a',value:4000,note:'Hay gặp ở mép nước yên.'},
  {id:'diec' as const,name:'Cá diếc',color:'#b4a382',value:6000,note:'Một chút kiên nhẫn bên hồ.'},
  {id:'chep' as const,name:'Cá chép',color:'#ca9571',value:9000,note:'Vảy óng dưới nắng buổi sáng.'},
  {id:'tram' as const,name:'Cá trắm',color:'#839a9c',value:12000,note:'Chú cá lớn của hồ An Hòa.'},
];
export type FishId=typeof FISH[number]['id'];
export type DailyId='explore'|'help'|'tea'|'fish';
export interface CityLife {
  stamps:CityPlace[]; fish:Partial<Record<FishId,number>>; attempts:number; albumClaimed:boolean;
  today:{places:CityPlace[];helped:number;deliveries:number;catches:number;claimed:DailyId[]};
}
export function initialLife():CityLife{return {stamps:[],fish:{},attempts:0,albumClaimed:false,today:{places:[],helped:0,deliveries:0,catches:0,claimed:[]}};}
export function resetLifeDay(life:CityLife):CityLife{return {...life,attempts:0,today:initialLife().today};}
export function hydrateLife(value:Partial<CityLife>|undefined):CityLife{
  const life=initialLife();if(!value||typeof value!=='object')return life;
  const places=(a:unknown)=>Array.isArray(a)?[...new Set(a.filter(id=>Object.hasOwn(CITY_PLACES,id)))] as CityPlace[]:[];
  const count=(v:unknown,max=100000)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
  life.stamps=places(value.stamps);life.attempts=count(value.attempts,3);life.albumClaimed=value.albumClaimed===true;
  FISH.forEach(f=>{const n=count(value.fish?.[f.id]);if(n)life.fish[f.id]=n;});
  life.today={places:places(value.today?.places),helped:count(value.today?.helped),deliveries:count(value.today?.deliveries),catches:count(value.today?.catches,3),claimed:Array.isArray(value.today?.claimed)?[...new Set(value.today.claimed.filter(id=>['explore','help','tea','fish'].includes(id)))]:[]};
  return life;
}
export const DAILY_ACTIVITIES=[
  {id:'explore' as const,title:'Đi một vòng phố',detail:'Ghé 3 địa điểm trong ngày',target:3,cash:8000,fans:1},
  {id:'help' as const,title:'Một tay giúp xóm',detail:'Hoàn tất và báo tin 1 việc cho cư dân',target:1,cash:10000,fans:2},
  {id:'tea' as const,title:'Trà tới tận nơi',detail:'Giao thành công 1 đơn trà trong khu phố',target:1,cash:10000,fans:2},
  {id:'fish' as const,title:'Một khoảng nghỉ bên hồ',detail:'Câu được 1 chú cá',target:1,cash:6000,fans:1},
];
export function dailyProgress(life:CityLife,id:DailyId){return id==='explore'?life.today.places.length:id==='help'?life.today.helped:id==='tea'?life.today.deliveries:life.today.catches;}
export type LifeAction={type:'stamp';place:CityPlace}|{type:'fish';precision:number;outcome:'keep'|'release'}|{type:'daily';id:DailyId}|{type:'album'};
export function lifeAction(game:GameState,action:LifeAction,position:Position):GameState{
  if(game.phase==='open')return {...game,notice:'Khách đang đợi. Hết ca mình lại đi phố nhé.'};
  const life=game.city.life;
  const commit=(next:CityLife,notice:string,cash=0,fans=0,minutes=0,energy=0,goodwill=0)=>({...game,cash:game.cash+cash,fans:game.fans+fans,city:{...game.city,life:next,minutes:Math.min(1260,game.city.minutes+minutes),energy:Math.max(0,game.city.energy-energy),goodwill:game.city.goodwill+goodwill,journal:[`Ngày ${game.day} · ${notice}`,...game.city.journal].slice(0,24)},notice});
  if(action.type==='stamp'){
    if(!Object.hasOwn(CITY_PLACES,action.place)||!nearCityPlace(position,action.place))return {...game,notice:'Đến đúng địa điểm để ghi dấu mốc nhé.'};
    if(life.stamps.includes(action.place))return game;
    return commit({...life,stamps:[...life.stamps,action.place]},`Đã ghi dấu ${CITY_PLACES[action.place].name} vào sổ khám phá.`,0,1,2);
  }
  if(action.type==='album'){
    if(life.albumClaimed||life.stamps.length<Object.keys(CITY_PLACES).length)return game;
    return commit({...life,albumClaimed:true},'Đủ 12 dấu mốc thành phố! Nhận 25.000 ₫ và 5 fan cho tiệm.',25000,5);
  }
  if(action.type==='daily'){
    const d=DAILY_ACTIVITIES.find(d=>d.id===action.id);
    if(!d||life.today.claimed.includes(d.id)||dailyProgress(life,d.id)<d.target)return game;
    return commit({...life,today:{...life.today,claimed:[...life.today.claimed,d.id]}},`Xong việc ngày: ${d.title}. Nhận ${d.cash.toLocaleString('vi-VN')} ₫.`,d.cash,d.fans);
  }
  if(!nearCityPlace(position,'lake'))return {...game,notice:'Đến bờ hồ An Hòa để câu cá.'};
  if(life.attempts>=3)return {...game,notice:'Đã câu 3 lượt hôm nay. Ngày mai mình lại ra hồ.'};
  if(game.city.energy<5||game.city.minutes+6>CITY_PLACES.lake.hours[1]||game.city.minutes+6>1260)return {...game,notice:'Nghỉ ngơi hoặc quay lại hồ ngày mai để câu cá nhé.'};
  if(!Number.isFinite(action.precision)||action.precision<0||action.precision>100||!['keep','release'].includes(action.outcome))return game;
  const next={...life,attempts:life.attempts+1};
  if(action.precision<70)return commit(next,'Cá tuột khỏi lưỡi câu. Thử lại, dừng thanh kéo gần vạch 70%.',0,0,6,5);
  const fish=FISH[(game.day-1+life.attempts)%FISH.length],first=!life.fish[fish.id];
  return commit({...next,fish:{...life.fish,[fish.id]:(life.fish[fish.id]??0)+1},today:{...life.today,catches:life.today.catches+1}},`Câu được ${fish.name.toLowerCase()}! ${action.outcome==='release'?'Bạn thả cá về hồ, thêm 2 thiện cảm.':`Bán ở sạp cá, nhận ${fish.value.toLocaleString('vi-VN')} ₫.`}${first?' Loài mới đã ghi vào sổ.':''}`,action.outcome==='keep'?fish.value:0,first?1:0,6,5,action.outcome==='release'?2:0);
}
