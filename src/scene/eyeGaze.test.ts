import {describe,expect,it} from 'vitest';
import {idleEyeGaze} from './eyeGaze';

describe('QC-05 idle paired eye glances',()=>{
  it('keeps reduced-motion and non-idle pupils centered',()=>{
    expect(idleEyeGaze(1.5,.4,false)).toEqual({x:0,y:0});
    expect(idleEyeGaze(Number.NaN,.4,true)).toEqual({x:0,y:0});
  });
  it('enters a glance, holds it, and returns to center',()=>{
    expect(idleEyeGaze(.5,0,true)).toEqual({x:0,y:0});
    expect(Math.abs(idleEyeGaze(1.5,0,true).x)).toBeGreaterThan(.002);
    expect(idleEyeGaze(2.5,0,true)).toEqual({x:0,y:0});
  });
  it('keeps pupils within the original eye whites at 60 FPS',()=>{
    for(const seed of [0,.15,.49,.81,1])for(let frame=0;frame<=1500;frame++){
      const gaze=idleEyeGaze(frame/60,seed,true);
      expect(Math.abs(gaze.x)+.014).toBeLessThan(.025);
      expect(Math.abs(gaze.y)+.014).toBeLessThan(.016);
    }
  });
  it('never jumps at the glance boundaries',()=>{
    for(const seed of [0,.15,.49,.81,1]){
      let previous=idleEyeGaze(0,seed,true);
      for(let frame=1;frame<=1500;frame++){
        const next=idleEyeGaze(frame/60,seed,true);
        expect(Math.abs(next.x-previous.x)).toBeLessThan(.001);
        expect(Math.abs(next.y-previous.y)).toBeLessThan(.001);
        previous=next;
      }
    }
  });
  it('uses distinct repeatable gaze patterns per NPC',()=>{
    const first=idleEyeGaze(1.5,.12,true),second=idleEyeGaze(1.5,.72,true);
    expect(first).not.toEqual(second);
    expect(idleEyeGaze(1.5,.12,true)).toEqual(first);
  });
});
