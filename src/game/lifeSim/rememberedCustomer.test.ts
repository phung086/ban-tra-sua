import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine';
import { hasRememberedLowSugar, greetRememberedCustomer } from './rememberedCustomer';

describe('remembered customer safeguards', () => {
  it('does not invent a preference without explicit consent', () => {
    const state = createInitialState();
    expect(hasRememberedLowSugar(state, 'miu')).toBe(false);
    expect(greetRememberedCustomer(state)).toBe(state);
  });
});
