import type {GameState} from './types';
import type {Position} from './service';
import {createDayRandom} from './lifeSim/rng';

export type StreetChoice='help'|'pass';
export type StreetState={
  injuryUntil:number;severity:number;lastImpactAt:number;
  eventDay:number;choice:StreetChoice|null;
};
export const initialStreetState=():StreetState=>({injuryUntil:0,severity:0,lastImpactAt:-1,eventDay:0,choice:null});
export function hydrateStreet(value:Partial<StreetState>|undefined):StreetState {
  const number=(n:unknown,fallback=0,max=1e12)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(max,n)):fallback;
  return {injuryUntil:number(value?.injuryUntil),severity:number(value?.severity,0,3),
    lastImpactAt:typeof value?.lastImpactAt==='number'&&Number.isFinite(value.lastImpactAt)?value.lastImpactAt:-1,
    eventDay:Math.floor(number(value?.eventDay)),choice:value?.choice==='help'||value?.choice==='pass'?value.choice:null};
}
export const streetMinute=(state:Pick<GameState,'day'|'city'>)=>state.day*1440+state.city.minutes;
export function streetInjury(state:Pick<GameState,'day'|'city'>){
  const injury=hydrateStreet(state.city.street),remaining=Math.max(0,injury.injuryUntil-streetMinute(state));
  return {remaining,severity:remaining>0?injury.severity:0,speedScale:remaining>0?.5:1};
}
export function streetPlan(state:Pick<GameState,'day'|'morning'>){
  const random=createDayRandom({worldSeed:state.morning.worldSeed,day:state.day,channel:'physical-street-v1'});
  const kind=(['breakdown','crossing','delivery'] as const)[Math.floor(random()*3)];
  return {kind,point:kind==='breakdown'?{x:-12,z:-22.5}:kind==='crossing'?{x:15,z:-19.6}:{x:-26,z:-9},
    help:kind==='breakdown'?'Giúp khởi động xe':kind==='crossing'?'Dẫn hàng xóm qua đường':'Phụ dỡ hàng',
    title:kind==='breakdown'?'Xe máy chết máy giữa phố':kind==='crossing'?'Hàng xóm đang chờ qua đường':'Chợ đang dỡ chuyến hàng sáng',
    detail:kind==='breakdown'?'Một xe phải dừng; những xe phía sau giữ khoảng cách.':kind==='crossing'?'Người đi bộ qua vạch kẻ, xe giảm tốc nhường đường.':'Cô Hạnh cần người phụ dỡ hàng; người đi chợ ghé quầy nhiều hơn.',
    speed:2.8+random()*.8};
}
export function recordStreetImpact(state:GameState,speed:number):GameState {
  if(state.phase==='open'||!Number.isFinite(speed)||speed<1.1)return state;
  const previous=hydrateStreet(state.city.street),now=streetMinute(state);
  if(previous.lastImpactAt>=0&&now-previous.lastImpactAt<2)return state;
  const severity=Math.min(3,Math.max(1,Math.ceil(speed/2)));
  const notice=severity>=2?'Bạn bị xe va trúng và đau chân. Hãy ra vỉa hè nghỉ, tránh tiếp tục băng qua đường.':'Bạn bị va quệt, chân bị đau và đi chậm hơn. Có thể nghỉ miễn phí trên vỉa hè.';
  return {...state,notice,city:{...state.city,energy:Math.max(0,state.city.energy-severity*8),
    street:{...previous,severity,injuryUntil:Math.max(previous.injuryUntil,now+severity*45),lastImpactAt:now},
    journal:[notice,...state.city.journal].slice(0,24)}};
}
export function onCarriageway(p:Position){
  return (p.z>-27.5&&p.z<-20.5&&Math.abs(p.x)<38)||([-15,15].some(x=>Math.abs(p.x-x)<3)&&p.z<-4&&p.z>-48);
}
export function restStreetInjury(state:GameState,position:Position):GameState {
  if(state.phase==='open'||!streetInjury(state).severity)return state;
  if(onCarriageway(position))return {...state,notice:'Ra khỏi lòng đường rồi hãy nghỉ. Bạn vẫn có thể đi chậm đến vỉa hè.'};
  const street=hydrateStreet(state.city.street),now=streetMinute(state);
  return {...state,notice:'Đã nghỉ và chăm sóc chân 20 phút, hồi 40 phút chấn thương. Việc giao trà vẫn tính theo giờ hẹn.',
    city:{...state.city,minutes:Math.min(1260,state.city.minutes+20),energy:Math.min(100,state.city.energy+10),
      street:{...street,injuryUntil:Math.max(now,street.injuryUntil-40)}}};
}
export function resolveStreetEvent(state:GameState,choice:StreetChoice,position:Position):GameState {
  if(state.phase==='open'||(choice!=='help'&&choice!=='pass'))return state;
  const street=hydrateStreet(state.city.street),plan=streetPlan(state);
  if(street.eventDay===state.day||Math.hypot(position.x-plan.point.x,position.z-plan.point.z)>3.2)return state;
  if(choice==='help'&&(state.city.energy<4||state.city.minutes>1252))return {...state,notice:'Bạn có thể tiếp tục đi miễn phí, rồi quay lại vào ngày mai.'};
  return {...state,notice:choice==='help'?plan.help+' xong, bạn mất 8 phút và được thêm 2 thiện cảm.':'Bạn tiếp tục công việc; hàng xóm tự thu xếp.',
    city:{...state.city,minutes:state.city.minutes+(choice==='help'?8:0),energy:state.city.energy-(choice==='help'?4:0),
      goodwill:state.city.goodwill+(choice==='help'?2:0),street:{...street,eventDay:state.day,choice}}};
}
