export type RenderEngine = 'three' | 'babylon';
export type QualityChoice = 'auto' | 'light' | 'balanced' | 'high';
export interface QualityProfile { id: Exclude<QualityChoice,'auto'>; pixelRatio: number; shadowSize: number; distance: number; }
export const QUALITY: QualityProfile[] = [
  {id:'light',pixelRatio:1,shadowSize:256,distance:42},
  {id:'balanced',pixelRatio:1.25,shadowSize:512,distance:64},
  {id:'high',pixelRatio:1.75,shadowSize:1024,distance:100},
];
// Overview can omit the expensive city shadow map only on the optimized light path.
// Contact shadows/scene shading remain; follow camera and other qualities are untouched.
export const castCityShadow = (quality:QualityProfile['id'],exploring:boolean,overview:boolean,sector:number) =>
  !(quality==='light'&&exploring&&overview&&sector>=32);
// Hysteresis keeps quality changes rare. Background-tab gaps are not samples.
export class AdaptiveQuality {
  index:number;
  slow=0; fast=0;severe=0;
  constructor(public choice:QualityChoice, public mobile:boolean) {this.index=choice==='auto'?(mobile?1:2):QUALITY.findIndex(q=>q.id===choice);}
  get profile(){return QUALITY[Math.max(0,this.index)];}
  sample(frameMs:number,cpuMs:number) {
    if(this.choice!=='auto'||!Number.isFinite(frameMs)||!Number.isFinite(cpuMs)||frameMs<20||(frameMs>250&&cpuMs<24))return false;
    this.severe=cpuMs>80?this.severe+1:0;
    if(this.severe>=12&&this.index>0){this.index--;this.slow=this.fast=this.severe=0;return true;}
    if(frameMs>58||cpuMs>24){this.slow++;this.fast=0;}else if(frameMs<45&&cpuMs<11){this.fast++;this.slow=Math.max(0,this.slow-1);}else{this.fast=0;this.slow=Math.max(0,this.slow-1);}
    const ceiling=this.mobile?1:2;
    if(this.slow>=90&&this.index>0){this.index--;this.slow=this.fast=0;return true;}
    if(this.fast>=450&&this.index<ceiling){this.index++;this.slow=this.fast=0;return true;}
    return false;
  }
}
