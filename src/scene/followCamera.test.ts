import {describe,it,expect} from 'vitest';
import {clearCameraFraction} from './followCamera';
describe('follow camera sightline',()=>{
  const wall={x:0,z:3,width:4,depth:1};
  it('stops before a wall even when the endpoint is beyond it',()=>{
    const t=clearCameraFraction({x:0,z:0},{x:0,z:8},[wall]);
    expect(t*8).toBeLessThan(2.32);expect(t*8).toBeGreaterThan(2);
  });
  it('keeps unobstructed routes and parallel edges stable',()=>{
    expect(clearCameraFraction({x:3,z:0},{x:3,z:8},[wall])).toBe(1);
    expect(clearCameraFraction({x:0,z:0},{x:8,z:0},[wall])).toBe(1);
    expect(clearCameraFraction({x:0,z:0},{x:0,z:0},[wall])).toBe(1);
  });
  it('selects the closest obstruction independently of block order',()=>{
    const far={...wall,z:6};
    expect(clearCameraFraction({x:0,z:0},{x:0,z:8},[far,wall])).toBe(clearCameraFraction({x:0,z:0},{x:0,z:8},[wall,far]));
  });
});
