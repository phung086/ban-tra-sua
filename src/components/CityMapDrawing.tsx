import {CITY_BLOCKS,CITY_PLACES} from '../game/cityMap';
import type {Position} from '../game/service';
export function CityMapDrawing({position,wide=false}:{position:Position;wide?:boolean}){
  return <svg viewBox={wide?'-80 -100 160 116':'-40 -48 80 60'} role="img" aria-label={wide?'Thành phố với phố cổ phía tây, quảng trường phía bắc và đường ven sông phía đông':'Khu An Hòa, các đường nối tiệm với chợ, trường và hồ'}>
    <rect x="-80" y="-100" width="160" height="116" fill="#ece2d4"/>
    <path d="M-76 -24H76M-76 -60H76M-15 -92V-4M15 -92V-4M-52 -92V-4M52 -92V-4" fill="none" stroke="#b6b2a8" strokeWidth="6"/>
    <path d="M-76 -7H76" fill="none" stroke="#c4bdb0" strokeWidth="2.5"/>
    <rect x="66" y="-94" width="13" height="88" fill="#8aafb5"/>
    {CITY_BLOCKS.map((b,i)=><rect key={i} x={b.x-b.width/2} y={b.z-b.depth/2} width={b.width} height={b.depth} rx=".6" fill={i===9?'#8aafa9':'#c9b7a1'}/>)}
    <rect x="-12" y="-34" width="14" height="5" fill="#a4b08a"/><rect x="-5" y="-4" width="10" height="8" fill="#cd92aa"/>
    {Object.entries(CITY_PLACES).map(([id,p])=><circle key={id} cx={p.x} cy={p.z} r={wide?1.1:.6} fill="#76604e"/>)}
    <circle cx={position.x} cy={position.z} r={wide?2:1.1} fill="#933965" stroke="white" strokeWidth={wide?.7:.5}/>
    <text x={wide?70:34} y={wide?-89:-40} textAnchor="middle" fontSize={wide?7:4} fill="#553343">B</text>
  </svg>;
}
