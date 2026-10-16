export type MasterySkillId =
  | 'steady_pour'
  | 'sweetness_reflex'
  | 'rhythmic_shaker'
  | 'quick_sealer';

export type MasteryTierId = 'apprentice' | 'journeyman' | 'master_artisan';

export interface MasterySkill {
  id: MasterySkillId;
  name: string;
  category: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  costSkillPoints: number;
  effectDescription: string;
}

export interface HanoiSpecialtyRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  basePrice: number;
  unlockedAtTier: MasteryTierId;
  tasteNote: string;
}

export const HANOI_SPECIALTY_RECIPES: HanoiSpecialtyRecipe[] = [
  {
    id: 'tra_sen_tay_ho',
    name: 'Trà Sen Tây Hồ Thượng Hạng',
    description: 'Trà xanh Tân Cương ướp cùng gạo sen bách diệp hồ Tây, hương thơm thuần khiết.',
    ingredients: ['green_tea', 'lotus_seed', 'sugar_50'],
    basePrice: 55000,
    unlockedAtTier: 'journeyman',
    tasteNote: 'Vị chát dịu đầu lưỡi, ngọt hậu thanh tao khó quên, các bác lớn tuổi rất trân quý.',
  },
  {
    id: 'tra_lai_ha_thanh',
    name: 'Trà Lài Hà Thành Ướp Mộc',
    description: 'Hoa nhài hàm tiếu hái lúc sẩm tối ướp mộc hương truyền thống, hương thơm đằm thắm.',
    ingredients: ['green_tea', 'jasmine_flower', 'sugar_50'],
    basePrice: 48000,
    unlockedAtTier: 'apprentice',
    tasteNote: 'Hương thơm lan tỏa khắp khoang miệng, giải nhiệt và thư giãn tinh thần.',
  },
  {
    id: 'tra_dao_cam_sa_pho_nho',
    name: 'Trà Đào Cam Sả Phố Nhỏ',
    description: 'Nền hồng trà ủ đậm đà kết hợp lát đào giòn ngọt và tinh dầu cam sả tươi ấm nồng.',
    ingredients: ['black_tea', 'peach_slices', 'lemongrass', 'sugar_50'],
    basePrice: 52000,
    unlockedAtTier: 'journeyman',
    tasteNote: 'Vị chua ngọt bùng nổ, thơm nồng sả tươi, thức uống yêu thích của giới trẻ.',
  },
];

export interface BrewingMasteryState {
  currentXp: number;
  skillPoints: number;
  tier: MasteryTierId;
  skills: Record<MasterySkillId, MasterySkill>;
  unlockedRecipeIds: string[];
}

export function createInitialMasteryState(): BrewingMasteryState {
  return {
    currentXp: 0,
    skillPoints: 1, // Start with 1 skill point for first choice
    tier: 'apprentice',
    skills: {
      steady_pour: {
        id: 'steady_pour',
        name: 'Tay Rót Vững Vàng',
        category: 'Rót trà',
        description: 'Mở rộng biên độ dung sai rót trà, chống tràn ly khi thao tác nhanh.',
        maxLevel: 3,
        currentLevel: 0,
        costSkillPoints: 1,
        effectDescription: 'Dung sai định lượng rót nước +15% mỗi cấp',
      },
      sweetness_reflex: {
        id: 'sweetness_reflex',
        name: 'Căn Ngọt Theo Phản Xạ',
        category: 'Định lượng',
        description: 'Mở rộng vùng canh kim chuẩn vị "Chuẩn vị phố cổ" trên thước đo.',
        maxLevel: 3,
        currentLevel: 0,
        costSkillPoints: 1,
        effectDescription: 'Vùng kim Perfect rộng thêm +25% mỗi cấp',
      },
      rhythmic_shaker: {
        id: 'rhythmic_shaker',
        name: 'Lắc Bình Điêu Luyện',
        category: 'Lắc bình',
        description: 'Thao tác lắc bình shaker nhanh và đều tay hơn, giảm thời gian nhấn giữ.',
        maxLevel: 3,
        currentLevel: 0,
        costSkillPoints: 1,
        effectDescription: 'Thời gian hoàn tất lắc bình giảm -150ms mỗi cấp',
      },
      quick_sealer: {
        id: 'quick_sealer',
        name: 'Dập Nắp Dứt Khoát',
        category: 'Hoàn tất',
        description: 'Động tác dập nắp ly gọn gàng, tăng tốc độ phục vụ giờ cao điểm.',
        maxLevel: 3,
        currentLevel: 0,
        costSkillPoints: 1,
        effectDescription: 'Tốc độ hoàn tất ly nước +20% mỗi cấp',
      },
    },
    unlockedRecipeIds: ['tra_lai_ha_thanh'],
  };
}

export function computeTier(xp: number): MasteryTierId {
  if (xp >= 160) return 'master_artisan';
  if (xp >= 60) return 'journeyman';
  return 'apprentice';
}

/**
 * Awards crafting XP based on quality score and speed.
 */
export function awardCraftingXp(
  state: BrewingMasteryState,
  qualityScore: number,
  isFastService = false,
): { state: BrewingMasteryState; earnedXp: number; leveledUp: boolean } {
  let earnedXp = Math.round(qualityScore * 0.2); // Base 15-20 XP for good tea
  if (qualityScore >= 90) earnedXp += 8; // Perfect bonus
  if (isFastService) earnedXp += 6; // Speed bonus

  const nextXp = state.currentXp + earnedXp;
  const prevTier = state.tier;
  const nextTier = computeTier(nextXp);
  const leveledUp = nextTier !== prevTier;

  // Award skill points on tier upgrade
  const addedSp = leveledUp ? 2 : Math.floor(nextXp / 50) - Math.floor(state.currentXp / 50);
  const nextSkillPoints = state.skillPoints + Math.max(0, addedSp);

  // Auto-unlock specialty recipes matching current tier
  const eligibleRecipes = HANOI_SPECIALTY_RECIPES.filter((r) => {
    if (r.unlockedAtTier === 'apprentice') return true;
    if (r.unlockedAtTier === 'journeyman') return nextTier === 'journeyman' || nextTier === 'master_artisan';
    return nextTier === 'master_artisan';
  }).map((r) => r.id);

  const nextUnlocked = Array.from(new Set([...state.unlockedRecipeIds, ...eligibleRecipes]));

  return {
    state: {
      ...state,
      currentXp: nextXp,
      skillPoints: nextSkillPoints,
      tier: nextTier,
      unlockedRecipeIds: nextUnlocked,
    },
    earnedXp,
    leveledUp,
  };
}

/**
 * Unlocks or levels up a brewing mastery skill.
 */
export function upgradeMasterySkill(
  state: BrewingMasteryState,
  skillId: MasterySkillId,
): { success: boolean; state: BrewingMasteryState; message: string } {
  const skill = state.skills[skillId];
  if (!skill) {
    return { success: false, state, message: 'Kỹ năng không tồn tại.' };
  }

  if (skill.currentLevel >= skill.maxLevel) {
    return { success: false, state, message: 'Kỹ năng đã đạt cấp tối đa.' };
  }

  if (state.skillPoints < skill.costSkillPoints) {
    return { success: false, state, message: 'Chưa đủ điểm kỹ năng để nâng cấp.' };
  }

  const nextSkill: MasterySkill = {
    ...skill,
    currentLevel: skill.currentLevel + 1,
  };

  return {
    success: true,
    state: {
      ...state,
      skillPoints: state.skillPoints - skill.costSkillPoints,
      skills: {
        ...state.skills,
        [skillId]: nextSkill,
      },
    },
    message: `Đã nâng cấp ${skill.name} lên Cấp ${nextSkill.currentLevel}!`,
  };
}

export interface ActiveCraftingPerks {
  pourToleranceMultiplier: number; // e.g. 1.0 to 1.45
  gaugeTargetToleranceAdd: number; // e.g. +0 to +4.5
  shakerDurationMs: number; // e.g. 1300ms down to 850ms
  sealerSpeedBonusRatio: number; // e.g. 1.0 to 1.6
}

export function computeCraftingPerks(state: BrewingMasteryState): ActiveCraftingPerks {
  const pourLvl = state.skills.steady_pour.currentLevel;
  const sweetLvl = state.skills.sweetness_reflex.currentLevel;
  const shakeLvl = state.skills.rhythmic_shaker.currentLevel;
  const sealLvl = state.skills.quick_sealer.currentLevel;

  return {
    pourToleranceMultiplier: 1 + pourLvl * 0.15,
    gaugeTargetToleranceAdd: sweetLvl * 1.5,
    shakerDurationMs: Math.max(800, 1300 - shakeLvl * 150),
    sealerSpeedBonusRatio: 1 + sealLvl * 0.2,
  };
}
