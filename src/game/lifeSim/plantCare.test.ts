import { describe, expect, it } from 'vitest';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, choosePlantCare, createMorning, hydrateMorning, wakeMorning } from './morning';

function ready() {
  const game = createInitialState();
  game.morning = createMorning({ day: game.day, city: game.city }, 'plant-care-seed');
  return chooseBreakfast(wakeMorning(game), 'skip');
}
describe('playable morning plant care and bác Bình memory', () => {
  it('waters once and updates time, energy and goodwill without cash cost', () => {
    const before = ready();
    const after = choosePlantCare(before, 'water');
    expect(after.morning.plantCare).toBe('water');
    expect(after.city.minutes).toBe(before.city.minutes + 6);
    expect(after.city.energy).toBe(before.city.energy - 3);
    expect(after.city.goodwill).toBe(before.city.goodwill + 1);
    expect(after.cash).toBe(before.cash);
    expect(after.city.journal[0]).toContain('Tưới cây');
    expect(choosePlantCare(after, 'ask-binh')).toBe(after);
  });
  it('has a zero-energy alternative and does not block shop opening', () => {
    const before = ready();
    const tired = { ...before, city: { ...before.city, energy: 0 } };
    const blocked = choosePlantCare(tired, 'water');
    expect(blocked.morning.plantCare).toBeNull();
    const asked = choosePlantCare(blocked, 'ask-binh');
    expect(asked.morning.plantCare).toBe('ask-binh');
    expect(asked.city.energy).toBe(0);
    expect(startDay(asked).phase).toBe('open');
  });
  it('retains NPC memory next day while resetting daily action', () => {
    const watered = choosePlantCare(ready(), 'water');
    const tomorrow = nextDay(watered);
    expect(tomorrow.morning.lastPlantCare).toBe('water');
    expect(tomorrow.morning.plantCare).toBeNull();
    expect(tomorrow.morning.worldSeed).toBe(watered.morning.worldSeed);
  });
  it('hydrates current and legacy v3 saves safely', () => {
    const done = choosePlantCare(ready(), 'ask-binh');
    const saved = JSON.parse(JSON.stringify(done.morning));
    const restored = hydrateMorning(saved, {day:done.day,city:done.city}, 'prep');
    expect(restored.plantCare).toBe('ask-binh');
    expect(choosePlantCare({...done,morning:restored},'water')).toMatchObject({cash:done.cash,morning:{plantCare:'ask-binh'}});
    delete saved.plantCare;
    delete saved.lastPlantCare;
    expect(hydrateMorning(saved,{day:done.day,city:done.city},'prep').plantCare).toBeNull();
    saved.plantCare='invalid';
    expect(hydrateMorning(saved,{day:done.day,city:done.city},'prep').plantCare).toBeNull();
  });
  it('cannot care for plants before breakfast or during a shift', () => {
    const fresh=createInitialState();
    expect(choosePlantCare(fresh,'water')).toBe(fresh);
    const opened=startDay(ready());
    expect(choosePlantCare(opened,'water')).toBe(opened);
  });
});
