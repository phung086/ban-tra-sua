export type TravelSample={x:number;z:number;time:number};
export function travelPlayback(previous:TravelSample|undefined,current:TravelSample,walking:boolean,nominalSpeed=1.4){
  if(!walking||!previous||![current.x,current.z,current.time,previous.x,previous.z,previous.time,nominalSpeed].every(Number.isFinite)||nominalSpeed<=0)return 0;
  const dt=current.time-previous.time,distance=Math.hypot(current.x-previous.x,current.z-previous.z);
  // Do not stride across a teleport, background resume, or camera setup.
  if(dt<=0||dt>.12||distance>.4)return 0;
  return Math.max(0,Math.min(3,distance/dt/nominalSpeed));
}
