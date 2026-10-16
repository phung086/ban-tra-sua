import { describe, it, expect } from 'vitest';
import {
  computeActiveDecorBonuses,
  createInitialDecorState,
  equipDecorItem,
  purchaseDecorItem,
} from './shopDecorEngine';

describe('shopDecorEngine — Sidewalk Upgrades & Decor Bonuses', () => {
  it('starts with red and blue plastic chairs equipped on Day 1', () => {
    const state = createInitialDecorState();
    expect(state.purchasedItemIds).toContain('red_blue_plastic_chairs');
    expect(state.equippedSlots.sidewalk_seating).toBe('red_blue_plastic_chairs');

    const bonuses = computeActiveDecorBonuses(state);
    expect(bonuses.totalFootfallMultiplier).toBeGreaterThan(1.1);
    expect(bonuses.totalComfortBonus).toBe(6);
  });

  it('validates cash balance and unlocks Hoi An lantern on Day 10', () => {
    const state = createInitialDecorState();

    // Day 8 (before Day 10 unlock): fails
    const tooEarly = purchaseDecorItem(state, 'hoian_silk_lantern', 200000, 8);
    expect(tooEarly.success).toBe(false);
    expect(tooEarly.message).toContain('Ngày 10');

    // Day 10 but not enough money: fails
    const notEnoughCash = purchaseDecorItem(state, 'hoian_silk_lantern', 40000, 10);
    expect(notEnoughCash.success).toBe(false);

    // Day 10 with sufficient cash: succeeds and auto-equips
    const success = purchaseDecorItem(state, 'hoian_silk_lantern', 150000, 10);
    expect(success.success).toBe(true);
    expect(success.state.equippedSlots.entrance_lantern).toBe('hoian_silk_lantern');
    expect(success.remainingCash).toBe(150000 - 95000);
  });

  it('correctly aggregates cumulative footfall and comfort bonuses', () => {
    let state = createInitialDecorState();
    const p1 = purchaseDecorItem(state, 'monstera_ceramic_pots', 100000, 2);
    state = p1.state;

    const bonuses = computeActiveDecorBonuses(state);
    // 12% (plastic chairs) + 10% (monstera pots) = +22%
    expect(bonuses.totalFootfallMultiplier).toBeCloseTo(1.22, 2);
    expect(bonuses.totalComfortBonus).toBe(14);
  });
});
