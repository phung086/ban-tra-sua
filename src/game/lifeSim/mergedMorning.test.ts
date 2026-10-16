import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { loadGame, saveGame } from '../storage';
import {
  callFather, chooseBreakfast, chooseLanMeal, chooseMotherCall, choosePlantCare,
  cookMarketMeal, prepareLunch, visitMorningMarket as buyVegetables, wakeMorning,
} from './morning';
import { visitMorningMarket as buyFruit } from './marketEncounter';

afterEach(() => vi.unstubAllGlobals());
const ready = () => chooseBreakfast(wakeMorning(createInitialState()), 'street');

describe('independent branch features share one daily save', () => {
  it('persists family, friend, lunch, plant and cooking decisions together without replaying costs', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    let game = callFather(ready(), 'promise');
    game = chooseMotherCall(game, 'photo');
    game = chooseLanMeal(game, 'walk');
    game = prepareLunch(game, 'lunchbox');
    game = choosePlantCare(game, 'water');
    game = cookMarketMeal(buyVegetables(game, 'basket'));
    saveGame(game);
    const restored = loadGame();
    expect(restored.morning).toEqual(game.morning);
    expect(restored.cash).toBe(172000);
    expect(restored.city.stories.bonds).toEqual(game.city.stories.bonds);
    expect(callFather(restored, 'listen')).toBe(restored);
    expect(chooseMotherCall(restored, 'listen')).toBe(restored);
    expect(chooseLanMeal(restored, 'treat')).toBe(restored);
    expect(prepareLunch(restored, 'lunchbox')).toBe(restored);
    expect(choosePlantCare(restored, 'water')).toBe(restored);
    expect(buyFruit(restored, 'fruit')).toBe(restored);
    expect(buyVegetables(restored, 'basket')).toBe(restored);
    expect(cookMarketMeal(restored)).toBe(restored);
    expect(startDay(restored, 1000).phase).toBe('open');
    const tomorrow = nextDay(restored);
    expect(tomorrow.morning).toMatchObject({
      step: 'asleep', fatherCall: null, motherCall: null, lanMeal: null,
      lunchPrep: null, plantCare: null, lastPlantCare: 'water',
      marketVisit: null, homeCooked: false,
    });
    expect(tomorrow.city.stories.bonds.lan).toBe(game.city.stories.bonds.lan);
    expect(tomorrow.relationshipRewardIds).toContain('family-father-quang-sign');
  });

  it.each(['fruit', 'chat', 'leave'] as const)('blocks a second market entry after %s', choice => {
    const visited = buyFruit(ready(), choice);
    expect(buyVegetables(visited, 'basket')).toBe(visited);
    expect(buyVegetables(visited, 'chat')).toBe(visited);
    expect(cookMarketMeal(visited)).toBe(visited);
  });

  it('blocks fruit and conversation after buying vegetables', () => {
    const vegetables = buyVegetables(ready(), 'basket');
    expect(buyFruit(vegetables, 'fruit')).toBe(vegetables);
    expect(buyFruit(vegetables, 'chat')).toBe(vegetables);
  });
});
