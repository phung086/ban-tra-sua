import { canWalk, type Position } from './service';
import {overlapsFootprint,type Footprint} from './collision';

export type Stick = {x:number;y:number};
export const STICK_DEADZONE=0.14;
export function normalizeStick(x:number,y:number,radius=42):Stick {
  if(!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius<=0) return {x:0,y:0};
  const distance=Math.hypot(x,y)/radius;
  if(distance<=STICK_DEADZONE) return {x:0,y:0};
  const strength=(Math.min(1,distance)-STICK_DEADZONE)/(1-STICK_DEADZONE);
  return {x:x/Math.hypot(x,y)*strength,y:y/Math.hypot(x,y)*strength};
}
export function movementVector(stick:Stick,yaw:number,speed:number,dt:number) {
  if(![stick.x,stick.y,yaw,speed,dt].every(Number.isFinite))return {x:0,z:0};
  const length=Math.max(1,Math.hypot(stick.x,stick.y)),factor=speed*Math.min(0.05,Math.max(0,dt))/length;
  return {x:(stick.x*Math.cos(yaw)+stick.y*Math.sin(yaw))*factor,z:(stick.y*Math.cos(yaw)-stick.x*Math.sin(yaw))*factor};
}
export function slideMove(position:Position,delta:Position,city:boolean,dynamic:readonly Footprint[]=[]):Position {
  if(![position.x,position.z,delta.x,delta.z].every(Number.isFinite))return {...position};
  const next={...position};
  const allowed=(p:Position)=>canWalk(p,city)&&!dynamic.some(b=>overlapsFootprint(p,b));
  // Sample the player's swept path, preventing wall tunnelling on delayed frames.
  const steps=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.z)/0.06));
  for(let i=0;i<steps;i++) {
    const x=next.x+delta.x/steps,z=next.z+delta.z/steps;
    if(allowed({x,z})) {next.x=x;next.z=z;}
    else {
      if(allowed({x,z:next.z})) next.x=x;
      if(allowed({x:next.x,z})) next.z=z;
    }
  }
  return next;
}
