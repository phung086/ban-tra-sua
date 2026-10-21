import { describe, expect, it, vi, afterEach } from 'vitest';
import { createInitialState, nextDay, startDay } from './engine';
import { cityAction, cityContracts, getMarketOffers, hydrateCity, walkCity } from './city';
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

describe('QG-06 day 10 market price shock', () => {
  const dayTen = () => {
    let game = createInitialState();
    for (let day = 1; day < 10; day++) game = nextDay(game);
    return game;
  };

  it('offers two real baskets only on day 10, without changing the day-one market', () => {
    expect(getMarketOffers(createInitialState()).map(offer => [offer.id, offer.cost])).toEqual([['full', 48000]]);
    expect(getMarketOffers(dayTen()).map(offer => [offer.id, offer.cost])).toEqual([['full', 60000], ['budget', 36000]]);
    expect(getMarketOffers(nextDay(dayTen())).map(offer => [offer.id, offer.cost])).toEqual([['full', 48000]]);
  });

  it('makes the budget choice change real stock and cash exactly once, including after reload', () => {
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
    });
    const before = dayTen();
    const chosen = cityAction(before, { type: 'market', basket: 'budget' }, CITY_PLACES.market);
    expect(chosen.cash).toBe(before.cash - 36000);
    expect(chosen.inventory.cupsM).toBe(before.inventory.cupsM + 8);
    expect(chosen.inventory.classicMilkTea).toBe(before.inventory.classicMilkTea + 5);
    expect(chosen.city.minutes).toBe(before.city.minutes + 15);
    expect(chosen.city.energy).toBe(before.city.energy - 8);
    expect(chosen.relationshipRewardIds).toContain('market.day10.budget');
    expect(cityAction(chosen, { type: 'market', basket: 'full' }, CITY_PLACES.market).cash).toBe(chosen.cash);
    saveGame(chosen);
    const loaded = loadGame();
    expect(loaded.cash).toBe(chosen.cash);
    expect(loaded.inventory.cupsM).toBe(chosen.inventory.cupsM);
    expect(loaded.relationshipRewardIds).toContain('market.day10.budget');
    expect(cityAction(loaded, { type: 'market', basket: 'budget' }, CITY_PLACES.market).cash).toBe(chosen.cash);
    const tomorrow = nextDay(loaded);
    expect(tomorrow.day).toBe(11);
    expect(tomorrow.city.errands).toEqual([]);
    expect(getMarketOffers(tomorrow)[0].cost).toBe(48000);
    expect(cityAction(tomorrow, { type: 'market', basket: 'budget' }, CITY_PLACES.market)).toBe(tomorrow);
  });

  it('rewards a full basket with a day-11 supplier discount, never an unlimited discount', () => {
    const before = dayTen();
    const chosen = cityAction(before, { type: 'market', basket: 'full' }, CITY_PLACES.market);
    expect(chosen.cash).toBe(before.cash - 60000);
    expect(chosen.inventory.cupsM).toBe(before.inventory.cupsM + 12);
    expect(chosen.relationshipRewardIds).toContain('market.day10.full');
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
    });
    saveGame(chosen);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('market.day10.full');
    const tomorrow = nextDay(resumed);
    expect(getMarketOffers(tomorrow)[0].cost).toBe(44000);
    const bought = cityAction(tomorrow, { type: 'market' }, CITY_PLACES.market);
    expect(bought.cash).toBe(tomorrow.cash - 44000);
    expect(cityAction(bought, { type: 'market' }, CITY_PLACES.market).cash).toBe(bought.cash);
    expect(getMarketOffers(nextDay(bought))[0].cost).toBe(48000);
  });

  it('refuses impossible purchases and preserves open-shift and location gates', () => {
    const before = dayTen();
    const poor = { ...before, cash: 0 };
    expect(cityAction(poor, { type: 'market', basket: 'budget' }, CITY_PLACES.market).inventory).toEqual(poor.inventory);
    expect(cityAction(before, { type: 'market', basket: 'full' }, CITY_PLACES.shop).cash).toBe(before.cash);
    expect(cityAction({ ...before, phase: 'open' }, { type: 'market', basket: 'full' }, CITY_PLACES.market).cash).toBe(before.cash);
    const tired = { ...before, city: { ...before.city, energy: 0 } };
    expect(cityAction(tired, { type: 'market', basket: 'full' }, CITY_PLACES.market).cash).toBe(before.cash);
  });
});

describe('QG-07 day 11 supplier favor', () => {
  const dayEleven = () => {
    let game = createInitialState();
    for (let day = 1; day < 11; day++) game = nextDay(game);
    return game;
  };

  it('makes helping a real choice with a one-day discount after save and resume', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    });
    const before = dayEleven();
    const helped = cityAction(before, { type: 'supplier', choice: 'help' }, CITY_PLACES.market);
    expect(helped.cash).toBe(before.cash);
    expect(helped.city.minutes).toBe(before.city.minutes + 20);
    expect(helped.city.energy).toBe(before.city.energy - 12);
    expect(helped.city.goodwill).toBe(before.city.goodwill + 3);
    expect(helped.relationshipRewardIds).toContain('market.day11.help');
    expect(cityAction(helped, { type: 'supplier', choice: 'hurry' }, CITY_PLACES.market)).toBe(helped);
    saveGame(helped);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('market.day11.help');
    expect(cityAction(resumed, { type: 'supplier', choice: 'help' }, CITY_PLACES.market)).toBe(resumed);
    const day12 = nextDay(resumed);
    expect(getMarketOffers(day12)[0].cost).toBe(42000);
    const bought = cityAction(day12, { type: 'market' }, CITY_PLACES.market);
    expect(bought.cash).toBe(day12.cash - 42000);
    expect(cityAction(bought, { type: 'market' }, CITY_PLACES.market).cash).toBe(bought.cash);
    expect(getMarketOffers(nextDay(bought))[0].cost).toBe(48000);
  });

  it('makes returning early grant two real cups without a future discount', () => {
    const before = dayEleven();
    const hurry = cityAction(before, { type: 'supplier', choice: 'hurry' }, CITY_PLACES.market);
    expect(hurry.inventory.cupsM).toBe(before.inventory.cupsM + 2);
    expect(hurry.city.minutes).toBe(before.city.minutes + 5);
    expect(hurry.city.energy).toBe(before.city.energy - 2);
    expect(hurry.city.goodwill).toBe(before.city.goodwill);
    expect(hurry.relationshipRewardIds).toContain('market.day11.hurry');
    expect(cityAction(hurry, { type: 'supplier', choice: 'help' }, CITY_PLACES.market)).toBe(hurry);
    expect(getMarketOffers(nextDay(hurry))[0].cost).toBe(48000);
  });

  it('enforces day, position, opening hours, shift, and energy without side effects', () => {
    const before = dayEleven();
    const help = { type: 'supplier' as const, choice: 'help' as const };
    const firstDay = createInitialState();
    expect(cityAction(firstDay, help, CITY_PLACES.market)).toBe(firstDay);
    expect(cityAction(before, help, CITY_PLACES.shop).relationshipRewardIds).toEqual(before.relationshipRewardIds);
    expect(cityAction({ ...before, phase: 'open' }, help, CITY_PLACES.market).relationshipRewardIds).toEqual(before.relationshipRewardIds);
    const tired = { ...before, city: { ...before.city, energy: 11 } };
    expect(cityAction(tired, help, CITY_PLACES.market).relationshipRewardIds).toEqual(before.relationshipRewardIds);
    const late = { ...before, city: { ...before.city, minutes: CITY_PLACES.market.hours[1] - 10 } };
    expect(cityAction(late, help, CITY_PLACES.market).relationshipRewardIds).toEqual(before.relationshipRewardIds);
    const day12 = nextDay(before);
    expect(cityAction(day12, help, CITY_PLACES.market)).toBe(day12);
  });
});
describe('QG-08 day 12 rainy school tea delivery', () => {
  const dayTwelve = () => {
    let game = createInitialState();
    for (let day = 1; day < 12; day++) game = nextDay(game);
    return { ...game,
      inventory: { ...game.inventory, peachTea: 6, cupsM: 6, sugar: 6, ice: 6 },
      freshness: { ...game.freshness, peachTea: 100, cupsM: 100, sugar: 100, ice: 100 },
    };
  };

  it('gifts two real teas, saves the decision and earns a larger day-13 school order', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); } });
    const before = dayTwelve();
    const gifted = cityAction(before, { type: 'school', choice: 'gift' }, CITY_PLACES.school);
    expect(gifted.inventory.peachTea).toBe(before.inventory.peachTea - 2);
    expect(gifted.inventory.cupsM).toBe(before.inventory.cupsM - 2);
    expect(gifted.inventory.sugar).toBe(before.inventory.sugar - 1);
    expect(gifted.inventory.ice).toBe(before.inventory.ice - 2);
    expect(gifted.cash).toBe(before.cash);
    expect(gifted.city.goodwill).toBe(before.city.goodwill + 4);
    expect(gifted.fans).toBe(before.fans + 3);
    expect(gifted.city.minutes).toBe(before.city.minutes + 20);
    expect(gifted.relationshipRewardIds).toContain('school.day12.gift');
    expect(cityAction(gifted, { type: 'school', choice: 'sell' }, CITY_PLACES.school)).toBe(gifted);
    saveGame(gifted);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('school.day12.gift');
    expect(cityAction(resumed, { type: 'school', choice: 'gift' }, CITY_PLACES.school)).toBe(resumed);
    const tomorrow = nextDay(resumed);
    expect(cityContracts(tomorrow).find(contract => contract.destination === 'school')?.reward).toBe(94000);
    expect(cityContracts(nextDay(tomorrow)).find(contract => contract.destination === 'school')?.reward).toBe(82000);
  });

  it('sells at a friendly price and earns a smaller day-13 referral, without replay', () => {
    const before = dayTwelve();
    const sold = cityAction(before, { type: 'school', choice: 'sell' }, CITY_PLACES.school);
    expect(sold.cash).toBe(before.cash + 38000);
    expect(sold.city.income).toBe(before.city.income + 38000);
    expect(sold.inventory.peachTea).toBe(before.inventory.peachTea - 2);
    expect(sold.city.energy).toBe(before.city.energy - 6);
    expect(sold.fans).toBe(before.fans + 2);
    expect(sold.relationshipRewardIds).toContain('school.day12.sell');
    expect(cityAction(sold, { type: 'school', choice: 'gift' }, CITY_PLACES.school)).toBe(sold);
    expect(cityContracts(nextDay(sold)).find(contract => contract.destination === 'school')?.reward).toBe(88000);
  });

  it('offers a no-stock fallback and enforces day, shift, location, freshness, time and energy', () => {
    const before = dayTwelve();
    const gift = { type: 'school' as const, choice: 'gift' as const };
    const firstDay = createInitialState();
    expect(cityAction(firstDay, gift, CITY_PLACES.school)).toBe(firstDay);
    expect(cityAction(before, gift, CITY_PLACES.shop).relationshipRewardIds).toEqual(before.relationshipRewardIds);
    expect(cityAction({ ...before, phase: 'open' }, gift, CITY_PLACES.school).relationshipRewardIds).toEqual(before.relationshipRewardIds);
    const empty = { ...before, inventory: { ...before.inventory, peachTea: 0 } };
    expect(cityAction(empty, gift, CITY_PLACES.school).relationshipRewardIds).toEqual(empty.relationshipRewardIds);
    const stale = { ...before, freshness: { ...before.freshness, peachTea: 0 } };
    expect(cityAction(stale, gift, CITY_PLACES.school).inventory).toEqual(stale.inventory);
    const tired = { ...before, city: { ...before.city, energy: 9 } };
    expect(cityAction(tired, gift, CITY_PLACES.school).relationshipRewardIds).toEqual(before.relationshipRewardIds);
    const late = { ...before, city: { ...before.city, minutes: CITY_PLACES.school.hours[1] - 10 } };
    expect(cityAction(late, gift, CITY_PLACES.school).relationshipRewardIds).toEqual(before.relationshipRewardIds);
    const postponed = cityAction(empty, { type: 'school', choice: 'reschedule' }, CITY_PLACES.school);
    expect(postponed.inventory).toEqual(empty.inventory);
    expect(postponed.cash).toBe(empty.cash);
    expect(postponed.relationshipRewardIds).toContain('school.day12.reschedule');
    expect(cityAction(postponed, gift, CITY_PLACES.school)).toBe(postponed);
    expect(cityContracts(nextDay(postponed)).find(contract => contract.destination === 'school')?.reward).toBe(82000);
  });
});

describe('QG-09 day 13 class-fair sign with Lan', () => {
  const dayThirteen = () => {
    let game = createInitialState();
    for (let day = 1; day < 13; day++) game = nextDay(game);
    return game;
  };

  it('pays for a sign once, survives reload and changes only the day-14 school order', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    });
    const before = { ...dayThirteen(), relationshipRewardIds: ['school.day12.gift'] };
    expect(cityContracts(before).find(c => c.destination === 'school')?.reward).toBe(94000);
    const painted = cityAction(before, { type: 'schoolFair', choice: 'paint' }, CITY_PLACES.school);
    expect(painted.cash).toBe(before.cash - 8000);
    expect(painted.city.minutes).toBe(before.city.minutes + 20);
    expect(painted.city.energy).toBe(before.city.energy - 12);
    expect(painted.city.goodwill).toBe(before.city.goodwill + 4);
    expect(painted.fans).toBe(before.fans + 2);
    expect(painted.relationshipRewardIds).toContain('school.day13.paint');
    expect(cityAction(painted, { type: 'schoolFair', choice: 'share' }, CITY_PLACES.school)).toBe(painted);
    saveGame(painted);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('school.day13.paint');
    expect(cityAction(resumed, { type: 'schoolFair', choice: 'paint' }, CITY_PLACES.school)).toBe(resumed);
    const day14 = nextDay(resumed);
    expect(cityContracts(day14).find(c => c.destination === 'school')?.reward).toBe(90000);
    expect(cityContracts(nextDay(day14)).find(c => c.destination === 'school')?.reward).toBe(82000);
  });

  it('lets a player with no money or stock share the menu instead', () => {
    const start = dayThirteen();
    const before = { ...start, cash: 0, city: { ...start.city, energy: 2 }, inventory: { ...start.inventory, peachTea: 0 } };
    expect(cityAction(before, { type: 'schoolFair', choice: 'paint' }, CITY_PLACES.school).relationshipRewardIds).toEqual([]);
    const shared = cityAction(before, { type: 'schoolFair', choice: 'share' }, CITY_PLACES.school);
    expect(shared.cash).toBe(0);
    expect(shared.inventory).toEqual(before.inventory);
    expect(shared.city.energy).toBe(0);
    expect(shared.city.minutes).toBe(before.city.minutes + 5);
    expect(shared.city.goodwill).toBe(before.city.goodwill + 1);
    expect(shared.fans).toBe(before.fans + 1);
    expect(shared.relationshipRewardIds).toContain('school.day13.share');
    expect(cityContracts(nextDay(shared)).find(c => c.destination === 'school')?.reward).toBe(85000);
  });

  it('rejects other days, locations, open shifts, active jobs, late hours and low energy', () => {
    const before = dayThirteen();
    const paint = { type: 'schoolFair' as const, choice: 'paint' as const };
    expect(cityAction(createInitialState(), paint, CITY_PLACES.school).relationshipRewardIds).toEqual([]);
    expect(cityAction(before, paint, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
    expect(cityAction({ ...before, phase: 'open' }, paint, CITY_PLACES.school).relationshipRewardIds).toEqual([]);
    const contracted = cityAction(before, { type: 'accept', destination: 'school' }, CITY_PLACES.shop);
    expect(cityAction(contracted, paint, CITY_PLACES.school).relationshipRewardIds).toEqual([]);
    const tired = { ...before, city: { ...before.city, energy: 11 } };
    expect(cityAction(tired, paint, CITY_PLACES.school).relationshipRewardIds).toEqual([]);
    const late = { ...before, city: { ...before.city, minutes: CITY_PLACES.school.hours[1] - 10 } };
    expect(cityAction(late, paint, CITY_PLACES.school).relationshipRewardIds).toEqual([]);
    expect(cityAction(nextDay(before), paint, CITY_PLACES.school).relationshipRewardIds).toEqual([]);
  });
});

describe('QG-10 day 14 apartment meeting with Co Thu', () => {
  const dayFourteen = () => {
    let game = createInitialState();
    for (let day = 1; day < 14; day++) game = nextDay(game);
    // Daily spoilage clears perishable stock before Day 14; emulate a fresh restock.
    return { ...game,
      inventory: { ...game.inventory, classicMilkTea: 4, cupsM: 4, sugar: 4, ice: 4 },
      freshness: { ...game.freshness, classicMilkTea: 100, cupsM: 100, sugar: 100, ice: 100 },
    };
  };

  it('carries two fresh teas once and persists the day-15 apartment order bonus', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    });
    const before = dayFourteen();
    const helped = cityAction(before, { type: 'apartmentMeet', choice: 'carry' }, CITY_PLACES.apartments);
    expect(helped.inventory.classicMilkTea).toBe(before.inventory.classicMilkTea - 2);
    expect(helped.inventory.cupsM).toBe(before.inventory.cupsM - 2);
    expect(helped.inventory.sugar).toBe(before.inventory.sugar - 1);
    expect(helped.inventory.ice).toBe(before.inventory.ice - 2);
    expect(helped.cash).toBe(before.cash);
    expect(helped.city.minutes).toBe(before.city.minutes + 22);
    expect(helped.city.energy).toBe(before.city.energy - 12);
    expect(helped.city.goodwill).toBe(before.city.goodwill + 4);
    expect(helped.fans).toBe(before.fans + 2);
    expect(helped.relationshipRewardIds).toContain('apartments.day14.carry');
    expect(cityAction(helped, { type: 'apartmentMeet', choice: 'coordinate' }, CITY_PLACES.apartments)).toBe(helped);
    saveGame(helped);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('apartments.day14.carry');
    expect(cityAction(resumed, { type: 'apartmentMeet', choice: 'carry' }, CITY_PLACES.apartments)).toBe(resumed);
    const day15 = nextDay(resumed);
    expect(cityContracts(day15).find(c => c.destination === 'apartments')?.reward).toBe(118000);
    expect(cityContracts(nextDay(day15)).find(c => c.destination === 'apartments')?.reward).toBe(108000);
  });

  it('lets a player with no fresh tea coordinate without losing supplies', () => {
    const before = dayFourteen();
    const empty = { ...before, inventory: { ...before.inventory, classicMilkTea: 0 }, city: { ...before.city, energy: 2 } };
    expect(cityAction(empty, { type: 'apartmentMeet', choice: 'carry' }, CITY_PLACES.apartments).relationshipRewardIds).toEqual([]);
    const coordinated = cityAction(empty, { type: 'apartmentMeet', choice: 'coordinate' }, CITY_PLACES.apartments);
    expect(coordinated.inventory).toEqual(empty.inventory);
    expect(coordinated.cash).toBe(empty.cash);
    expect(coordinated.city.energy).toBe(0);
    expect(coordinated.city.minutes).toBe(empty.city.minutes + 6);
    expect(coordinated.city.goodwill).toBe(empty.city.goodwill + 1);
    expect(coordinated.fans).toBe(empty.fans + 1);
    expect(coordinated.relationshipRewardIds).toContain('apartments.day14.coordinate');
    expect(cityContracts(nextDay(coordinated)).find(c => c.destination === 'apartments')?.reward).toBe(112000);
  });

  it('guards the day, location, shift, active delivery, freshness, time and energy', () => {
    const before = dayFourteen();
    const carry = { type: 'apartmentMeet' as const, choice: 'carry' as const };
    expect(cityAction(createInitialState(), carry, CITY_PLACES.apartments).relationshipRewardIds).toEqual([]);
    expect(cityAction(before, carry, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
    expect(cityAction({ ...before, phase: 'open' }, carry, CITY_PLACES.apartments).relationshipRewardIds).toEqual([]);
    const contracted = cityAction(before, { type: 'accept', destination: 'apartments' }, CITY_PLACES.shop);
    expect(cityAction(contracted, carry, CITY_PLACES.apartments).relationshipRewardIds).toEqual([]);
    const stale = { ...before, freshness: { ...before.freshness, classicMilkTea: 0 } };
    expect(cityAction(stale, carry, CITY_PLACES.apartments).inventory).toEqual(stale.inventory);
    const tired = { ...before, city: { ...before.city, energy: 11 } };
    expect(cityAction(tired, carry, CITY_PLACES.apartments).relationshipRewardIds).toEqual([]);
    const late = { ...before, city: { ...before.city, minutes: CITY_PLACES.apartments.hours[1] - 10 } };
    expect(cityAction(late, carry, CITY_PLACES.apartments).relationshipRewardIds).toEqual([]);
    expect(cityAction(nextDay(before), carry, CITY_PLACES.apartments).relationshipRewardIds).toEqual([]);
  });
});

describe('QG-11 day 15 reading corner with anh Nam', () => {
  const dayFifteen = () => {
    let game = { ...createInitialState(), xp: 160 };
    for (let day = 1; day < 15; day++) game = nextDay(game);
    return { ...game,
      inventory: { ...game.inventory, oolongMilkTea: 4, cupsM: 4, sugar: 4, ice: 4 },
      freshness: { ...game.freshness, oolongMilkTea: 100, cupsM: 100, sugar: 100, ice: 100 },
    };
  };

  it('brews fresh tea once, saves the decision and increases only the day-16 library order', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    });
    const before = dayFifteen();
    expect(before.unlockedBaseIds).toContain('oolong-milk-tea');
    expect(cityContracts(before).find(c => c.destination === 'library')?.reward).toBe(96000);
    const brewed = cityAction(before, { type: 'libraryCorner', choice: 'brew' }, CITY_PLACES.library);
    expect(brewed.inventory.oolongMilkTea).toBe(before.inventory.oolongMilkTea - 2);
    expect(brewed.inventory.cupsM).toBe(before.inventory.cupsM - 2);
    expect(brewed.inventory.sugar).toBe(before.inventory.sugar - 1);
    expect(brewed.inventory.ice).toBe(before.inventory.ice - 2);
    expect(brewed.cash).toBe(before.cash);
    expect(brewed.city.minutes).toBe(before.city.minutes + 18);
    expect(brewed.city.energy).toBe(before.city.energy - 10);
    expect(brewed.city.goodwill).toBe(before.city.goodwill + 3);
    expect(brewed.fans).toBe(before.fans + 2);
    expect(brewed.relationshipRewardIds).toContain('library.day15.brew');
    expect(cityAction(brewed, { type: 'libraryCorner', choice: 'organize' }, CITY_PLACES.library)).toBe(brewed);
    saveGame(brewed);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('library.day15.brew');
    expect(cityAction(resumed, { type: 'libraryCorner', choice: 'brew' }, CITY_PLACES.library)).toBe(resumed);
    const day16 = nextDay(resumed);
    expect(cityContracts(day16).find(c => c.destination === 'library')?.reward).toBe(104000);
    expect(cityContracts(nextDay(day16)).find(c => c.destination === 'library')?.reward).toBe(96000);
  });

  it('allows free book sorting without tea, cash or the unlocked oolong recipe', () => {
    const start = dayFifteen();
    const before = { ...start, cash: 0,
      unlockedBaseIds: start.unlockedBaseIds.filter(id => id !== 'oolong-milk-tea'),
      inventory: { ...start.inventory, oolongMilkTea: 0 },
      city: { ...start.city, energy: 2 } };
    expect(cityAction(before, { type: 'libraryCorner', choice: 'brew' }, CITY_PLACES.library).relationshipRewardIds).toEqual([]);
    const organized = cityAction(before, { type: 'libraryCorner', choice: 'organize' }, CITY_PLACES.library);
    expect(organized.cash).toBe(0);
    expect(organized.inventory).toEqual(before.inventory);
    expect(organized.city.minutes).toBe(before.city.minutes + 6);
    expect(organized.city.energy).toBe(0);
    expect(organized.city.goodwill).toBe(before.city.goodwill + 1);
    expect(organized.fans).toBe(before.fans + 1);
    expect(organized.relationshipRewardIds).toContain('library.day15.organize');
    const tomorrow = nextDay({ ...organized, unlockedBaseIds: start.unlockedBaseIds });
    expect(cityContracts(tomorrow).find(c => c.destination === 'library')?.reward).toBe(99000);
  });

  it('guards day, location, shop shift, active contract, stock freshness, time and energy', () => {
    const before = dayFifteen();
    const brew = { type: 'libraryCorner' as const, choice: 'brew' as const };
    expect(cityAction(createInitialState(), brew, CITY_PLACES.library).relationshipRewardIds).toEqual([]);
    expect(cityAction(before, brew, CITY_PLACES.shop).relationshipRewardIds).toEqual([]);
    expect(cityAction({ ...before, phase: 'open' }, brew, CITY_PLACES.library).relationshipRewardIds).toEqual([]);
    const contracted = cityAction(before, { type: 'accept', destination: 'library' }, CITY_PLACES.shop);
    expect(cityAction(contracted, brew, CITY_PLACES.library).relationshipRewardIds).toEqual([]);
    const stale = { ...before, freshness: { ...before.freshness, oolongMilkTea: 0 } };
    expect(cityAction(stale, brew, CITY_PLACES.library).inventory).toEqual(stale.inventory);
    const tired = { ...before, city: { ...before.city, energy: 9 } };
    expect(cityAction(tired, brew, CITY_PLACES.library).relationshipRewardIds).toEqual([]);
    const late = { ...before, city: { ...before.city, minutes: CITY_PLACES.library.hours[1] - 10 } };
    expect(cityAction(late, brew, CITY_PLACES.library).relationshipRewardIds).toEqual([]);
    expect(cityAction(nextDay(before), brew, CITY_PLACES.library).relationshipRewardIds).toEqual([]);
  });
});

describe('QG-12 day 16 lake drizzle with bac Minh', () => {
  const daySixteen = () => {
    let game = createInitialState();
    for (let day = 1; day < 16; day++) game = nextDay(game);
    return game;
  };

  it('covers the lakeside seats once and persists the day-17 apartment referral', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    });
    const before = daySixteen();
    const helped = cityAction(before, { type: 'lakeRain', choice: 'cover' }, CITY_PLACES.lake);
    expect(helped.cash).toBe(before.cash - 9000);
    expect(helped.inventory).toEqual(before.inventory);
    expect(helped.city.minutes).toBe(before.city.minutes + 18);
    expect(helped.city.energy).toBe(before.city.energy - 10);
    expect(helped.city.goodwill).toBe(before.city.goodwill + 3);
    expect(helped.fans).toBe(before.fans + 2);
    expect(helped.relationshipRewardIds).toContain('lake.day16.cover');
    expect(cityAction(helped, { type: 'lakeRain', choice: 'move' }, CITY_PLACES.lake)).toBe(helped);
    saveGame(helped);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('lake.day16.cover');
    expect(cityAction(resumed, { type: 'lakeRain', choice: 'cover' }, CITY_PLACES.lake)).toBe(resumed);
    const day17 = nextDay(resumed);
    expect(cityContracts(day17).find(c => c.destination === 'apartments')?.reward).toBe(115000);
    expect(cityContracts(nextDay(day17)).find(c => c.destination === 'apartments')?.reward).toBe(108000);
  });

  it('allows the no-cash shelter message without consuming ingredients', () => {
    const start = daySixteen();
    const before = { ...start, cash: 0, city: { ...start.city, energy: 2 } };
    expect(cityAction(before, { type: 'lakeRain', choice: 'cover' }, CITY_PLACES.lake).relationshipRewardIds).toEqual([]);
    const moved = cityAction(before, { type: 'lakeRain', choice: 'move' }, CITY_PLACES.lake);
    expect(moved.cash).toBe(0);
    expect(moved.inventory).toEqual(before.inventory);
    expect(moved.city.minutes).toBe(before.city.minutes + 6);
    expect(moved.city.energy).toBe(0);
    expect(moved.city.goodwill).toBe(before.city.goodwill + 1);
    expect(moved.fans).toBe(before.fans + 1);
    expect(moved.relationshipRewardIds).toContain('lake.day16.move');
    expect(cityContracts(nextDay(moved)).find(c => c.destination === 'apartments')?.reward).toBe(111000);
  });

  it('guards the day, location, open shift, active delivery, closing time and energy', () => {
    const before = daySixteen();
    const cover = { type: 'lakeRain' as const, choice: 'cover' as const };
    expect(cityAction(createInitialState(), cover, CITY_PLACES.lake).relationshipRewardIds).toEqual([]);
    expect(cityAction(before, cover, CITY_PLACES.shop).relationshipRewardIds).toEqual([]);
    expect(cityAction({ ...before, phase: 'open' }, cover, CITY_PLACES.lake).relationshipRewardIds).toEqual([]);
    const contracted = cityAction(before, { type: 'accept', destination: 'apartments' }, CITY_PLACES.shop);
    expect(cityAction(contracted, cover, CITY_PLACES.lake).relationshipRewardIds).toEqual([]);
    const tired = { ...before, city: { ...before.city, energy: 9 } };
    expect(cityAction(tired, cover, CITY_PLACES.lake).relationshipRewardIds).toEqual([]);
    const late = { ...before, city: { ...before.city, minutes: 1250 } };
    expect(cityAction(late, cover, CITY_PLACES.lake).relationshipRewardIds).toEqual([]);
    expect(cityAction(nextDay(before), cover, CITY_PLACES.lake).relationshipRewardIds).toEqual([]);
  });
});

describe('QG-13 day 17 market cooling with co Hanh', () => {
  const daySeventeen = () => {
    let game = createInitialState();
    for (let day = 1; day < 17; day++) game = nextDay(game);
    return { ...game,
      inventory: { ...game.inventory, ice: 5 },
      freshness: { ...game.freshness, ice: 100 },
    };
  };

  it('spends fresh ice once, persists the choice and discounts only the day-18 market basket', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    });
    const before = daySeventeen();
    expect(getMarketOffers(before)[0].cost).toBe(48000);
    const cooled = cityAction(before, { type: 'marketCooling', choice: 'ice' }, CITY_PLACES.market);
    expect(cooled.inventory.ice).toBe(before.inventory.ice - 3);
    expect(cooled.cash).toBe(before.cash);
    expect(cooled.city.minutes).toBe(before.city.minutes + 15);
    expect(cooled.city.energy).toBe(before.city.energy - 8);
    expect(cooled.city.goodwill).toBe(before.city.goodwill + 3);
    expect(cooled.fans).toBe(before.fans + 2);
    expect(cooled.relationshipRewardIds).toContain('market.day17.ice');
    expect(cityAction(cooled, { type: 'marketCooling', choice: 'borrow' }, CITY_PLACES.market)).toBe(cooled);
    saveGame(cooled);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('market.day17.ice');
    expect(cityAction(resumed, { type: 'marketCooling', choice: 'ice' }, CITY_PLACES.market)).toBe(resumed);
    const day18 = nextDay(resumed);
    expect(getMarketOffers(day18)[0].cost).toBe(40000);
    const purchase = cityAction({ ...day18, cash: 50000 }, { type: 'market', basket: 'full' }, CITY_PLACES.market);
    expect(purchase.cash).toBe(10000);
    expect(purchase.city.errands).toContain('market');
    expect(getMarketOffers(nextDay(day18))[0].cost).toBe(48000);
  });

  it('allows the free borrowed cooler without cash or fresh ice', () => {
    const start = daySeventeen();
    const before = { ...start, cash: 0, inventory: { ...start.inventory, ice: 0 },
      city: { ...start.city, energy: 2 } };
    expect(cityAction(before, { type: 'marketCooling', choice: 'ice' }, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
    const borrowed = cityAction(before, { type: 'marketCooling', choice: 'borrow' }, CITY_PLACES.market);
    expect(borrowed.cash).toBe(0);
    expect(borrowed.inventory).toEqual(before.inventory);
    expect(borrowed.city.energy).toBe(0);
    expect(borrowed.city.minutes).toBe(before.city.minutes + 6);
    expect(borrowed.city.goodwill).toBe(before.city.goodwill + 1);
    expect(borrowed.fans).toBe(before.fans + 1);
    expect(borrowed.relationshipRewardIds).toContain('market.day17.borrow');
    expect(getMarketOffers(nextDay(borrowed))[0].cost).toBe(45000);
  });

  it('guards day, location, shop shift, active delivery, stale ice, closing time and energy', () => {
    const before = daySeventeen();
    const ice = { type: 'marketCooling' as const, choice: 'ice' as const };
    expect(cityAction(createInitialState(), ice, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
    expect(cityAction(before, ice, CITY_PLACES.shop).relationshipRewardIds).toEqual([]);
    expect(cityAction({ ...before, phase: 'open' }, ice, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
    const contracted = cityAction(before, { type: 'accept', destination: 'school' }, CITY_PLACES.shop);
    expect(cityAction(contracted, ice, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
    const stale = { ...before, freshness: { ...before.freshness, ice: 0 } };
    expect(cityAction(stale, ice, CITY_PLACES.market).inventory).toEqual(stale.inventory);
    const tired = { ...before, city: { ...before.city, energy: 7 } };
    expect(cityAction(tired, ice, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
    const late = { ...before, city: { ...before.city, minutes: CITY_PLACES.market.hours[1] - 10 } };
    expect(cityAction(late, ice, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
    expect(cityAction(nextDay(before), ice, CITY_PLACES.market).relationshipRewardIds).toEqual([]);
  });
});

describe('QG-14 day 18 bus 09 lost meeting documents for co Thu', () => {
  const dayEighteen = () => {
    let game = createInitialState();
    for (let day = 1; day < 18; day++) game = nextDay(game);
    return game;
  };

  it('pays for a single retrieval ride, survives reload and rewards only day 19', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    });
    const before = dayEighteen();
    const retrieved = cityAction(before, { type: 'busParcel', choice: 'ride' }, CITY_PLACES.bus);
    expect(retrieved.cash).toBe(before.cash - 7000);
    expect(retrieved.inventory).toEqual(before.inventory);
    expect(retrieved.city.minutes).toBe(before.city.minutes + 16);
    expect(retrieved.city.energy).toBe(before.city.energy - 8);
    expect(retrieved.city.goodwill).toBe(before.city.goodwill + 3);
    expect(retrieved.fans).toBe(before.fans + 2);
    expect(retrieved.relationshipRewardIds).toContain('bus.day18.ride');
    expect(cityAction(retrieved, { type: 'busParcel', choice: 'call' }, CITY_PLACES.bus)).toBe(retrieved);
    saveGame(retrieved);
    const resumed = loadGame();
    expect(resumed.relationshipRewardIds).toContain('bus.day18.ride');
    expect(cityAction(resumed, { type: 'busParcel', choice: 'ride' }, CITY_PLACES.bus)).toBe(resumed);
    const day19 = nextDay(resumed);
    expect(cityContracts(day19).find(c => c.destination === 'apartments')?.reward).toBe(115000);
    expect(cityContracts(nextDay(day19)).find(c => c.destination === 'apartments')?.reward).toBe(108000);
  });

  it('allows a free dispatcher call with no cash or ingredients', () => {
    const start = dayEighteen();
    const before = { ...start, cash: 0, city: { ...start.city, energy: 2 } };
    expect(cityAction(before, { type: 'busParcel', choice: 'ride' }, CITY_PLACES.bus).relationshipRewardIds).toEqual([]);
    const called = cityAction(before, { type: 'busParcel', choice: 'call' }, CITY_PLACES.bus);
    expect(called.cash).toBe(0);
    expect(called.inventory).toEqual(before.inventory);
    expect(called.city.minutes).toBe(before.city.minutes + 6);
    expect(called.city.energy).toBe(0);
    expect(called.city.goodwill).toBe(before.city.goodwill + 1);
    expect(called.fans).toBe(before.fans + 1);
    expect(called.relationshipRewardIds).toContain('bus.day18.call');
    expect(cityContracts(nextDay(called)).find(c => c.destination === 'apartments')?.reward).toBe(111000);
  });

  it('guards day, bus location, open shift, active delivery, cash, time and energy', () => {
    const before = dayEighteen();
    const ride = { type: 'busParcel' as const, choice: 'ride' as const };
    expect(cityAction(createInitialState(), ride, CITY_PLACES.bus).relationshipRewardIds).toEqual([]);
    expect(cityAction(before, ride, CITY_PLACES.shop).relationshipRewardIds).toEqual([]);
    expect(cityAction({ ...before, phase: 'open' }, ride, CITY_PLACES.bus).relationshipRewardIds).toEqual([]);
    const contracted = cityAction(before, { type: 'accept', destination: 'school' }, CITY_PLACES.shop);
    expect(cityAction(contracted, ride, CITY_PLACES.bus).relationshipRewardIds).toEqual([]);
    expect(cityAction({ ...before, cash: 0 }, ride, CITY_PLACES.bus).relationshipRewardIds).toEqual([]);
    expect(cityAction({ ...before, city: { ...before.city, energy: 7 } }, ride, CITY_PLACES.bus).relationshipRewardIds).toEqual([]);
    const late = { ...before, city: { ...before.city, minutes: CITY_PLACES.bus.hours[1] - 10 } };
    expect(cityAction(late, ride, CITY_PLACES.bus).relationshipRewardIds).toEqual([]);
    expect(cityAction(nextDay(before), ride, CITY_PLACES.bus).relationshipRewardIds).toEqual([]);
  });
});
