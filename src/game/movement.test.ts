import {describe,it,expect} from 'vitest';
import {normalizeStick,movementVector,slideMove} from './movement';
import {canWalk} from './service';

describe('mobile analog movement',()=>{
  it('ignores thumb jitter, keeps proportional speed and clamps beyond the circle',()=>{
    expect(normalizeStick(4,3)).toEqual({x:0,y:0});
    const half=normalizeStick(21,0),edge=normalizeStick(420,420);
    expect(half.x).toBeGreaterThan(0);expect(half.x).toBeLessThan(0.5);
    expect(Math.hypot(edge.x,edge.y)).toBeCloseTo(1);expect(edge.x).toBeCloseTo(edge.y);
    expect(normalizeStick(NaN,1)).toEqual({x:0,y:0});
    expect(normalizeStick(1,1,Infinity)).toEqual({x:0,y:0});
  });
  it('moves relative to the camera without diagonal acceleration or delayed-frame jumps',()=>{
    expect(movementVector({x:0,y:-1},0,5,0.04)).toEqual({x:0,z:-0.2});
    const turned=movementVector({x:0,y:-1},Math.PI/2,5,0.04);
    expect(turned.x).toBeCloseTo(-0.2);expect(turned.z).toBeCloseTo(0);
    const diagonal=movementVector({x:1,y:1},0,5,0.04);
    expect(Math.hypot(diagonal.x,diagonal.z)).toBeCloseTo(0.2);
    expect(movementVector({x:0,y:1},0,5,20).z).toBe(0.25);
    expect(movementVector({x:0,y:1},0,5,-1)).toEqual({x:0,z:0});
    expect(movementVector({x:NaN,y:1},0,5,1)).toEqual({x:0,z:0});
  });
  it('sweeps through collisions, slides beside walls, and leaves only through the doorway',()=>{
    const counter=slideMove({x:0,z:2.15},{x:0,z:-4},false);
    expect(counter.z).toBeGreaterThanOrEqual(1.65);
    const slide=slideMove({x:4.2,z:-1},{x:1,z:-1},false);
    expect(slide.x).toBeLessThanOrEqual(4.3);expect(slide.z).toBeCloseTo(-2);
    expect(slideMove({x:0,z:-4},{x:0,z:-3},true).z).toBeCloseTo(-7);
    expect(slideMove({x:3,z:-4},{x:0,z:-3},true).z).toBeGreaterThanOrEqual(-4.3);
    expect(slideMove({x:0,z:-4},{x:0,z:-3},false).z).toBeGreaterThanOrEqual(-4.3);
    expect(canWalk(slide,true)).toBe(true);
  });
});
