// Deterministic world events; NEVER use for security or real-money decisions.
// Version is part of the hash to allow intentional future migrations.
export const LIFE_RNG_VERSION = 1;

export type RandomStream = () => number;
export interface DayRandomKey {
  worldSeed: string;
  day: number;
  channel: string;
  slot?: number;
}

/** Hashes one logical stream key in UTF-16 code units: stable in JS engines. */
export function seedFor({worldSeed,day,channel,slot=0}:DayRandomKey):number {
  if(!Number.isSafeInteger(day)||day<1)throw new RangeError('day must be a positive safe integer');
  if(!Number.isSafeInteger(slot)||slot<0)throw new RangeError('slot must be a non-negative safe integer');
  if(!worldSeed||!channel)throw new Error('worldSeed and channel are required');
  const source=JSON.stringify([LIFE_RNG_VERSION,worldSeed,day,channel,slot]);
  let hash=0x811c9dc5;
  for(let i=0;i<source.length;i++){
    hash=Math.imul(hash^source.charCodeAt(i),0x01000193);
  }
  return hash>>>0;
}

/** Mulberry32: seeded sequence of finite floats in [0, 1). */
export function createDayRandom(key:DayRandomKey):RandomStream {
  let state=seedFor(key);
  return ()=>{
    state=(state+0x6d2b79f5)>>>0;
    let x=Math.imul(state^(state>>>15),state|1);
    x^=x+Math.imul(x^(x>>>7),x|61);
    return ((x^(x>>>14))>>>0)/4294967296;
  };
}

export interface WeightedOption<T>{value:T;weight:number;}
/** One deterministic weighted selection; zero-weight entries can never win. */
export function weightedChoice<T>(random:RandomStream,options:readonly WeightedOption<T>[]):T{
  if(!options.length)throw new Error('weightedChoice requires options');
  let total=0;
  for(const option of options){
    if(!Number.isFinite(option.weight)||option.weight<0)throw new RangeError('invalid event weight');
    total+=option.weight;
  }
  if(!Number.isFinite(total)||total<=0)throw new RangeError('sum of weights must be positive');
  const drawn=random();
  if(!Number.isFinite(drawn)||drawn<0||drawn>=1)throw new RangeError('RNG value outside [0,1)');
  const selected=drawn*total;
  let cumulative=0;
  for(const option of options){
    cumulative+=option.weight;
    if(selected<cumulative)return option.value;
  }
  // Floating-point rounding at the far boundary should not choose a zero-weight item.
  for(let i=options.length-1;i>=0;i--)if(options[i].weight>0)return options[i].value;
  throw new Error('unreachable');
}
