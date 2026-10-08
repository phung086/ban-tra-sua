import type { Position } from './service';
import {overlapsFootprint,SHOP_STREET_PROPS,PLAYER_RADIUS} from './collision';

export const CITY_PLACES = {
  shop: { x: 0, z: 2.15, name: 'Tiệm trà Phố Nhỏ', detail: 'Pha đơn đặt trước · trở về mở tiệm', hours: [420, 1260] },
  market: { x: -26, z: -9, name: 'Chợ Ngọc Hà', detail: 'Mua trà, sữa và bao bì từ cô Hạnh', hours: [360, 1080] },
  school: { x: 26, z: -9, name: 'Sân trường An Hòa', detail: 'Trà đào cho nhóm học sinh', hours: [420, 1080] },
  apartments: { x: 0, z: -35, name: 'Khu tập thể An Hòa', detail: 'Trà sữa cho những người hàng xóm', hours: [420, 1260] },
  library: { x: -26, z: -29, name: 'Hiệu sách bên phố', detail: 'Trà ô long cho câu lạc bộ đọc sách', hours: [480, 1200] },
  lake: { x: 25, z: -27, name: 'Hồ An Hòa', detail: 'Nghỉ chân bên hồ · gặp bác Minh', hours: [360, 1320] },
  park: { x: -6, z: -28, name: 'Vườn hoa tổ dân phố', detail: 'Chăm cây · góp sức cho khu phố', hours: [360, 1260] },
  bus: { x: -15, z: -23, name: 'Điểm xe buýt 09', detail: 'Tuyến về tiệm · 7.000 ₫ một lượt', hours: [360, 1260] },
  oldtown: { x: -57, z: -46, name: 'Phố Lò Gốm', detail: 'Phố cổ, hàng thủ công và những mái ngói', hours: [360, 1260] },
  plaza: { x: 0, z: -69, name: 'Quảng trường Đông Phong', detail: 'Hội chợ cuối tuần · sân chơi của thành phố', hours: [360, 1260] },
  riverside: { x: 56, z: -43, name: 'Đường ven sông', detail: 'Đường dạo dưới hàng cây · gặp gỡ và chụp ảnh', hours: [360, 1260] },
  temple: { x: -30, z: -79, name: 'Sân đình Hạ', detail: 'Mái ngói, sân gạch và hội làng trong phố', hours: [360, 1260] },
} as const;
export const CITY_BOUNDS={minX:-76,maxX:76,minZ:-96,maxZ:4};
export const CITY_MAP={width:160,height:116,offsetX:80,offsetZ:100};
export const CITY_EXTENDED_BUILDINGS=Array.from({length:30},(_,i)=>{
  const row=Math.floor(i/10),column=i%10;
  return {x:-63+column*14,z:row===0?-88:row===1?-74:-58,width:8+(i%3),depth:6,height:3+(i%4),color:['#dac9a9','#b8c5bb','#e0c5b4','#b8c5cf','#d4d2c4'][i%5]};
}).filter(b=>!(Math.abs(b.x+30)<13&&b.z<-70)&&!(Math.abs(b.x)<12&&b.z>-80));
export type CityPlace = keyof typeof CITY_PLACES;
export type Block = { x: number; z: number; width: number; depth: number };
// Shared by geometry, navigation and the map, including the incumbent shop fronts.
export const CITY_BLOCKS: Block[] = [
  ...Array.from({ length: 5 }, (_, i) => ({ x: (i - 2) * 4.6, z: -11.3, width: 4.5, depth: 2 })),
  { x: -26, z: -17, width: 12, depth: 6 },
  { x: 26, z: -18, width: 11.5, depth: 5 },
  { x: -26, z: -36, width: 11.5, depth: 5.8 },
  { x: 0, z: -41, width: 16.5, depth: 5 },
  { x: 26, z: -35.5, width: 14, depth: 13 },
  ...Array.from({length:8},(_,i)=>[-1,1].map(side=>({x:side*41,z:-6-i*5.1,width:5,depth:4.8}))).flat(),
  ...Array.from({length:7},(_,i)=>({x:-18+i*6,z:-51,width:5.8,depth:5})),
  ...CITY_EXTENDED_BUILDINGS.map(b=>({...b,depth:6})),
  {x:-30,z:-87,width:17,depth:9},
  ...Array.from({length:4},(_,i)=>({x:-66,z:-12-i*10,width:5,depth:7})),
];
export const CITY_SOLID_PROPS=[
  ...Array.from({length:4},(_,i)=>({x:-30.5+i*3,z:-11.4,width:2.4,depth:1.3})),
  ...[20.2,31.8].map(x=>({x,z:-11.3,width:.55,depth:.6})),
  {x:6.2,z:-38.4,width:2.5,depth:2.5},
  {x:-17.5,z:-23,width:.1,depth:3.1},
  {x:-34.5,z:-12,width:1.5,depth:.8},
  ...[-35,-34].map(x=>({x,z:-11.15,width:.45,depth:.42})),
  ...[-7,7].map(x=>({x,z:-71.1,width:2.2,depth:.8})),
  ...[1,4,7,10].map(i=>({x:62,z:-9-i*7.5-.1,width:2.2,depth:.8})),
  ...[21,29].map(x=>({x,z:-27.85,width:2.6,depth:.85})),
];
export function cityArea(p:Position){return p.x<-42?'Phố Lò Gốm':p.x>43?'Đường ven sông':p.z<-65&&p.x<-16?'Sân đình Hạ':p.z<-46?'Đông Phong':'An Hòa';}
export const STREET_OBSTACLES = [
  ...Array.from({length:9},(_,i)=>[-1,1].map(side=>({x:side*10.7,z:-16-i*3.1,radius:0.32}))).flat(),
  ...Array.from({length:5},(_,i)=>[-1,1].map(side=>({x:side*34.5,z:-7-i*7,radius:0.35}))).flat(),
  ...Array.from({length:11},(_,i)=>({x:60,z:-9-i*7.5,radius:.3})),
  ...Array.from({length:6},(_,i)=>[-1,1].map(side=>({x:side*48,z:-50-i*7.2,radius:.3}))).flat(),
  {x:0,z:-76,radius:2.85},
  ...[-9,9].map(x=>({x,z:-78,radius:.29})),
  ...[-41,-19].map(x=>({x,z:-79,radius:.34})),
  ...Array.from({length:4},(_,i)=>[-1,1].map(side=>({x:side*17.8,z:-8-i*10,radius:.1}))).flat(),
  ...[-19,19].map(x=>({x,z:-20,radius:.32})),
];
export function outdoorsWalkable(p: Position) {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) return false;
  if (p.x<CITY_BOUNDS.minX||p.x>CITY_BOUNDS.maxX||p.z<CITY_BOUNDS.minZ||p.z>-4.3) return false;
  // The storefront has a real doorway; the side walls remain solid.
  if (p.z > -5.25 && Math.abs(p.x) > 1.28 && Math.abs(p.x) < 5.15) return false;
  if(p.x>65-PLAYER_RADIUS)return false;
  return !CITY_BLOCKS.some(b => overlapsFootprint(p,b))
    && !CITY_SOLID_PROPS.some(b=>overlapsFootprint(p,b))
    && !SHOP_STREET_PROPS.some(b=>overlapsFootprint(p,b))
    && !STREET_OBSTACLES.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<o.radius+PLAYER_RADIUS)
    && ![21,29].some(x=>Math.abs(p.x-x)<1.5 && Math.abs(p.z+27.7)<0.55);
}
export function nearCityPlace(position: Position, place: CityPlace) {
  const p = CITY_PLACES[place];
  return Math.hypot(position.x - p.x, position.z - p.z) <= 1.8;
}
