import { describe, it, expect } from 'vitest';
import {
  awardCraftingXp,
  computeCraftingPerks,
  createInitialMasteryState,
  upgradeMasterySkill,
} from './brewingMasteryEngine';

describe('brewingMasteryEngine — Skills Progression & Hanoi Recipes', () => {
  it('starts at apprentice tier with Jasmine tea unlocked and 1 starter skill point', () => {
    const state = createInitialMasteryState();
    expect(state.tier).toBe('apprentice');
    expect(state.skillPoints).toBe(1);
    expect(state.unlockedRecipeIds).toContain('tra_lai_ha_thanh');
    expect(state.unlockedRecipeIds).not.toContain('tra_sen_tay_ho');
  });

  it('levels up to journeyman and unlocks Tay Ho lotus tea after earning enough XP', () => {
    let state = createInitialMasteryState();
    const result = awardCraftingXp(state, 95, true); // 19 base + 8 perfect + 6 fast = +33 XP

    expect(result.earnedXp).toBe(33);
    state = result.state;

    // Second good brew brings total to >= 60 XP
    const result2 = awardCraftingXp(state, 92, true);
    state = result2.state;

    expect(state.currentXp).toBeGreaterThanOrEqual(60);
    expect(state.tier).toBe('journeyman');
    expect(state.unlockedRecipeIds).toContain('tra_sen_tay_ho');
  });

  it('spends skill points to upgrade Steady Pour and expands crafting perks', () => {
    let state = createInitialMasteryState();
    const initialPerks = computeCraftingPerks(state);
    expect(initialPerks.pourToleranceMultiplier).toBe(1.0);

    const upgrade = upgradeMasterySkill(state, 'steady_pour');
    expect(upgrade.success).toBe(true);
    expect(upgrade.state.skillPoints).toBe(0);

    const nextPerks = computeCraftingPerks(upgrade.state);
    expect(nextPerks.pourToleranceMultiplier).toBeCloseTo(1.15, 2);
  });
});
