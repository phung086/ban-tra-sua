export type RenderEngine = 'three' | 'babylon';
export type QualityChoice = 'auto' | 'light' | 'balanced' | 'high';
export interface QualityProfile { id: Exclude<QualityChoice,'auto'>; pixelRatio: number; shadowSize: number; distance: number; }
export const QUALITY: QualityProfile[] = [
  {id:'light',pixelRatio:1,shadowSize:256,distance:42},
  {id:'balanced',pixelRatio:1.25,shadowSize:512,distance:64},
  {id:'high',pixelRatio:1.75,shadowSize:1024,distance:100},
];
// CSS width alone misclassifies phones rotated to landscape as desktop.
// Pointer type is a hint, not a guaranteed device model.
export function mobileViewport(width:number,height:number,coarsePointer:boolean) {
  return width<=700 || (coarsePointer && Math.min(width,height)<=900);
}

// These hints can be missing or privacy-rounded. Unknown hardware remains
// balanced and relies on measured frame intervals to reduce quality.
export function constrainedHardware(memoryGB?:number,cpuCores?:number) {
  return (typeof memoryGB==='number' && Number.isFinite(memoryGB) && memoryGB>0 && memoryGB<=4)
    || (typeof cpuCores==='number' && Number.isFinite(cpuCores) && cpuCores>0 && cpuCores<=4);
}

// Hysteresis keeps quality changes rare. Background-tab gaps are not samples.
export class AdaptiveQuality {
  index:number;
  slow=0; fast=0;severe=0;
  constructor(public choice:QualityChoice, public mobile:boolean, public constrained=false) {
    this.index=choice==='auto'?(constrained?0:mobile?1:2):QUALITY.findIndex(q=>q.id===choice);
  }
  get profile(){return QUALITY[Math.max(0,this.index)];}
  sample(frameMs:number,cpuMs:number) {
    if(this.choice!=='auto'||!Number.isFinite(frameMs)||!Number.isFinite(cpuMs)||frameMs<20||(frameMs>250&&cpuMs<24))return false;
    this.severe=cpuMs>80?this.severe+1:0;
    if(this.severe>=12&&this.index>0){this.index--;this.slow=this.fast=this.severe=0;return true;}
    if(frameMs>58||cpuMs>24){this.slow++;this.fast=0;}else if(frameMs<45&&cpuMs<11){this.fast++;this.slow=Math.max(0,this.slow-1);}else{this.fast=0;this.slow=Math.max(0,this.slow-1);}
    const ceiling=this.constrained?0:this.mobile?1:2;
    if(this.slow>=90&&this.index>0){this.index--;this.slow=this.fast=0;return true;}
    if(this.fast>=450&&this.index<ceiling){this.index++;this.slow=this.fast=0;return true;}
    return false;
  }
}
