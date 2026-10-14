import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseShiftPlan, completionBonus, getRushCupShortage, getRushCupShortageBySize, getRushCupRequirements, getRushOrderSize, getRushOfficeCustomerId, getRushCommuterRequest, getRushCommuterPreferredBase, getRushShiftProgress, getShiftDisplayAverage, getShiftQueueSpacingMs, targetOrdersFor } from './shiftPlans';
import { chooseClosingCare, createInitialState, generateOrder, getRestockPrice, nextDay, restock, serveCurrentDrink, startDay } from './engine';
import type { GameState } from './types';
import { loadGame, saveGame } from './storage';

const dayNine = () => {
  let game = createInitialState();
  for (let day = 1; day < 9; day++) {
    if (game.day === 8) game = chooseClosingCare({ ...game, phase: "summary" }, "skip");
    game = nextDay(game);
  }
  return game;
};

function finishDay(initial: GameState): GameState {
  const stocked = { ...initial, inventory: Object.fromEntries(Object.keys(initial.inventory).map(key => [key, 100])) as GameState['inventory'] };
  let state = startDay(stocked, 1000);
  expect(state.phase).toBe('open');
  while (state.phase === 'open') {
    const order = state.currentOrder!;
    state = serveCurrentDrink({
      ...state,
      draft: { size: order.size, base: order.base, sugar: order.sugar, ice: order.ice,
        topping: order.topping, fill: order.targetFill, shake: order.targetShake, sealed: true },
    }, 1000);
  }
  return state;
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('QG-05 daily opening decision', () => {
  it('does not report 80 on a non-bonus day 9 rush summary', () => {
    const selected = chooseShiftPlan(dayNine(), 'rush');
    const stocked = { ...selected, inventory: Object.fromEntries(
      Object.keys(selected.inventory).map(key => [key, 100])) as GameState['inventory'] };
    const opened = startDay(stocked, 1000);
    const order = opened.currentOrder!;
    const beforeLast = { ...opened,
      served: opened.targetOrders - 1,
      currentOrderQueuedAt: 1000,
      customerQueue: [],
      draft: { ...opened.draft, size: order.size, base: order.base,
        sugar: order.sugar, ice: order.ice, topping: order.topping,
        fill: order.targetFill, shake: order.targetShake, sealed: true },
    };
    // Measure this specific final cup's score first, then set the earlier
    // aggregate to one point short of the 80-point bonus threshold.
    const probe = serveCurrentDrink({ ...beforeLast, dailyScoreTotal: 0 }, 1000);
    const final = serveCurrentDrink({ ...beforeLast,
      dailyScoreTotal: 80 * opened.targetOrders - probe.lastScore! - 1 }, 1000);
    expect(final.phase).toBe('summary');
    expect(final.summary?.averageScore).toBeLessThan(80);
    expect(final.summary?.averageScore).toBe(getShiftDisplayAverage(
      'rush', 9, opened.targetOrders, 80 * opened.targetOrders - 1));
    expect(getRushShiftProgress(final)?.bonusEarned).toBe(false);
    expect(serveCurrentDrink(final)).toBe(final);
  });

  it('shows live rush progress without paying rewards before the final order', () => {
    const selected = chooseShiftPlan(dayNine(), 'rush');
    expect(getRushShiftProgress({ ...selected, served: 2, dailyScoreTotal: 190 })).toEqual({
      served: 2, remaining: selected.targetOrders - 2, average: 95, requiredAverage: 78, bonusEarned: false,
    });
    expect(getRushShiftProgress({ ...selected, served: selected.targetOrders,
      dailyScoreTotal: selected.targetOrders * 80 })?.bonusEarned).toBe(true);
    expect(getRushShiftProgress({ ...selected, served: selected.targetOrders,
      dailyScoreTotal: selected.targetOrders * 79 })?.bonusEarned).toBe(false);
    expect(getRushShiftProgress({ ...selected, shiftPlan: 'regular' })).toBeNull();
  });

  it('does not round a sub-80 score up to a misleading bonus target', () => {
    const rush = chooseShiftPlan(dayNine(), 'rush');
    const below = getRushShiftProgress({ ...rush, served: 4, targetOrders: 10, dailyScoreTotal: 318 });
    expect(below?.average).toBe(79.5);
    expect(below?.requiredAverage).toBe(81);
    expect(below?.bonusEarned).toBe(false);
    const impossible = getRushShiftProgress({ ...rush, served: 9, targetOrders: 10, dailyScoreTotal: 600 });
    expect(impossible?.requiredAverage).toBeGreaterThan(100);
  });

  it('gives rush shifts two real impatient commuters at opening, alternating by day', () => {
    const day9 = chooseShiftPlan(dayNine(), 'rush');
    expect([generateOrder(day9, 0).customerId, generateOrder(day9, 1).customerId]).toEqual(['bo', 'duc']);
    expect(getRushOfficeCustomerId(day9, 2)).toBeNull();
    expect(getRushOfficeCustomerId({ ...day9, day: 8 }, 0)).toBeNull();
    expect(getRushOfficeCustomerId({ ...day9, shiftPlan: 'regular' }, 0)).toBeNull();
    expect([getRushOfficeCustomerId({ ...day9, day: 10 }, 0), getRushOfficeCustomerId({ ...day9, day: 10 }, 1)]).toEqual(['duc', 'bo']);
    expect(getRushOfficeCustomerId(day9, -1)).toBeNull();
    expect(getRushOfficeCustomerId(day9, 1.5)).toBeNull();
    expect(getRushCommuterRequest(day9, 0)).toMatchObject({customerId:'bo',sugar:30});
    expect(getRushCommuterRequest(day9, 1)).toMatchObject({customerId:'duc',ice:0});
    expect(getRushCommuterRequest({...day9,shiftPlan:'regular'},0)).toBeNull();
    expect(generateOrder(day9, 0).sugar).toBe(30);
    expect(generateOrder(day9, 1).ice).toBe(0);
  });

  it('gives commuters their favorites when unlocked, never a locked recipe', () => {
    const rush = chooseShiftPlan(dayNine(), 'rush');
    const allBases = [...rush.unlockedBaseIds, 'cocoa-milk'] as GameState['unlockedBaseIds'];
    const unlocked = { ...rush, unlockedBaseIds: allBases };
    expect(generateOrder(unlocked, 0).base).toBe('classic-milk-tea');
    expect(generateOrder(unlocked, 1).base).toBe('cocoa-milk');
    expect(getRushCommuterPreferredBase(rush, 1, 'cocoa-milk', ['classic-milk-tea'])).toBeNull();
    expect(getRushCommuterPreferredBase({ ...rush, shiftPlan: 'regular' }, 0, 'classic-milk-tea', allBases)).toBeNull();
    expect(getRushCommuterPreferredBase({ ...rush, day: 8 }, 0, 'classic-milk-tea', allBases)).toBeNull();
  });

  it('does not restart an active shift or duplicate the opening queue', () => {
    const rush = chooseShiftPlan(dayNine(), 'rush');
    const opened = startDay({ ...rush, inventory: { ...rush.inventory, cupsM: 100, cupsL: 100 } }, 1000);
    expect(startDay(opened, 2000)).toBe(opened);
    expect(startDay({ ...opened, phase: 'summary' }, 3000).phase).toBe('summary');
  });

  it('makes the rush queue arrive sooner while preserving normal and early days', () => {
    const normal = startDay(dayNine(), 1000);
    const rushPlan = chooseShiftPlan(dayNine(), 'rush');
    const rush = startDay({ ...rushPlan, inventory: { ...rushPlan.inventory, cupsM: 100, cupsL: 100 } }, 1000);
    expect(normal.customerQueue).toHaveLength(2);
    expect(rush.customerQueue).toHaveLength(2);
    expect(normal.customerQueue[0].joinedAt).toBe(11000);
    expect(rush.customerQueue[0].joinedAt).toBe(8000);
    expect(rush.customerQueue[1].joinedAt).toBe(15000);
    expect(getShiftQueueSpacingMs({ day: 8, shiftPlan: 'rush' }, 10000)).toBe(10000);
    expect(getShiftQueueSpacingMs({ day: 9, shiftPlan: 'regular' }, 10000)).toBe(10000);
  });

  it('normalizes old and impossible v3 shift plans without changing day one', () => {
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    });
    const first = createInitialState();
    const { shiftPlan: _missing, ...legacy } = first;
    saved.set('tiem-tra-chibi-save-v3', JSON.stringify(legacy));
    expect(loadGame().shiftPlan).toBe('regular');
    saveGame({ ...first, shiftPlan: 'rush' });
    const normalized = loadGame();
    expect(normalized.shiftPlan).toBe('regular');
    expect(normalized.day).toBe(1);
    expect(normalized.cash).toBe(first.cash);
  });

  it('persists a selected rush plan across reload without granting early rewards', () => {
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    });
    const selected = chooseShiftPlan(dayNine(), 'rush');
    saveGame(selected);
    const loaded = loadGame();
    expect(loaded.shiftPlan).toBe('rush');
    expect(loaded.targetOrders).toBe(selected.targetOrders);
    expect(loaded.cash).toBe(selected.cash);
    expect(loaded.phase).toBe('prep');
    expect(startDay({ ...loaded, inventory: { ...loaded.inventory, cupsM: 100, cupsL: 100 } }, 1000).customerQueue[0].joinedAt).toBe(8000);
  });

  it('keeps the rush arrival pressure after saving and reloading an open shift', () => {
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    });
    vi.spyOn(Date, 'now').mockReturnValue(5000);
    const selected = chooseShiftPlan(dayNine(), 'rush');
    const opened = startDay({
      ...selected,
      inventory: { ...selected.inventory, cupsM: 100, cupsL: 100 },
    }, 1000);
    saveGame(opened);
    const resumed = loadGame();
    expect(resumed.phase).toBe('open');
    expect(resumed.shiftPlan).toBe('rush');
    expect(resumed.currentOrder?.id).toBe(opened.currentOrder?.id);
    expect(resumed.currentOrder?.size).toBe(opened.currentOrder?.size);
    expect(resumed.currentOrder?.sugar).toBe(30);
    expect(resumed.customerQueue[0]?.order.ice).toBe(0);
    expect(resumed.customerQueue.map(entry => entry.order.size)).toEqual(opened.customerQueue.map(entry => entry.order.size));
    expect(resumed.customerQueue.map(entry => entry.joinedAt)).toEqual([12000, 19000]);
    expect(resumed.customerQueue.every(entry => !('shiftPlan' in entry))).toBe(true);
    expect(resumed.currentOrderQueuedAt).toBe(5000);
    expect(resumed.served).toBe(0);
    expect(resumed.cash).toBe(opened.cash);
    expect(resumed.inventory).toEqual(opened.inventory);
  });

  it('keeps day one tutorial unchanged', () => {
    const first = createInitialState();
    expect(chooseShiftPlan(first, 'rush')).toBe(first);
    expect(chooseShiftPlan(nextDay(first), 'rush').shiftPlan).toBe('regular');
    expect(targetOrdersFor(1, first.event.demandBonus, 'rush')).toBe(first.targetOrders);
  });

  it('changes the number of playable customer orders only once', () => {
    const normal = dayNine();
    const rush = chooseShiftPlan(normal, 'rush');
    expect(rush.targetOrders).toBe(normal.targetOrders + 2);
    expect(chooseShiftPlan(rush, 'rush').targetOrders).toBe(rush.targetOrders);
    expect(chooseShiftPlan(rush, 'regular').targetOrders).toBe(normal.targetOrders);
    expect(rush.cash).toBe(normal.cash);
  });

  it('warns about a guaranteed cup shortage without guessing recipe inventory', () => {
    const rush = chooseShiftPlan(dayNine(), 'rush');
    const short = { ...rush, inventory: { ...rush.inventory, cupsM: 2, cupsL: 1 } };
    expect(getRushCupShortage(short)).toBe(rush.targetOrders - 3);
    expect(getRushCupShortage({ ...short, inventory: { ...short.inventory, cupsM: rush.targetOrders, cupsL: 0 } })).toBe(getRushCupRequirements(rush).cupsL);
    expect(getRushCupShortage({ ...short, shiftPlan: 'regular' })).toBe(0);
    expect(getRushCupShortage({ ...short, day: 8 })).toBe(0);
  });

  it('uses a predictable alternating M/L mix and never opens with the wrong cup sizes', () => {
    const rush = chooseShiftPlan(dayNine(), 'rush');
    const required = getRushCupRequirements(rush);
    const sizes = Array.from({ length: rush.targetOrders }, (_, index) => getRushOrderSize(rush, index));
    expect(sizes.filter(size => size === 'M')).toHaveLength(required.cupsM);
    expect(sizes.filter(size => size === 'L')).toHaveLength(required.cupsL);
    expect(getRushOrderSize(rush, rush.targetOrders)).toBeNull();
    expect(getRushOrderSize({ ...rush, shiftPlan: 'regular' }, 0)).toBeNull();
    expect(getRushOrderSize({ ...rush, day: 8 }, 0)).toBeNull();
    const wrongSizes = { ...rush, inventory: { ...rush.inventory, cupsM: rush.targetOrders, cupsL: 0 } };
    expect(getRushCupShortageBySize(wrongSizes)).toEqual({ cupsM: 0, cupsL: required.cupsL });
    expect(startDay(wrongSizes).phase).toBe('prep');
    const opened = startDay({ ...wrongSizes, inventory: { ...wrongSizes.inventory, ...required } }, 1000);
    expect(opened.phase).toBe('open');
    expect(opened.currentOrder?.size).toBe(sizes[0]);
    expect(opened.customerQueue.map(entry => entry.order.size)).toEqual(sizes.slice(1, 3));
  });

  it('blocks an impossible rush opening until enough cups are restocked', () => {
    const selected = chooseShiftPlan(dayNine(), 'rush');
    const low = { ...selected, inventory: { ...selected.inventory, cupsM: 0, cupsL: 0 } };
    const blocked = startDay(low);
    expect(blocked.phase).toBe('prep');
    expect(blocked.targetOrders).toBe(selected.targetOrders);
    expect(blocked.inventory).toEqual(low.inventory);
    expect(blocked.notice).toContain('thiếu');
    const required = getRushCupRequirements(blocked);
    const restocked = { ...blocked, inventory: { ...blocked.inventory, ...required } };
    expect(startDay(restocked).phase).toBe('open');
  });

  it('requires restocking before opening and never consumes cups when opening is rejected', () => {
    const selected = chooseShiftPlan(dayNine(), 'rush');
    const empty = { ...selected, inventory: { ...selected.inventory, cupsM: 0, cupsL: 0 } };
    const denied = startDay(empty, 1000);
    expect(denied.phase).toBe('prep');
    expect(denied.inventory).toEqual(empty.inventory);
    expect(denied.currentOrder).toBeNull();
    expect(denied.customerQueue).toEqual([]);
    const stocked = { ...denied, inventory: { ...denied.inventory, cupsM: denied.targetOrders, cupsL: denied.targetOrders } };
    const opened = startDay(stocked, 1000);
    expect(opened.phase).toBe('open');
    expect(opened.currentOrder).not.toBeNull();
    expect(opened.customerQueue).toHaveLength(2);
  });

  it('restocks a blocked rush opening at the real price and preserves the purchase on reload', () => {
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    });
    const selected = chooseShiftPlan(dayNine(), 'rush');
    const empty = { ...selected, cash: 100000,
      inventory: { ...selected.inventory, cupsM: 0, cupsL: 0 } };
    const costM = getRestockPrice(empty, 'cupsM');
    const costL = getRestockPrice(empty, 'cupsL');
    const purchased = restock(restock(empty, 'cupsM'), 'cupsL');
    expect(purchased.cash).toBe(empty.cash - costM - costL);
    expect(purchased.inventory.cupsM).toBe(12);
    expect(purchased.inventory.cupsL).toBe(10);
    expect(empty.inventory.cupsM).toBe(0);
    expect(startDay(purchased, 1000).phase).toBe('open');
    saveGame(purchased);
    const resumed = loadGame();
    expect(resumed.cash).toBe(purchased.cash);
    expect(resumed.inventory.cupsM).toBe(12);
    expect(resumed.inventory.cupsL).toBe(10);
    expect(resumed.shiftPlan).toBe('rush');
    expect(startDay(resumed, 1000).phase).toBe('open');
    const poor = { ...empty, cash: 0 };
    const rejected = restock(poor, 'cupsM');
    expect(rejected.cash).toBe(0);
    expect(rejected.inventory.cupsM).toBe(0);
    expect(chooseShiftPlan(poor, 'regular').targetOrders).toBeLessThan(poor.targetOrders);
  });

  it('counts only complete cups and leaves ordinary shifts unaffected', () => {
    const rush = chooseShiftPlan(dayNine(), 'rush');
    const partial = { ...rush, inventory: { ...rush.inventory, cupsM: 1.9, cupsL: 0.9 } };
    expect(getRushCupShortage(partial)).toBe(rush.targetOrders - 1);
    expect(startDay({ ...partial, shiftPlan: 'regular' }).phase).toBe('open');
  });

  it('locks choice once the shop opens', () => {
    const selected = chooseShiftPlan(dayNine(), 'rush');
    const rush = startDay({ ...selected, inventory: { ...selected.inventory, cupsM: selected.targetOrders, cupsL: selected.targetOrders } }, 1000);
    expect(rush.phase).toBe('open');
    expect(chooseShiftPlan(rush, 'regular')).toBe(rush);
  });

  it('grants the bonus exactly once when the longer shift reaches 80 average', () => {
    const rush = finishDay(chooseShiftPlan(dayNine(), 'rush'));
    const regular = finishDay(dayNine());
    expect(rush.phase).toBe('summary');
    expect(rush.served).toBe(regular.served + 2);
    expect(rush.summary?.averageScore).toBeGreaterThanOrEqual(80);
    expect(rush.summary?.fansGained).toBeGreaterThanOrEqual(regular.summary!.fansGained + 2);
    expect(serveCurrentDrink(rush)).toBe(rush);
  });

  it('keeps rush incentive out of sales revenue while including it in profit and wallet', () => {
    const before = chooseShiftPlan(dayNine(), 'rush');
    const done = finishDay(before);
    expect(done.phase).toBe('summary');
    expect(done.summary?.averageScore).toBeGreaterThanOrEqual(80);
    // Sales figures and revenue achievements track actual drinks, not the
    // promotional shift reward. The reward is other income in profit.
    expect(done.summary?.revenue).toBe(done.dailyRevenue);
    expect(done.stats.revenue).toBe(before.stats.revenue + done.dailyRevenue);
    expect(done.summary?.profit).toBe(done.dailyRevenue - done.dailyCost + 20000);
    expect(done.cash).toBeGreaterThanOrEqual(before.cash + done.dailyRevenue + 20000);
    expect(done.summary?.fansGained).toBe(done.dailyFansGained);
    expect(serveCurrentDrink(done)).toBe(done); // no second payout
  });

  it('requires actual orders and sufficient quality before paying', () => {
    expect(completionBonus('rush', 9, 6, 7, 600)).toEqual({ cash: 0, fans: 0 });
    expect(completionBonus('rush', 9, 7, 7, 7 * 79)).toEqual({ cash: 0, fans: 0 });
    expect(completionBonus('regular', 9, 7, 7, 700)).toEqual({ cash: 0, fans: 0 });
    expect(completionBonus('rush', 9, 7, 7, 560)).toEqual({ cash: 20000, fans: 2 });
    expect(completionBonus('rush', 9, 7, 7, Number.NaN)).toEqual({ cash: 0, fans: 0 });
  });

  it('resets the plan the next morning, preserving wallet and relationships', () => {
    const done = finishDay(chooseShiftPlan(dayNine(), 'rush'));
    const next = nextDay(done);
    expect(next.shiftPlan).toBe('regular');
    expect(next.targetOrders).toBe(targetOrdersFor(next.day, next.event.demandBonus));
    expect(next.cash).toBe(done.cash);
    expect(next.customerBond).toEqual(done.customerBond);
  });
});
