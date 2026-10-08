import {describe,it,expect} from 'vitest';
import {createDayRandom,seedFor,weightedChoice} from './rng';

const key={worldSeed:'an-hoa-player-001',day:8,channel:'social-invitation'};

describe('deterministic life simulation RNG',()=>{
  it('recreates exactly the same series for seed, day and channel',()=>{
    const a=createDayRandom(key),b=createDayRandom({...key});
    expect(Array.from({length:32},()=>a())).toEqual(Array.from({length:32},()=>b()));
    expect(seedFor(key)).toBe(seedFor({...key}));
  });
  it('isolates story outcomes from traffic/visual random consumption',()=>{
    const dinner=createDayRandom({...key,channel:'dinner-payer'});
    const again=createDayRandom({...key,channel:'dinner-payer'});
    const traffic=createDayRandom({...key,channel:'traffic'});
    const first=dinner();
    for(let i=0;i<1000;i++)traffic();
    expect(again()).toBe(first);
    expect(dinner()).toBe(again());
  });
  it('separates days and slots without using device clock',()=>{
    expect(seedFor(key)).not.toBe(seedFor({...key,day:9}));
    expect(seedFor(key)).not.toBe(seedFor({...key,slot:1}));
    const series=Array.from({length:100},(_,i)=>createDayRandom({...key,day:i+1})());
    expect(new Set(series).size).toBeGreaterThan(90);
    expect(series.every(value=>value>=0&&value<1&&Number.isFinite(value))).toBe(true);
  });
  it('rejects malformed keys and invalid weights rather than silently rerolling',()=>{
    expect(()=>seedFor({...key,day:0})).toThrow();
    expect(()=>seedFor({...key,day:Infinity})).toThrow();
    expect(()=>seedFor({...key,slot:-1})).toThrow();
    expect(()=>seedFor({...key,channel:''})).toThrow();
    expect(()=>weightedChoice(()=>0,[])).toThrow();
    expect(()=>weightedChoice(()=>0,[{value:'x',weight:0}])).toThrow();
    expect(()=>weightedChoice(()=>0,[{value:'x',weight:NaN}])).toThrow();
    expect(()=>weightedChoice(()=>1,[{value:'x',weight:1}])).toThrow();
  });
  it('supports weighted options with guaranteed zero-weight exclusion',()=>{
    const items=[{value:'impossible',weight:0},{value:'rare',weight:1},{value:'common',weight:9}] as const;
    expect(weightedChoice(()=>0,items)).toBe('rare');
    expect(weightedChoice(()=>0.5,items)).toBe('common');
    expect(weightedChoice(()=>0.999999,items)).toBe('common');
    const sample=createDayRandom({...key,channel:'visitor'});
    const customers=Array.from({length:40},()=>weightedChoice(sample,items));
    expect(customers).not.toContain('impossible');
  });
});
