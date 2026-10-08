import {describe,it,expect} from 'vitest';
import {createInitialState,nextDay,startDay} from './engine';
import {CITY_PLACES,type CityPlace} from './cityMap';
import {DAILY_ACTIVITIES,FISH,hydrateLife,lifeAction} from './cityLife';
import {walkCity} from './city';

describe('neighborhood daily life',()=>{
  it('collects twelve physical stamps once and claims the completed album only once',()=>{
    let game=createInitialState();const cash=game.cash;
    expect(lifeAction(game,{type:'album'},CITY_PLACES.shop)).toBe(game);
    expect(lifeAction(game,{type:'stamp',place:'lake'},CITY_PLACES.shop).city.life.stamps).toEqual([]);
    for(const [id,p] of Object.entries(CITY_PLACES)){
      game=lifeAction(game,{type:'stamp',place:id as CityPlace},p);
      expect(lifeAction(game,{type:'stamp',place:id as CityPlace},p)).toBe(game);
    }
    expect(game.city.life.stamps).toHaveLength(12);expect(game.fans).toBe(12);
    game=lifeAction(game,{type:'album'},CITY_PLACES.shop);
    expect(game.cash).toBe(cash+25000);expect(game.fans).toBe(17);
    expect(lifeAction(game,{type:'album'},CITY_PLACES.shop)).toBe(game);
    expect(nextDay(game).city.life.stamps).toEqual(game.city.life.stamps);
  });
  it('requires a physical lake, consumes failed attempts, caps three turns and saves discoveries',()=>{
    let game=createInitialState();const action={type:'fish' as const,precision:100,outcome:'release' as const};
    expect(lifeAction(game,action,CITY_PLACES.market).city.life.attempts).toBe(0);
    expect(lifeAction(startDay(game),action,CITY_PLACES.lake).city.life.attempts).toBe(0);
    expect(lifeAction(game,{...action,precision:NaN},CITY_PLACES.lake)).toBe(game);
    game=lifeAction(game,{...action,precision:0},CITY_PLACES.lake);
    expect(game.city.life.attempts).toBe(1);expect(game.city.life.fish).toEqual({});
    expect(game.city.energy).toBe(95);
    game=lifeAction(game,action,CITY_PLACES.lake);
    expect(game.city.goodwill).toBe(2);expect(game.cash).toBe(220000);
    const fish=FISH[2];game=lifeAction(game,{...action,outcome:'keep'},CITY_PLACES.lake);
    expect(game.cash).toBe(220000+fish.value);
    expect(game.city.life.today.catches).toBe(2);
    expect(lifeAction(game,action,CITY_PLACES.lake).city.life.attempts).toBe(3);
    const next=nextDay(game);
    expect(next.city.life.attempts).toBe(0);expect(next.city.life.fish).toEqual(game.city.life.fish);
    expect(hydrateLife(JSON.parse(JSON.stringify(game.city.life)))).toEqual(game.city.life);
  });
  it('tracks daily actions separately from lifetime progress and grants rewards once',()=>{
    let game=createInitialState();
    for(const p of [CITY_PLACES.market,CITY_PLACES.lake,CITY_PLACES.library])game=walkCity(game,1,p);
    const before=game.cash;
    game=lifeAction(game,{type:'daily',id:'explore'},CITY_PLACES.shop);
    expect(game.cash).toBe(before+8000);
    expect(lifeAction(game,{type:'daily',id:'explore'},CITY_PLACES.shop)).toBe(game);
    for(const d of DAILY_ACTIVITIES.filter(d=>d.id!=='explore'))expect(lifeAction(game,{type:'daily',id:d.id},CITY_PLACES.shop)).toBe(game);
    expect(nextDay(game).city.life.today.places).toEqual([]);
    expect(nextDay(game).city.life.today.claimed).toEqual([]);
    expect(hydrateLife({attempts:Infinity,stamps:['invalid' as CityPlace],fish:{ro:NaN}})).toEqual(createInitialState().city.life);
  });
});
