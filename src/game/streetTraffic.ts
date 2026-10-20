import {PLAYER_RADIUS,sweepFootprints,vehicleFootprint,type Footprint} from './collision';
import {CITY_BLOCKS,CITY_SOLID_PROPS,STREET_OBSTACLES} from './cityMap';

export const TRAFFIC_OBSTACLES:readonly Footprint[]=[...CITY_BLOCKS,...CITY_SOLID_PROPS,
  ...STREET_OBSTACLES.map(o=>({x:o.x,z:o.z,width:o.radius*2,depth:o.radius*2}))];
export type TrafficVehicle={index:number;x:number;z:number;speed:number;distance:number;cruise:number;held:boolean};
export type RoadPerson={id:string;x:number;z:number};
export type TrafficImpact={id:string;speed:number;vehicle:number};
const direction=(i:number)=>i%2?-1:1;
const lane=(i:number)=>i%2?-25.7:-22.5;
const limit=(i:number)=>37.8-(i===5?2.85:.975);
export function initialTraffic(cruise=3.4):TrafficVehicle[]{
  return Array.from({length:6},(_,index)=>({index,x:(-29+Math.floor(index/2)*22)*direction(index),z:lane(index),
    speed:0,distance:0,cruise:index===5?2.8:cruise+index*.12,held:false}));
}
const personBody=(p:RoadPerson):Footprint=>({x:p.x,z:p.z,width:PLAYER_RADIUS*2,depth:PLAYER_RADIUS*2});
/** Inertial braking then continuous body sweep. A late crossing can cause
 * impact, but the vehicle stops at contact. Wrapping checks a clear spawn.
 */
export function stepStreetTraffic(previous:readonly TrafficVehicle[],dt:number,people:readonly RoadPerson[],rain:boolean,
  obstacles:readonly Footprint[]=TRAFFIC_OBSTACLES):{vehicles:TrafficVehicle[];impacts:TrafficImpact[]} {
  const frame=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  if(!frame)return {vehicles:previous.map(v=>({...v})),impacts:[]};
  const vehicles=previous.map(v=>({...v})),impacts:TrafficImpact[]=[];
  for(let i=0;i<vehicles.length;i++){
    const v=vehicles[i],sign=direction(v.index),body=vehicleFootprint(v.index,v.x,v.z);
    const others=vehicles.filter((_,j)=>j!==i).map(o=>vehicleFootprint(o.index,o.x,o.z));
    const targets=[...obstacles,...others,...people.map(personBody)];
    const braking=rain?2.1:4.2,cruise=v.held?0:v.cruise*(rain?.68:1);
    const lookAhead=.7+v.speed*.3+v.speed*v.speed/(2*braking);
    const approaching=targets.some(target=>sweepFootprints(body,target,{x:sign*lookAhead,z:0})!==null);
    const desired=approaching?0:cruise,oldSpeed=v.speed;
    v.speed=desired<v.speed?Math.max(desired,v.speed-braking*frame):Math.min(desired,v.speed+1.4*frame);
    const travel=(oldSpeed+v.speed)*.5*frame;
    let fraction=1;
    for(const target of [...obstacles,...others]){
      const hit=sweepFootprints(body,target,{x:sign*travel,z:0});
      if(hit!==null)fraction=Math.min(fraction,Math.max(0,hit-.015/Math.max(travel,.015)));
    }
    for(const person of people){
      const hit=sweepFootprints(body,personBody(person),{x:sign*travel,z:0});
      if(hit!==null&&hit<=fraction){
        if(oldSpeed>=1.1)impacts.push({id:person.id,speed:oldSpeed,vehicle:v.index});
        fraction=Math.min(fraction,Math.max(0,hit-.015/Math.max(travel,.015)));
      }
    }
    const edge=limit(v.index),remaining=edge-v.x*sign;
    const moved=Math.max(0,Math.min(travel*fraction,remaining));
    v.x+=sign*moved;v.distance+=moved;
    if(fraction<1)v.speed=0;
    if(remaining<=travel*fraction+.001){
      const spawn=vehicleFootprint(v.index,-sign*edge,v.z);
      if(!targets.some(t=>sweepFootprints(spawn,t,{x:0,z:0})!==null)){v.x=-sign*edge;v.speed=0;}
      else v.speed=0;
    }
  }
  return {vehicles,impacts};
}
