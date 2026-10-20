import {describe,it,expect} from 'vitest';
import {createInitialState} from './engine';
import {hydrateCity,newCityDay} from './city';
import {streetPlan,streetInjury,recordStreetImpact,restStreetInjury,resolveStreetEvent,hydrateStreet} from './streetLife';

describe('saved street consequences',()=>{
  it('records injury, energy loss, slowdown and a reloaded save without resetting existing state',()=>{
    const state=createInitialState(),hit=recordStreetImpact(state,3.5);
    expect(hit.city.energy).toBe(state.city.energy-16);
    expect(streetInjury(hit).speedScale).toBe(.5);
    const loaded={...hit,city:hydrateCity(JSON.parse(JSON.stringify(hit.city)),hit.day)};
    expect(streetInjury(loaded)).toEqual(streetInjury(hit));
    expect(loaded.inventory).toEqual(state.inventory);expect(loaded.cash).toBe(state.cash);
    expect(recordStreetImpact(hit,3.5)).toBe(hit);
  });
  it('ignores invalid speed and harmless low speed contact',()=>{
    const state=createInitialState();
    for(const speed of [NaN,Infinity,-3,.5])expect(recordStreetImpact(state,speed)).toBe(state);
  });
  it('allows free recovery with no money or energy and never treats the road as a resting place',()=>{
    const state=recordStreetImpact({...createInitialState(),cash:0},4);
    const road=restStreetInjury(state,{x:0,z:-22.5});
    expect(streetInjury(road).remaining).toBe(streetInjury(state).remaining);
    let recovered={...state,city:{...state.city,energy:0}};
    for(let i=0;i<4;i++)recovered=restStreetInjury(recovered,{x:0,z:-19});
    expect(streetInjury(recovered).severity).toBe(0);expect(recovered.cash).toBe(0);
    expect(recovered.city.minutes).toBeGreaterThan(state.city.minutes);
  });
  it('has an end-of-day recovery path and resolves injuries after a full night',()=>{
    let state=createInitialState();state={...state,city:{...state.city,minutes:1260}};
    state=recordStreetImpact(state,5);
    for(let i=0;i<5;i++)state=restStreetInjury(state,{x:0,z:-19});
    expect(streetInjury(state).severity).toBe(0);
    const hit=recordStreetImpact(createInitialState(),4),tomorrow={...hit,day:hit.day+1,city:newCityDay(hit.city,hit.day+1)};
    expect(streetInjury(tomorrow).severity).toBe(0);
  });
  it('uses reproducible varied daily encounters without rerolling on reload',()=>{
    const state=createInitialState(),plans=new Set();
    for(let day=1;day<=20;day++){
      const current={...state,day},plan=streetPlan(current);plans.add(plan.kind);
      expect(streetPlan(JSON.parse(JSON.stringify(current)))).toEqual(plan);
    }
    expect(plans.size).toBe(3);
  });
  it('checks proximity, persists one choice per day and gives a free alternative',()=>{
    const state=createInitialState(),plan=streetPlan(state);
    expect(resolveStreetEvent(state,'help',{x:70,z:-90})).toBe(state);
    const helped=resolveStreetEvent(state,'help',plan.point);
    expect(helped.city.goodwill).toBe(state.city.goodwill+2);expect(helped.city.minutes).toBe(state.city.minutes+8);
    const loaded={...helped,city:hydrateCity(JSON.parse(JSON.stringify(helped.city)),state.day)};
    expect(resolveStreetEvent(loaded,'help',plan.point)).toBe(loaded);
    const poor={...state,cash:0,city:{...state.city,energy:0}};
    const passed=resolveStreetEvent(poor,'pass',plan.point);
    expect(passed.city.street?.choice).toBe('pass');expect(passed.cash).toBe(0);
  });
  it('normalizes absent/invalid old save fields',()=>{
    expect(hydrateStreet(undefined).severity).toBe(0);
    const result=hydrateStreet({severity:NaN,injuryUntil:Infinity,eventDay:-2});
    expect(result.injuryUntil).toBe(0);expect(result.severity).toBe(0);expect(result.eventDay).toBe(0);
  });
});
