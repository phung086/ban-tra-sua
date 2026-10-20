import {describe,it,expect} from 'vitest';
import {footprintsOverlap,sweepFootprints,vehicleFootprint} from './collision';
import {initialTraffic,stepStreetTraffic,TRAFFIC_OBSTACLES} from './streetTraffic';
import {CITY_PLACES} from './cityMap';
import {canWalk} from './service';

describe('continuous street bodies',()=>{
  it('finds thin walls along a sweep, including rotated obstacles',()=>{
    const a={x:0,z:0,width:1,depth:2},b={x:4,z:0,width:.02,depth:5,yaw:.3};
    const hit=sweepFootprints(a,b,{x:12,z:0});
    expect(hit).not.toBeNull();expect(hit!).toBeGreaterThan(0);expect(hit!).toBeLessThan(.4);
    expect(sweepFootprints(a,{...b,z:20},{x:12,z:0})).toBeNull();
    expect(sweepFootprints(a,b,{x:-12,z:0})).toBeNull();
  });
  it('is symmetric at rest and treats rotated vehicle length as solid',()=>{
    const bike=vehicleFootprint(0,0,-22.5);
    expect(footprintsOverlap(bike,{x:.9,z:-22.5,width:.1,depth:.1})).toBe(true);
    expect(footprintsOverlap({x:.9,z:-22.5,width:.1,depth:.1},bike)).toBe(true);
  });
  it('prevents a fast vehicle from tunnelling through a 2cm wall',()=>{
    const car={...initialTraffic()[0],x:0,speed:60,cruise:60};
    const wall={x:2,z:car.z,width:.02,depth:4};
    const {vehicles,impacts}=stepStreetTraffic([car],.05,[],false,[wall]);
    expect(vehicles[0].x).toBeLessThan(1.02);expect(vehicles[0].speed).toBe(0);
    expect(footprintsOverlap(vehicleFootprint(0,vehicles[0].x,car.z),wall)).toBe(false);
    expect(impacts).toHaveLength(0);
  });
  it('brakes for a visible pedestrian with no injury when there is stopping distance',()=>{
    let road=[{...initialTraffic()[0],x:-10,speed:3.5}];
    const person={id:'player',x:0,z:-22.5},hits=[];
    for(let i=0;i<240;i++){const next=stepStreetTraffic(road,1/30,[person],false,[]);road=next.vehicles;hits.push(...next.impacts);}
    expect(road[0].x).toBeLessThan(-1.35);expect(hits).toHaveLength(0);
  });
  it('reports a real sudden impact once and stops at the person',()=>{
    const car={...initialTraffic()[0],x:0,speed:4};
    const person={id:'walker-2',x:1.45,z:-22.5};
    const first=stepStreetTraffic([car],.05,[person],false,[]);
    expect(first.impacts).toEqual([{id:'walker-2',speed:4,vehicle:0}]);
    expect(first.vehicles[0].x).toBeLessThan(.10);
    const second=stepStreetTraffic(first.vehicles,.05,[person],false,[]);
    expect(second.impacts).toHaveLength(0);
  });
  it('waits at the exit if the opposite spawn is occupied; spawning never causes damage',()=>{
    const car={...initialTraffic()[0],x:36.81,speed:3};
    const result=stepStreetTraffic([car],.05,[{id:'player',x:-36.825,z:-22.5}],false,[]);
    expect(result.vehicles[0].x).toBeGreaterThan(36);expect(result.impacts).toHaveLength(0);
  });
  it('follows a stopped vehicle without overlap, and resumes after it leaves',()=>{
    let road=[{...initialTraffic()[0],x:-8,speed:3.5},{...initialTraffic()[2],x:0,held:true}];
    for(let i=0;i<300;i++)road=stepStreetTraffic(road,1/30,[],false,[]).vehicles;
    expect(road[0].x).toBeLessThan(-1.95);
    expect(footprintsOverlap(vehicleFootprint(0,road[0].x,road[0].z),vehicleFootprint(2,road[1].x,road[1].z))).toBe(false);
    const stopped=road[0].x;road[1].held=false;
    for(let i=0;i<120;i++)road=stepStreetTraffic(road,1/30,[],false,[]).vehicles;
    expect(road[0].x).toBeGreaterThan(stopped+1);
  });
  it('keeps every bus and scooter clear of real city walls across multiple wraps',()=>{
    let road=initialTraffic();let distance=0;
    for(let frame=0;frame<1800;frame++){
      road=stepStreetTraffic(road,1/30,[],frame%600>300).vehicles;
      if(frame%30===0)for(const v of road){
        const body=vehicleFootprint(v.index,v.x,v.z);
        expect(TRAFFIC_OBSTACLES.some(b=>footprintsOverlap(body,b))).toBe(false);
        for(const other of road.filter(o=>o.index!==v.index))expect(footprintsOverlap(body,vehicleFootprint(other.index,other.x,other.z))).toBe(false);
      }
    }
    for(const v of road)distance+=v.distance;
    expect(distance).toBeGreaterThan(150);
    expect(canWalk(CITY_PLACES.bus,true)).toBe(true);
    expect(CITY_PLACES.bus.z).toBeLessThan(-27.5);
  });
  it('freezes exactly on pause and tolerates invalid frame intervals',()=>{
    const road=initialTraffic();
    for(const dt of [0,-1,NaN])expect(stepStreetTraffic(road,dt,[],false).vehicles).toEqual(road);
  });
});
