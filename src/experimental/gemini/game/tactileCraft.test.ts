import { describe, it, expect } from 'vitest';
import { computeHoldMilestone, evaluateCraftGauge } from './tactileCraft';

describe('tactileCraft feedback mechanics', () => {
  it('grades gauge needle distance into perfect, good, and miss with Vietnamese coaching hints', () => {
    const perfect = evaluateCraftGauge(52, 50, 6);
    expect(perfect.grade).toBe('perfect');
    expect(perfect.qualityBonus).toBeGreaterThan(10);
    expect(perfect.pulseKind).toBe('success');

    const good = evaluateCraftGauge(60, 50, 6);
    expect(good.grade).toBe('good');
    expect(good.qualityBonus).toBeGreaterThan(0);

    const miss = evaluateCraftGauge(80, 50, 6);
    expect(miss.grade).toBe('miss');
    expect(miss.qualityBonus).toBeLessThan(0);
    expect(miss.coachingHint.length).toBeGreaterThan(10);
  });

  it('emits progressive hold milestones at 35%, 70%, and 100%', () => {
    const start = computeHoldMilestone(100, 1300, 0);
    expect(start.stageIndex).toBe(0);
    expect(start.shouldPulse).toBe(false);

    const stage1 = computeHoldMilestone(500, 1300, 0);
    expect(stage1.stageIndex).toBe(1);
    expect(stage1.shouldPulse).toBe(true);

    const stage2 = computeHoldMilestone(950, 1300, 1);
    expect(stage2.stageIndex).toBe(2);
    expect(stage2.shouldPulse).toBe(true);

    const complete = computeHoldMilestone(1300, 1300, 2);
    expect(complete.progress).toBe(1);
    expect(complete.stageIndex).toBe(3);
    expect(complete.shouldPulse).toBe(true);
  });
});
