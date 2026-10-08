import {describe,it,expect} from 'vitest';
import {overlapsFootprint,PARKED_SCOOTER,vehicleFootprint,advanceTraffic,SHOP_FURNITURE} from './collision';
import {slideMove} from './movement';
import {canWalk,routeAcross} from './service';
import {CITY_PLACES,CITY_BLOCKS} from './cityMap';

describe('physical city collision regressions',()=>{
  it('keeps the whole player outside a diagonal parked scooter, stools and indoor furniture',()=>{
    expect(canWalk(PARKED_SCOOTER,true)).toBe(false);
    const bike=slideMove({x:-3.4,z:-8.7},{x:0,z:4},true);
    expect(bike.z).toBeLessThan(-7.3);expect(overlapsFootprint(bike,PARKED_SCOOTER)).toBe(false);
    for(const x of [2.8,3.6,4.4])expect(canWalk({x,z:-6.1},true)).toBe(false);
    for(const b of SHOP_FURNITURE)expect(canWalk(b)).toBe(false);
    expect(canWalk({x:66,z:-45},true)).toBe(false);
  });
  it('does not tunnel through any approachable building face even with a large movement delta',()=>{
    let checked=0;
    for(const b of CITY_BLOCKS)for(const side of [-1,1]){
      const start={x:b.x+side*(b.width/2+.7),z:b.z};
      if(!canWalk(start,true))continue;
      const end=slideMove(start,{x:-side*2,z:0},true);
      expect(canWalk(end,true)).toBe(true);expect(overlapsFootprint(end,b)).toBe(false);
      expect(Math.sign(end.x-b.x)).toBe(side);checked++;
    }
    expect(checked).toBeGreaterThan(35);
  });
  it('blocks bus and motorbike bodies and finds a physical detour rather than snapping through',()=>{
    for(const index of [0,5]){
      const body=vehicleFootprint(index,0,-22.5),start={x:0,z:-19},goal={x:0,z:-27};
      const stopped=slideMove(start,{x:0,z:-8},true,[body]);
      expect(stopped.z).toBeGreaterThan(-22.5);expect(overlapsFootprint(stopped,body)).toBe(false);
      const route=routeAcross(start,goal,true,[body]);expect(route.length).toBeGreaterThan(1);
      let p=start;
      for(const next of route){const swept=slideMove(p,{x:next.x-p.x,z:next.z-p.z},true,[body]);expect(swept.x).toBeCloseTo(next.x,3);expect(swept.z).toBeCloseTo(next.z,3);p=next;}
      expect(routeAcross(start,goal,true)).toHaveLength(1);
      expect(routeAcross(start,goal,true,[{...body,x:12}])).toHaveLength(1);
    }
  });
  it('makes traffic yield with its full length, including bus front and road-edge respawn',()=>{
    expect(advanceTraffic(5,38,.05,true,{x:-3,z:-25.7})).toBe(38);
    expect(advanceTraffic(0,38,.05,true,{x:1.1,z:-22.5})).toBe(38);
    expect(advanceTraffic(0,75.99,.05,true,{x:-38,z:-22.5})).toBe(75.99);
    expect(advanceTraffic(0,38,.05,true,{x:0,z:-19})).toBeGreaterThan(38);
    expect(advanceTraffic(0,38,1,false,CITY_PLACES.shop)).toBe(38);
  });
});
