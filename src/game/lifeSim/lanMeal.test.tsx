import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState, nextDay, startDay } from '../engine';
import { hydrateCity } from '../city';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { chooseBreakfast, chooseLanMeal, hydrateMorning, LAN_MEAL_OPTIONS, wakeMorning } from './morning';

const ready = () => chooseBreakfast(wakeMorning(createInitialState()), 'skip');

describe('playable invitation from Lan', () => {
  it('splits the bill once and persists cash, clock, satiety, and Lan bond', () => {
    const initial = ready();
    const paid = chooseLanMeal(initial, 'split');
    expect(paid.cash).toBe(initial.cash - LAN_MEAL_OPTIONS.split.cost);
    expect(paid.city.minutes).toBe(Math.min(1260, initial.city.minutes + 40));
    expect(paid.morning.satiety).toBe(initial.morning.satiety + 20);
    expect(paid.city.stories.bonds.lan).toBe((initial.city.stories.bonds.lan ?? 0) + 2);
    expect(paid.city.journal[0]).toContain('Chia đôi');
    expect(chooseLanMeal(paid, 'treat')).toBe(paid);
    expect(chooseLanMeal(paid, 'split')).toBe(paid);
  });

  it('shows the cost before accepting a treat and provides a free fallback', () => {
    const poor = { ...ready(), cash: 60000 };
    const blocked = chooseLanMeal(poor, 'treat');
    expect(blocked.cash).toBe(60000);
    expect(blocked.morning.lanMeal).toBeNull();
    const skipped = chooseLanMeal(blocked, 'decline');
    expect(skipped.cash).toBe(60000);
    expect(skipped.morning.lanMeal).toBe('decline');
    const markup = renderToStaticMarkup(<MorningRoutine game={poor} onGame={()=>{}} />);
    expect(markup).toContain('Chưa đủ tiền');
    expect(markup).toContain('Hẹn Lan hôm khác');
  });

  it('lets Lan and the player take a free walk, remembers it after reload, and does not charge twice', () => {
    const initial = ready();
    const walked = chooseLanMeal(initial, 'walk');
    expect(walked.cash).toBe(initial.cash);
    expect(walked.city.minutes).toBe(initial.city.minutes + 15);
    expect(walked.morning.satiety).toBe(initial.morning.satiety);
    expect(walked.city.stories.bonds.lan).toBe((initial.city.stories.bonds.lan ?? 0) + 1);
    expect(walked.notice).toContain('Đi dạo');
    const persisted = JSON.parse(JSON.stringify(walked));
    const morning = hydrateMorning(persisted.morning, {day:walked.day, city:walked.city}, walked.phase);
    expect(morning.lanMeal).toBe('walk');
    const restored = {...walked, morning};
    expect(chooseLanMeal(restored, 'walk')).toBe(restored);
    expect(renderToStaticMarkup(<MorningRoutine game={restored} onGame={()=>{}} />)).toContain('Đi dạo');
  });

  it('keeps the decision and NPC relationship after v3 save hydration', () => {
    const paid = chooseLanMeal(ready(), 'treat');
    const persisted = JSON.parse(JSON.stringify(paid));
    const city = hydrateCity(persisted.city, paid.day);
    const morning = hydrateMorning(persisted.morning, { day:paid.day, city }, paid.phase);
    const restored = { ...paid, city, morning };
    expect(morning.lanMeal).toBe('treat');
    expect(city.stories.bonds.lan).toBe(3);
    expect(chooseLanMeal(restored, 'split')).toBe(restored);
    expect(renderToStaticMarkup(<MorningRoutine game={restored} onGame={()=>{}} />)).toContain('Cảm ơn bạn đã mời');
  });

  it('hydrates pre-feature saves and resets only on the next day', () => {
    const old = ready();
    const morning = { ...old.morning };
    delete morning.lanMeal;
    expect(hydrateMorning(morning,{day:old.day,city:old.city},'prep').lanMeal).toBeNull();
    const paid = chooseLanMeal(old, 'split');
    const tomorrow = nextDay(paid);
    expect(tomorrow.morning.lanMeal).toBeNull();
    expect(tomorrow.city.stories.bonds.lan).toBe(2);
    const opened = startDay(old);
    expect(chooseLanMeal(opened,'split')).toBe(opened);
  });

  it('NPC remembers the relationship after multiple days', () => {
    const first = chooseLanMeal(ready(), 'split');
    const next = nextDay(first);
    const second = chooseLanMeal(chooseBreakfast(wakeMorning(next),'skip'),'split');
    expect(second.city.stories.bonds.lan).toBe(4);
    expect(second.notice).toContain('Lại đi ăn cùng nhau');
  });
});
