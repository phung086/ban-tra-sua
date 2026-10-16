import {
  CANONICAL_NPCS,
  type CanonicalNpcId,
  type NpcProfile,
} from './npcInteractionEngine';

export interface DiscoveredPreferences {
  sweetness: boolean;
  ice: boolean;
  favoriteTopping: boolean;
  specialNote: boolean;
}

export interface CustomerNotebookRecord {
  npcId: CanonicalNpcId;
  profile: NpcProfile;
  timesServed: number;
  timesSatisfied: number;
  discovered: DiscoveredPreferences;
  unlockedNoteText: string;
}

export interface NeighborhoodQuest {
  id: string;
  targetNpcId: CanonicalNpcId;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardCash: number;
  rewardReputation: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface ReputationMilestone {
  level: 1 | 2 | 3;
  title: string;
  requiredUnderstoodNpcs: number;
  bonusDescription: string;
  isUnlocked: boolean;
}

export interface CustomerNotebookState {
  records: Record<CanonicalNpcId, CustomerNotebookRecord>;
  reputationPoints: number;
  milestones: ReputationMilestone[];
  dailyQuests: NeighborhoodQuest[];
}

export function createInitialNotebookState(): CustomerNotebookState {
  const records = {} as Record<CanonicalNpcId, CustomerNotebookRecord>;
  const ids = Object.keys(CANONICAL_NPCS) as CanonicalNpcId[];

  for (const id of ids) {
    const profile = CANONICAL_NPCS[id];
    records[id] = {
      npcId: id,
      profile,
      timesServed: 0,
      timesSatisfied: 0,
      discovered: {
        sweetness: false,
        ice: false,
        favoriteTopping: false,
        specialNote: false,
      },
      unlockedNoteText: '',
    };
  }

  const milestones: ReputationMilestone[] = [
    {
      level: 1,
      title: 'Người quen đầu ngõ',
      requiredUnderstoodNpcs: 3,
      bonusDescription: '+5% tiền tip cho mọi đơn hàng chuẩn gu',
      isUnlocked: false,
    },
    {
      level: 2,
      title: 'Tiệm ruột khu phố',
      requiredUnderstoodNpcs: 7,
      bonusDescription: 'Khách kiên nhẫn hơn 20% khi chờ quán lúc đông',
      isUnlocked: false,
    },
    {
      level: 3,
      title: 'Hương vị phố An Hòa',
      requiredUnderstoodNpcs: 12,
      bonusDescription: 'Mở khóa công thức trà đặc sản phố cổ và huy hiệu danh tiếng',
      isUnlocked: false,
    },
  ];

  const dailyQuests: NeighborhoodQuest[] = [
    {
      id: 'quest-linh-sweetness',
      targetNpcId: 'linh',
      title: 'Vị thanh quen thuộc',
      description: 'Phục vụ Linh đúng 30% đường để ghi nhớ khẩu vị',
      targetCount: 1,
      currentCount: 0,
      rewardCash: 15000,
      rewardReputation: 12,
      isCompleted: false,
      isClaimed: false,
    },
    {
      id: 'quest-phuc-speed',
      targetNpcId: 'phuc',
      title: 'Nhanh tay cứu ca',
      description: 'Giao nước cho Phúc trước khi hết 30s kiên nhẫn',
      targetCount: 1,
      currentCount: 0,
      rewardCash: 20000,
      rewardReputation: 15,
      isCompleted: false,
      isClaimed: false,
    },
    {
      id: 'quest-co-thu-perfect',
      targetNpcId: 'co_thu',
      title: 'Chỉn chu góc phố',
      description: 'Phục vụ Cô Thu ly trà kèm topping pudding đạt điểm >= 90',
      targetCount: 1,
      currentCount: 0,
      rewardCash: 25000,
      rewardReputation: 18,
      isCompleted: false,
      isClaimed: false,
    },
  ];

  return {
    records,
    reputationPoints: 0,
    milestones,
    dailyQuests,
  };
}

/**
 * Updates customer discovery record when an order is served.
 * If served accurately, reveals hidden sweet/ice/topping preferences in notebook.
 */
export function recordServedDrink(
  state: CustomerNotebookState,
  params: {
    npcId: CanonicalNpcId;
    actualSweetness: number;
    actualIce: number;
    actualTopping: string;
    qualityScore: number;
  },
): CustomerNotebookState {
  const current = state.records[params.npcId];
  if (!current) return state;

  const profile = current.profile;
  const isSatisfied = params.qualityScore >= 75;
  const matchSweet = Math.abs(params.actualSweetness - profile.preferredSweetness) <= 15;
  const matchIce = Math.abs(params.actualIce - profile.preferredIce) <= 18;
  const matchTopping = params.actualTopping === profile.favoriteTopping;

  const nextDiscovered: DiscoveredPreferences = {
    sweetness: current.discovered.sweetness || matchSweet,
    ice: current.discovered.ice || matchIce,
    favoriteTopping: current.discovered.favoriteTopping || matchTopping,
    specialNote: current.discovered.specialNote || isSatisfied,
  };

  const unlockedNoteText =
    params.npcId === 'linh'
      ? 'Chỉ thích uống 30% đường, rất nhạy cảm với vị gắt ngọt.'
      : params.npcId === 'phuc'
      ? 'Thường ghé giờ tan ca, cần thao tác dứt khoát nhanh nhẹn.'
      : params.npcId === 'co_thu'
      ? 'Uống ít đá, chuộng pudding mềm và thích cách chào hỏi lễ phép.'
      : params.npcId === 'lan'
      ? 'Hảo ngọt và thích thêm nhiều trân châu dai giòn.'
      : `Khách quen khu phố, thích vị trà thanh và phục vụ niềm nở.`;

  const updatedRecord: CustomerNotebookRecord = {
    ...current,
    timesServed: current.timesServed + 1,
    timesSatisfied: isSatisfied ? current.timesSatisfied + 1 : current.timesSatisfied,
    discovered: nextDiscovered,
    unlockedNoteText: nextDiscovered.specialNote ? unlockedNoteText : '',
  };

  const nextRecords = {
    ...state.records,
    [params.npcId]: updatedRecord,
  };

  // Check how many NPCs have all preferences understood
  const understoodCount = Object.values(nextRecords).filter(
    (r) => r.discovered.sweetness && r.discovered.ice && r.discovered.favoriteTopping,
  ).length;

  const nextMilestones = state.milestones.map((m) => ({
    ...m,
    isUnlocked: understoodCount >= m.requiredUnderstoodNpcs,
  }));

  // Update daily quest progression
  const nextQuests = state.dailyQuests.map((q) => {
    if (q.targetNpcId === params.npcId && !q.isCompleted && isSatisfied) {
      const nextCount = q.currentCount + 1;
      return {
        ...q,
        currentCount: nextCount,
        isCompleted: nextCount >= q.targetCount,
      };
    }
    return q;
  });

  return {
    ...state,
    records: nextRecords,
    milestones: nextMilestones,
    dailyQuests: nextQuests,
  };
}

/**
 * Claims reward for a completed neighborhood quest.
 */
export function claimQuestReward(
  state: CustomerNotebookState,
  questId: string,
): { state: CustomerNotebookState; cashReward: number } {
  const quest = state.dailyQuests.find((q) => q.id === questId);
  if (!quest || !qIsClaimable(quest)) {
    return { state, cashReward: 0 };
  }

  const nextQuests = state.dailyQuests.map((q) =>
    q.id === questId ? { ...q, isClaimed: true } : q,
  );

  return {
    state: {
      ...state,
      reputationPoints: state.reputationPoints + quest.rewardReputation,
      dailyQuests: nextQuests,
    },
    cashReward: quest.rewardCash,
  };
}

function qIsClaimable(q: NeighborhoodQuest): boolean {
  return q.isCompleted && !q.isClaimed;
}
