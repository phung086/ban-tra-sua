import type { Block } from '../game/cityMap';

/** Keep the whole sightline clear, not only the camera's endpoint. */
export function clearCameraFraction(focus:{x:number;z:number},desired:{x:number;z:number},blocks:readonly Block[]) {
  const dx=desired.x-focus.x,dz=desired.z-focus.z;
  const length=Math.hypot(dx,dz);
  if(length<1e-6)return 1;
  let fraction=1;
  for(const b of blocks){
    let near=0,far=1;
    for(const [start,delta,min,max] of [
      [focus.x,dx,b.x-b.width/2-.18,b.x+b.width/2+.18],
      [focus.z,dz,b.z-b.depth/2-.18,b.z+b.depth/2+.18],
    ]){
      if(Math.abs(delta)<1e-8){if(start<min||start>max){far=-1;break;}}
      else {const a=(min-start)/delta,c=(max-start)/delta;near=Math.max(near,Math.min(a,c));far=Math.min(far,Math.max(a,c));}
    }
    // Invalid/legacy spawn positions must not collapse the camera onto its eye.
    if(far>=near&&near>0)fraction=Math.min(fraction,Math.max(near*.5,near-.12/length));
  }
  return fraction;
}

/** Obstruction response is immediate; distance recovery is gradual and frame-rate independent. */
export function easeCameraClearance(previous:number,clear:number,dt:number,motion:boolean){
  if(!motion||clear<=previous)return clear;
  return previous+(clear-previous)*(1-Math.exp(-4*Math.max(0,Math.min(.05,dt))));
}
