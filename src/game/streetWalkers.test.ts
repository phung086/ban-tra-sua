import {describe,it,expect} from 'vitest';
import {createInitialState} from './engine';
import {canWalk} from './service';
import {initialStreetWalkers,advanceStreetWalker} from './streetWalkers';
import {initialTraffic,stepStreetTraffic} from './streetTraffic';
import {overlapsFootprint,vehicleFootprint} from './collision';

describe('physical residents',()=>{
  it('spawns on navigable ground, with distinct deterministic speeds and schedules',()=>{
    const state=createInitialState(),people=initialStreetWalkers(state);
    expect(people).toEqual(initialStreetWalkers(state));expect(new Set(people.map(p=>p.speed)).size).toBe(10);
    for(const p of people){expect(canWalk(p.position,true)).toBe(true);expect(canWalk(p.goal,true)).toBe(true);}
  });
  it('keeps a whole walking body outside a vehicle blocking its route',()=>{
    const base=initialStreetWalkers(createInitialState())[0],body=vehicleFootprint(0,0,-22.5);
    let walker={...base,position:{x:0,z:-19},goal:{x:0,z:-27},path:[{x:0,z:-27}],pause:0};
    for(let i=0;i<250;i++){
      walker=advanceStreetWalker(walker,1/30,[body]);
      expect(canWalk(walker.position,true)).toBe(true);expect(overlapsFootprint(walker.position,body)).toBe(false);
    }
  });
  it('keeps residents and vehicles on navigable ground through a busy crossing',()=>{
    let people=initialStreetWalkers(createInitialState()),road=initialTraffic();
    for(let frame=0;frame<400;frame++){
      road=stepStreetTraffic(road,1/30,people.map((p,i)=>({id:'walker-'+i,...p.position})),false).vehicles;
      const bodies=road.map(v=>vehicleFootprint(v.index,v.x,v.z));
      people=people.map(p=>advanceStreetWalker(p,1/30,bodies));
      for(const p of people){
        expect(canWalk(p.position,true)).toBe(true);
        expect(bodies.some(b=>overlapsFootprint(p.position,b))).toBe(false);
      }
    }
  },15000);
  it('stays down after impact, then can limp toward safety and recover',()=>{
    const base=initialStreetWalkers(createInitialState())[0],hurt={...base,down:2,injured:30,pause:0};
    const next=advanceStreetWalker(hurt,.05,[]);
    expect(next.position).toEqual(hurt.position);expect(next.down).toBeCloseTo(1.95);expect(next.injured).toBeCloseTo(29.95);
    expect(advanceStreetWalker(next,0,[])).toBe(next);
  });
});
