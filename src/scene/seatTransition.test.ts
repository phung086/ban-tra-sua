import {describe,it,expect} from 'vitest';
import {advanceSeatBlend,seatedRootY,TABLE_SEAT_DROP} from './seatTransition';
describe('QC-05 seated actor height and knee blend',()=>{
  it('eases into the chair equivalently at 30 and 60fps',()=>{
    const run=(fps:number)=>{
      let blend=0;
      for(let i=0;i<fps;i++){
        const next=advanceSeatBlend(blend,true,true,1/fps);
        expect(next).toBeGreaterThanOrEqual(blend);
        if(i===0)expect(next).toBeLessThan(.5);
        blend=next;
      }
      return blend;
    };
    expect(run(30)).toBeCloseTo(run(60),10);
  });
  it('uses one blend for actor root and legs',()=>{
    expect(seatedRootY(true,0)).toBe(0);
    expect(seatedRootY(true,.5)).toBeCloseTo(TABLE_SEAT_DROP/2);
    expect(seatedRootY(true,1)).toBe(TABLE_SEAT_DROP);
    expect(seatedRootY(false,1)).toBe(0);
    expect(seatedRootY(true,Number.NaN)).toBe(0);
  });
  it('stands without overshoot and preserves reduced motion',()=>{
    let blend=1;
    for(let i=0;i<30;i++){
      const next=advanceSeatBlend(blend,false,true,1/30);
      expect(next).toBeLessThanOrEqual(blend);
      blend=next;
    }
    expect(blend).toBeLessThan(.01);
    expect(advanceSeatBlend(.2,true,false,1/60)).toBe(1);
    expect(advanceSeatBlend(.7,false,false,1/60)).toBe(0);
    expect(advanceSeatBlend(0,true,true,10)).toBeLessThan(.5);
  });
});
