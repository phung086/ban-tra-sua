import {describe,it,expect} from 'vitest';
import {travelPlayback} from './travelAnimation';
describe('distance driven skeleton cadence',()=>{
  it('scales cadence with actual ground speed at both 30 and 60 FPS',()=>{
    for(const fps of [30,60])for(const speed of [.35,1.4,2.8]){
      expect(travelPlayback({x:0,z:0,time:1},{x:speed/fps,z:0,time:1+1/fps},true)).toBeCloseTo(speed/1.4,5);
    }
  });
  it('does not skate while blocked or advance across a teleport or pause',()=>{
    const previous={x:0,z:0,time:1};
    for(const current of [{x:0,z:0,time:1.03},{x:10,z:0,time:1.03},{x:.1,z:0,time:3},{x:.1,z:0,time:1}])expect(travelPlayback(previous,current,true)).toBe(0);
    expect(travelPlayback(previous,{x:.1,z:0,time:1.03},false)).toBe(0);
  });
});
