export type Footprint={x:number;z:number;width:number;depth:number;yaw?:number};
export const PLAYER_RADIUS=.38;
// Circle against an oriented rectangle, including the player's whole body.
export function overlapsFootprint(p:{x:number;z:number},b:Footprint,radius=PLAYER_RADIUS){
  const c=Math.cos(b.yaw??0),s=Math.sin(b.yaw??0),dx=p.x-b.x,dz=p.z-b.z;
  const x=dx*c-dz*s,z=dx*s+dz*c;
  const ox=Math.max(0,Math.abs(x)-b.width/2),oz=Math.max(0,Math.abs(z)-b.depth/2);
  return ox*ox+oz*oz<radius*radius;
}
export const PARKED_SCOOTER:Footprint={x:-3.4,z:-6.4,width:.65,depth:1.92,yaw:-.4};
export const SHOP_STREET_PROPS:Footprint[]=[PARKED_SCOOTER,...Array.from({length:3},(_,i)=>({x:2.8+i*.8,z:-6.1,width:.42,depth:.42}))];
export const SHOP_FURNITURE:Footprint[]=[
  {x:0,z:1,width:5.85,depth:1.35},
  {x:-4.23,z:3.9,width:1.05,depth:.84},
  ...[-2.8,2.8].map(x=>({x,z:-3.55,width:.52,depth:.68})),
];
export function vehicleFootprint(index:number,x:number,z:number):Footprint{
  return {x,z,width:index===5?1.84:.64,depth:index===5?5.7:1.95,yaw:(index%2?-1:1)*Math.PI/2};
}
// Traffic yields before its swept body can reach a pedestrian. Wrap-around
// respawns also wait if the other road edge is occupied.
export function advanceTraffic(index:number,progress:number,dt:number,motion:boolean,player:{x:number;z:number}){
  const direction=index%2?-1:1,speed=index===5?2.8:3.5+index*.3;
  const next=(progress+(motion?Math.min(.05,Math.max(0,dt))*speed:0))%76;
  const p=vehicleFootprint(index,(next-38)*direction,index%2?-25.7:-22.5);
  const approach=(player.x-p.x)*direction;
  const safety= index===5?3.3:1.7;
  if(overlapsFootprint(player,p,PLAYER_RADIUS+.2)||Math.abs(player.z-p.z)<p.width/2+PLAYER_RADIUS+.28&&approach>0&&approach<safety)return progress;
  return next;
}
