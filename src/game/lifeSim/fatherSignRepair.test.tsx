import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState, nextDay } from '../engine';
import { hydrateCity } from '../city';
import { callFather, chooseBreakfast, hydrateMorning, wakeMorning } from './morning';
import { FatherSignRepairPanel } from '../../components/life/FatherSignRepairPanel';
import {
  canChooseFatherSign, chooseFatherSign, getFatherSignCallback,
  getFatherSignChoice, isFatherSignDue,
} from './fatherSignRepair';
import type { GameState } from '../types';

function weekend(promised = true): GameState {
  let game = chooseBreakfast(wakeMorning(createInitialState()), 'skip');
  if (promised) game = callFather(game, 'promise');
  for (let day = 2; day <= 7; day++) {
    game = nextDay({ ...game, phase: 'summary', closingCareChoice: 'skip' });
  }
  return chooseBreakfast(wakeMorning(game), 'skip');
}

function reload(game: GameState): GameState {
  const saved = JSON.parse(JSON.stringify(game)) as GameState;
  const city = hydrateCity(saved.city, saved.day);
  const morning = hydrateMorning(saved.morning, { day: saved.day, city }, saved.phase);
  return { ...saved, city, morning };
}

describe('father Quang sign promise follow-through', () => {
  it('only appears on a weekend after the actual father call promise', () => {
    const unpromised = weekend(false);
    expect(isFatherSignDue(unpromised)).toBe(false);
    const promised = weekend();
    expect(promised.day).toBe(7);
    expect(isFatherSignDue(promised)).toBe(true);
    const html = renderToStaticMarkup(<FatherSignRepairPanel game={promised} onGame={() => {}} />);
    expect(html).toContain('Lời hẹn với bố Quang');
    expect(html).toContain('Cùng bố thay ốc');
    expect(html).toContain('Báo bố hẹn cuối tuần sau');
    expect(isFatherSignDue({ ...promised, phase: 'open' })).toBe(false);
  });

  it('charges actual cash/time/energy, rewards bond and fans, never double charges after reload', () => {
    const start = weekend();
    const fixed = chooseFatherSign(start, 'repair');
    expect(fixed.cash).toBe(start.cash - 12000);
    expect(fixed.city.minutes).toBe(start.city.minutes + 25);
    expect(fixed.city.energy).toBe(start.city.energy - 4);
    expect(fixed.customerBond['family-father-quang']).toBe((start.customerBond['family-father-quang'] ?? 0) + 3);
    expect(fixed.fans).toBe(start.fans + 2);
    expect(fixed.relationshipRewardIds).toContain('family-father-quang-sign:completed');
    expect(getFatherSignChoice(fixed)).toBe('repair');
    const restored = reload(fixed);
    expect(chooseFatherSign(restored, 'repair')).toBe(restored);
    expect(chooseFatherSign(restored, 'clean')).toBe(restored);
    expect(restored.cash).toBe(fixed.cash);
    expect(renderToStaticMarkup(<FatherSignRepairPanel game={restored} onGame={() => {}} />)).toContain('Đã lưu lựa chọn');
  });

  it('offers a free clean-up when cash is zero and a no-cost postponement when exhausted', () => {
    const start = weekend();
    const noCash = { ...start, cash: 0 };
    expect(canChooseFatherSign(noCash, 'repair')).toBe(false);
    expect(canChooseFatherSign(noCash, 'clean')).toBe(true);
    const cleaned = chooseFatherSign(noCash, 'clean');
    expect(cleaned.cash).toBe(0);
    expect(cleaned.fans).toBe(noCash.fans + 1);
    expect(cleaned.relationshipRewardIds).toContain('family-father-quang-sign:completed');
    const exhausted = { ...start, cash: 0, city: { ...start.city, energy: 0, minutes: 1260 } };
    expect(canChooseFatherSign(exhausted, 'repair')).toBe(false);
    expect(canChooseFatherSign(exhausted, 'clean')).toBe(false);
    expect(canChooseFatherSign(exhausted, 'postpone')).toBe(true);
    const deferred = chooseFatherSign(exhausted, 'postpone');
    expect(deferred.cash).toBe(0);
    expect(deferred.city.minutes).toBe(1260);
    expect(deferred.city.energy).toBe(0);
    expect(deferred.relationshipRewardIds).not.toContain('family-father-quang-sign:completed');
  });

  it('persists next-day callback after sleep, with no repeated repair on the next weekend', () => {
    const fixed = chooseFatherSign(weekend(), 'clean');
    const day8 = nextDay({ ...fixed, phase: 'summary', closingCareChoice: 'skip' });
    expect(getFatherSignCallback(day8)).toBeNull();
    const awake = wakeMorning(day8);
    expect(getFatherSignCallback(awake)).toContain('Biển hiệu sạch');
    expect(getFatherSignCallback(reload(awake))).toContain('Biển hiệu sạch');
    let next = awake;
    for (let day = 9; day <= 14; day++)
      next = nextDay({ ...next, phase: 'summary', closingCareChoice: 'skip' });
    next = chooseBreakfast(wakeMorning(next), 'skip');
    expect(isFatherSignDue(next)).toBe(false);
  });

  it('can postpone and return the following weekend without creating a forced debt', () => {
    const deferred = chooseFatherSign(weekend(), 'postpone');
    const day8 = wakeMorning(nextDay({ ...deferred, phase: 'summary', closingCareChoice: 'skip' }));
    expect(getFatherSignCallback(day8)).toContain('Cuối tuần sau');
    let next = day8;
    for (let day = 9; day <= 14; day++)
      next = nextDay({ ...next, phase: 'summary', closingCareChoice: 'skip' });
    next = chooseBreakfast(wakeMorning(next), 'skip');
    expect(isFatherSignDue(next)).toBe(true);
    expect(canChooseFatherSign(next, 'clean')).toBe(true);
    expect(getFatherSignChoice(next)).toBeNull();
  });

  it('rejects invalid phases, repeat clicks and invalid choices', () => {
    const start = weekend();
    expect(chooseFatherSign({ ...start, phase: 'open' }, 'repair').cash).toBe(start.cash);
    expect(chooseFatherSign(start, 'unknown' as 'repair')).toBe(start);
    const chosen = chooseFatherSign(start, 'postpone');
    expect(chooseFatherSign(chosen, 'repair')).toBe(chosen);
  });
});
