/** QC-05: frame-rate-independent seated leg/root blending, without new meshes. */
const SEAT_RATE = 12; // ~95% of the way to the target in 250 ms.
export function advanceSeatBlend(current:number,sitting:boolean,motion:boolean,elapsedSeconds:number):number {
  const target=sitting?1:0;
  if(!motion||!Number.isFinite(current))return target;
  const dt=Number.isFinite(elapsedSeconds)?Math.max(0,Math.min(.05,elapsedSeconds)):0;
  const bounded=Math.max(0,Math.min(1,current));
  return bounded+(target-bounded)*(1-Math.exp(-SEAT_RATE*dt));
}
export const TABLE_SEAT_DROP=-.27;
export function seatedRootY(dineIn:boolean,seatWeight:number):number {
  if(!dineIn||!Number.isFinite(seatWeight))return 0;
  return TABLE_SEAT_DROP*Math.max(0,Math.min(1,seatWeight));
}
