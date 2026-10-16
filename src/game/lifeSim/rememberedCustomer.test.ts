import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine';
import {
  hasRememberedLowSugar, greetRememberedCustomer,
  canGreetRememberedCustomer, canKeepRememberedPreferencePrivate,
  getRememberedGreetingChoice, keepRememberedPreferencePrivate,
} from './rememberedCustomer';

function returningCustomer() {
  const start = createInitialState();
  return {
    ...start, day: 2, phase: 'open' as const,
    city: { ...start.city, day: 2, minutes: 850, energy: 50 },
    reviews: [{
      id: 'return-1', customerId: 'miu', customerName: 'Miu',
      day: 1, stars: 2, score: 45, text: 'Trà hơi ngọt',
      replyStyle: 'sweet' as const, replyText: 'Mình xin ghi nhận nhé!',
    }],
    relationshipRewardIds: ['review-care:return-1:1:message', 'review-followup:return-1:remember'],
    currentOrder: {
      id: 'return-order', customerId: 'miu', size: 'M' as const,
      base: 'classic-milk-tea' as const, sugar: 25, ice: 50,
      topping: 'none' as const, targetFill: 80, targetShake: 60, price: 20000,
    },
  };
}

describe('remembered customer safeguards', () => {
  it('does not invent a preference without explicit consent', () => {
    const state = createInitialState();
    expect(hasRememberedLowSugar(state, 'miu')).toBe(false);
    expect(greetRememberedCustomer(state)).toBe(state);
  });

  it('offers discreet service with no cost or reward and prevents double greeting', () => {
    const state = returningCustomer();
    expect(canKeepRememberedPreferencePrivate(state)).toBe(true);
    const quiet = keepRememberedPreferencePrivate(state);
    expect(getRememberedGreetingChoice(quiet)).toBe('quiet');
    expect(quiet.relationshipRewardIds).toContain('remembered-quiet:return-order');
    expect(quiet.cash).toBe(state.cash);
    expect(quiet.city.minutes).toBe(state.city.minutes);
    expect(quiet.city.energy).toBe(state.city.energy);
    expect(quiet.customerBond).toEqual(state.customerBond);
    expect(quiet.currentOrder).toEqual(state.currentOrder);
    expect(keepRememberedPreferencePrivate(quiet)).toBe(quiet);
    expect(greetRememberedCustomer(quiet)).toBe(quiet);
  });

  it('lets tired players choose privacy even when greeting is unavailable', () => {
    const start = returningCustomer();
    const tired = { ...start, city: { ...start.city, minutes: 1260, energy: 0 } };
    expect(canGreetRememberedCustomer(tired)).toBe(false);
    expect(canKeepRememberedPreferencePrivate(tired)).toBe(true);
    const quiet = keepRememberedPreferencePrivate(tired);
    expect(quiet.city.minutes).toBe(1260);
    expect(quiet.city.energy).toBe(0);
    expect(getRememberedGreetingChoice(quiet)).toBe('quiet');
  });
});
