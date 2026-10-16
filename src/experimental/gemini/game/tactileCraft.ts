export type CraftPrecisionGrade = 'perfect' | 'good' | 'miss';

export interface CraftGaugeFeedback {
  grade: CraftPrecisionGrade;
  distance: number;
  badgeText: string;
  coachingHint: string;
  qualityBonus: number;
  pulseKind: 'success' | 'tap' | 'warn';
}

export interface HoldMilestoneState {
  progress: number;
  percent: number;
  stageIndex: 0 | 1 | 2 | 3;
  stageLabel: string;
  shouldPulse: boolean;
}

/**
 * Evaluates needle distance against target and tolerance, returning immediate
 * player-facing Vietnamese tactile cues and quality bonus.
 */
export function evaluateCraftGauge(
  needle: number,
  target: number,
  tolerance = 6,
): CraftGaugeFeedback {
  const clampedNeedle = Math.max(0, Math.min(100, needle));
  const clampedTarget = Math.max(0, Math.min(100, target));
  const distance = Math.abs(clampedNeedle - clampedTarget);

  if (distance <= tolerance) {
    return {
      grade: 'perfect',
      distance,
      badgeText: 'Chuẩn vị phố cổ ✨',
      coachingHint: 'Độ ngọt và đá vừa khít gu khách!',
      qualityBonus: 15,
      pulseKind: 'success',
    };
  }

  if (distance <= tolerance * 2) {
    const dirHint = clampedNeedle < clampedTarget ? 'hơi non tay' : 'hơi quá tay';
    return {
      grade: 'good',
      distance,
      badgeText: 'Khá ổn 👍',
      coachingHint: `Mức căn chỉnh ${dirHint}, khách vẫn hài lòng.`,
      qualityBonus: 6,
      pulseKind: 'tap',
    };
  }

  const fixHint =
    clampedNeedle < clampedTarget
      ? 'Bấm sớm hơn tâm xanh — lần sau chờ kim tới vùng sáng.'
      : 'Bấm trễ nhịp — có thể chỉnh lại trước khi dập nắp.';
  return {
    grade: 'miss',
    distance,
    badgeText: 'Lệch nhịp ⚠️',
    coachingHint: fixHint,
    qualityBonus: -8,
    pulseKind: 'warn',
  };
}

/**
 * Computes progressive tactile feedback milestones during press-and-hold tasks
 * (pouring, shaking, sealing) so the action feels physical rather than a static timer.
 */
export function computeHoldMilestone(
  elapsedMs: number,
  durationMs = 1300,
  previousStageIndex = 0,
): HoldMilestoneState {
  const safeDuration = Math.max(100, durationMs);
  const progress = Math.max(0, Math.min(1, elapsedMs / safeDuration));
  const percent = Math.round(progress * 100);

  let stageIndex: 0 | 1 | 2 | 3 = 0;
  let stageLabel = 'Chạm và giữ để thao tác';

  if (progress >= 1) {
    stageIndex = 3;
    stageLabel = 'Hoàn tất chuẩn chỉnh! ✨';
  } else if (progress >= 0.7) {
    stageIndex = 2;
    stageLabel = 'Sắp đạt độ sánh chuẩn — giữ thêm chút nữa...';
  } else if (progress >= 0.35) {
    stageIndex = 1;
    stageLabel = 'Đang đều tay — hương trà đang dậy mùi...';
  } else if (progress > 0) {
    stageIndex = 0;
    stageLabel = 'Bắt đầu thao tác... giữ nguyên tay nhé';
  }

  const shouldPulse = stageIndex > previousStageIndex && stageIndex > 0;

  return {
    progress,
    percent,
    stageIndex,
    stageLabel,
    shouldPulse,
  };
}
