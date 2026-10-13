import { describe, it, expect } from 'vitest';
import { createInitialState } from '../engine';

describe('friend invitation', () => {
  it('starts with no surprise bill', () => {
    const game = createInitialState();
    expect(game.cash).toBeGreaterThanOrEqual(0);
  });
});
