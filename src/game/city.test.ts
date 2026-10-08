import { describe, expect, it, vi, afterEach } from 'vitest';
import { createInitialState, nextDay, startDay } from './engine';
import { cityAction, cityContracts, hydrateCity, walkCity } from './city';
import { CITY_PLACES, nearCityPlace, type CityPlace } from './cityMap';
import { canWalk, routeAcross } from './service';
import { loadGame, saveGame } from './storage';

afterEach(() => vi.unstubAllGlobals());
describe('Hanoi neighborhood and tea-shop ecosystem', () => {
  it('connects every neighborhood location to the counter around solid buildings', () => {
    for (const destination of Object.values(CITY_PLACES)) {
      const path = routeAcross(CITY_PLACES.shop, destination, true);
      expect(path.length).toBeGreaterThan(0);
      let previous = CITY_PLACES.shop as {x:number;z:number};
      for (const point of path) {
        const samples = Math.ceil(Math.hypot(point.x-previous.x,point.z-previous.z)*20);
        for (let i=0;i<=samples;i++) expect(canWalk({x:previous.x+(point.x-previous.x)*i/Math.max(1,samples),z:previous.z+(point.z-previous.z)*i/Math.max(1,samples)},true)).toBe(true);
        previous=point;
      }
      expect(nearCityPlace(path.at(-1)!, Object.keys(CITY_PLACES).find(p=>CITY_PLACES[p as CityPlace]===destination) as CityPlace)).toBe(true);
    }
    expect(canWalk({x:-26,z:-15},true)).toBe(false);
    expect(canWalk({x:26,z:-35},true)).toBe(false);
    expect(canWalk({x:3,z:-4.9},true)).toBe(false);
    expect(canWalk({x:0,z:-5},true)).toBe(true);
  });
  it('requires a correct fresh recipe at the counter and an on-time physical delivery; charges once', () => {
    const start = createInitialState();
    let game = cityAction(start,{type:'accept',destination:'school'},CITY_PLACES.shop);
    expect(startDay(game).phase).toBe('prep');
    expect(cityAction(game,{type:'pack',base:'peach-tea',sugar:50,timing:100},CITY_PLACES.market).inventory).toEqual(start.inventory);
    expect(cityAction(game,{type:'pack',base:'classic-milk-tea',sugar:50,timing:100},CITY_PLACES.shop).inventory).toEqual(start.inventory);
    game = cityAction(game,{type:'pack',base:'peach-tea',sugar:50,timing:100},CITY_PLACES.shop);
    expect(game.inventory.peachTea).toBe(start.inventory.peachTea-3);
    expect(game.inventory.cupsM).toBe(start.inventory.cupsM-3);
    expect(cityAction(game,{type:'pack',base:'peach-tea',sugar:50,timing:100},CITY_PLACES.shop)).toBe(game);
    expect(cityAction(game,{type:'deliver'},CITY_PLACES.shop).cash).toBe(start.cash);
    game = cityAction(walkCity(game,60,CITY_PLACES.school),{type:'deliver'},CITY_PLACES.school);
    expect(game.cash).toBe(start.cash+82000);
    expect(game.city.deliveries).toBe(1);
    expect(game.fans).toBe(3);
    expect(cityAction(game,{type:'deliver'},CITY_PLACES.school).cash).toBe(game.cash);
    expect(cityAction(game,{type:'accept',destination:'school'},CITY_PLACES.school)).toBe(game);
    expect(startDay(game).phase).toBe('open');
  });
  it('prevents rewards for expired jobs, insufficient or stale inventory and low energy', () => {
    const initial = createInitialState();
    const accepted = cityAction(initial,{type:'accept',destination:'school'},CITY_PLACES.shop);
    const action = {type:'pack' as const,base:'peach-tea' as const,sugar:50,timing:100};
    const short = {...accepted,inventory:{...accepted.inventory,cupsM:0}};
    expect(cityAction(short,action,CITY_PLACES.shop).city.contract?.packed).toBe(false);
    const stale = {...accepted,freshness:{...accepted.freshness,peachTea:0}};
    expect(cityAction(stale,action,CITY_PLACES.shop).inventory).toEqual(stale.inventory);
    let packed = cityAction(accepted,action,CITY_PLACES.shop);
    packed = {...packed,city:{...packed.city,minutes:packed.city.contract!.deadline+1}};
    expect(cityAction(packed,{type:'deliver'},CITY_PLACES.school).cash).toBe(initial.cash);
    const tired={...accepted,city:{...accepted.city,energy:0}};
    expect(cityAction(tired,action,CITY_PLACES.shop).inventory).toEqual(tired.inventory);
    expect(cityAction(tired,{type:'rest'},CITY_PLACES.lake).city.energy).toBe(35);
  });
  it('makes the market, community, projects and daily reset feed real persistent shop resources', () => {
    let game = createInitialState();
    const cash=game.cash;
    game=cityAction(game,{type:'market'},CITY_PLACES.market);
    expect(game.cash).toBe(cash-48000);
    expect(game.inventory.cupsM).toBe(createInitialState().inventory.cupsM+12);
    expect(cityAction(game,{type:'market'},CITY_PLACES.market).cash).toBe(game.cash);
    game=cityAction(game,{type:'project',id:'trees'},CITY_PLACES.park);
    game=cityAction(game,{type:'garden'},CITY_PLACES.park);
    expect(game.city.goodwill).toBe(6);
    const after=nextDay({...game,city:{...game.city,projects:[...game.city.projects,'club']}});
    expect(after.city.projects).toContain('trees');
    expect(after.city.goodwill).toBe(6);
    expect(after.city.errands).toEqual([]);
    expect(after.city.minutes).toBe(480);
    expect(after.fans).toBe(game.fans+3);
    expect(cityContracts(game).some(c=>c.destination==='library')).toBe(false);
  });
  it('keeps shop service intact while refusing excursions during an open shift', () => {
    const open=startDay(createInitialState());
    expect(cityAction(open,{type:'market'},CITY_PLACES.market).cash).toBe(open.cash);
    expect(cityAction(open,{type:'accept',destination:'school'},CITY_PLACES.shop).city.contract).toBeNull();
    expect(cityAction(createInitialState(),{type:'bus'},CITY_PLACES.bus).cash).toBe(213000);
    expect(cityAction(createInitialState(),{type:'bus'},CITY_PLACES.market).cash).toBe(220000);
  });
  it('loads incumbent v3 saves and round-trips packed jobs without losing city projects', () => {
    const memory=new Map<string,string>();
    vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v)});
    const old={...createInitialState(),cash:333000} as Record<string,unknown>;
    delete old.city;
    memory.set('tiem-tra-chibi-save-v3',JSON.stringify(old));
    expect(loadGame().cash).toBe(333000);
    expect(loadGame().city.minutes).toBe(480);
    let game=cityAction(createInitialState(),{type:'accept',destination:'apartments'},CITY_PLACES.shop);
    game=cityAction(game,{type:'pack',base:'classic-milk-tea',sugar:75,timing:100},CITY_PLACES.shop);
    saveGame(game);
    expect(loadGame().city.contract).toEqual(game.city.contract);
    expect(hydrateCity({minutes:NaN,visited:['bad' as CityPlace],projects:['bad' as 'trees']},1).minutes).toBe(480);
  });
});
