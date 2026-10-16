import { describe, it, expect } from 'vitest';
import {
  claimQuestReward,
  createInitialNotebookState,
  recordServedDrink,
} from './customerNotebook';

describe('customerNotebook — Customer Preferences, Quests & Reputation', () => {
  it('initializes records for all 14 canonical NPCs with hidden preferences', () => {
    const state = createInitialNotebookState();
    expect(Object.keys(state.records)).toHaveLength(14);
    expect(state.records.linh.discovered.sweetness).toBe(false);
    expect(state.milestones).toHaveLength(3);
    expect(state.dailyQuests).toHaveLength(3);
  });

  it('reveals sweetness and unlocks personal note when serving Linh correctly', () => {
    let state = createInitialNotebookState();
    state = recordServedDrink(state, {
      npcId: 'linh',
      actualSweetness: 30,
      actualIce: 50,
      actualTopping: 'jelly',
      qualityScore: 92,
    });

    const linhRec = state.records.linh;
    expect(linhRec.timesServed).toBe(1);
    expect(linhRec.discovered.sweetness).toBe(true);
    expect(linhRec.discovered.ice).toBe(true);
    expect(linhRec.discovered.favoriteTopping).toBe(true);
    expect(linhRec.unlockedNoteText).toContain('30% đường');
  });

  it('tracks neighborhood quest progress and grants cash reward upon claiming', () => {
    let state = createInitialNotebookState();
    state = recordServedDrink(state, {
      npcId: 'linh',
      actualSweetness: 30,
      actualIce: 50,
      actualTopping: 'jelly',
      qualityScore: 88,
    });

    const quest = state.dailyQuests.find((q) => q.targetNpcId === 'linh');
    expect(quest?.isCompleted).toBe(true);
    expect(quest?.isClaimed).toBe(false);

    const { state: nextState, cashReward } = claimQuestReward(state, quest!.id);
    expect(cashReward).toBe(15000);
    expect(nextState.reputationPoints).toBe(12);
    expect(nextState.dailyQuests.find((q) => q.id === quest!.id)?.isClaimed).toBe(true);
  });
});
