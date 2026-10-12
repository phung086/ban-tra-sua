/** Counter-rotate the cup socket against shoulder and elbow pitch. */
const MAX_WRIST_PITCH=1.4;
export function carryGripPitch(upperArmPitch:number,elbowPitch:number,holdingCup:boolean):number {
 if(!holdingCup||!Number.isFinite(upperArmPitch)||!Number.isFinite(elbowPitch))return 0;
 return Math.max(-MAX_WRIST_PITCH,Math.min(MAX_WRIST_PITCH,-(upperArmPitch+elbowPitch)));
}
