import {canWalk,routeAcross,type Position} from './service';
import {slideMove} from './movement';
import {type Footprint} from './collision';
import {createDayRandom} from './lifeSim/rng';
import {streetPlan} from './streetLife';
import type {GameState} from './types';

export type StreetWalker={position:Position;path:Position[];goal:Position;heading:number;speed:number;
  pause:number;blocked:number;cycle:number;injured:number;down:number;seed:number};
const ANCHORS:Position[]=[{x:-30,z:-18.6},{x:30,z:-18.6},{x:-30,z:-28.2},{x:30,z:-27.3},
  {x:15,z:-19.4},{x:15,z:-28.2},{x:-57,z:-46},{x:56,z:-43},{x:0,z:-65},{x:0,z:-35}];
export function safeStreetPoint(point:Position,others:readonly Position[]=[]):Position {
  for(let ring=0;ring<15;ring++)for(let angle=0;angle<(ring?16:1);angle++){
    const p={x:point.x+Math.sin(angle*Math.PI/8)*ring*.35,z:point.z+Math.cos(angle*Math.PI/8)*ring*.35};
    if(canWalk(p,true)&&others.every(o=>Math.hypot(o.x-p.x,o.z-p.z)>.85))return p;
  }
  throw new Error('No walkable street spawn');
}
export function initialStreetWalkers(state:Pick<GameState,'day'|'morning'>,count=10):StreetWalker[]{
  const people:StreetWalker[]=[],plan=streetPlan(state);
  for(let i=0;i<count;i++){
    const random=createDayRandom({worldSeed:state.morning.worldSeed,day:state.day,channel:'street-walker-v1',slot:i});
    const position=safeStreetPoint(ANCHORS[i%ANCHORS.length],people.map(p=>p.position));
    const goal=plan.kind==='delivery'&&i<2?{x:-26,z:-9}:ANCHORS[(i%2?i-1:i+1)%ANCHORS.length];
    people.push({position,path:[],goal:safeStreetPoint(goal),heading:random()*Math.PI*2,speed:.85+random()*.55,
      pause:i*.28,blocked:0,cycle:0,injured:0,down:0,seed:random()});
  }
  return people;
}
export function advanceStreetWalker(previous:StreetWalker,dt:number,dynamic:readonly Footprint[]):StreetWalker{
  const frame=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  if(!frame)return previous;
  const p={...previous,path:[...previous.path],injured:Math.max(0,previous.injured-frame),down:Math.max(0,previous.down-frame)};
  if(p.down>0)return p;
  if(p.pause>0){p.pause=Math.max(0,p.pause-frame);return p;}
  if(!p.path.length)p.path=routeAcross(p.position,p.goal,true);
  const target=p.path[0];
  if(!target){p.pause=2;return p;}
  const distance=Math.hypot(target.x-p.position.x,target.z-p.position.z);
  if(distance<.055){
    p.path.shift();
    if(!p.path.length){
      const start={...p.position};p.goal={...previous.goal};
      const opposite=ANCHORS.reduce((best,candidate)=>Math.hypot(candidate.x-start.x,candidate.z-start.z)>Math.hypot(best.x-start.x,best.z-start.z)?candidate:best,ANCHORS[0]);
      // Short local trips alternate with a longer errand; schedules differ per actor.
      const candidate=p.cycle%3===2?opposite:ANCHORS[(Math.floor(p.seed*10)+p.cycle+1)%ANCHORS.length];
      p.goal=safeStreetPoint(candidate);p.cycle++;p.pause=1.2+p.seed*4;
    }
    return p;
  }
  const step=Math.min(distance,frame*p.speed*(p.injured>0?.45:1));
  const dx=(target.x-p.position.x)/distance*step,dz=(target.z-p.position.z)/distance*step;
  const next=slideMove(p.position,{x:dx,z:dz},true,dynamic);
  const moved=Math.hypot(next.x-p.position.x,next.z-p.position.z);
  p.blocked=moved<step*.2?p.blocked+frame:0;
  if(p.blocked>1.5){
    const detour=routeAcross(p.position,p.goal,true,dynamic);
    if(detour.length)p.path=detour;p.blocked=0;p.pause=.3+p.seed*.4;
  }
  if(moved>.0001)p.heading=Math.atan2(next.x-p.position.x,next.z-p.position.z);
  p.position=next;return p;
}
