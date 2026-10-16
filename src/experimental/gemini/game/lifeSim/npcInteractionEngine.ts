export type CanonicalNpcId =
  | 'co_hanh'
  | 'co_thu'
  | 'anh_nam'
  | 'bac_minh'
  | 'bac_binh'
  | 'lan'
  | 'me_mai'
  | 'bo_quang'
  | 'em_an'
  | 'thao'
  | 'duy'
  | 'khanh'
  | 'linh'
  | 'phuc';

export interface NpcProfile {
  id: CanonicalNpcId;
  displayName: string;
  roleTitle: string;
  preferredSweetness: 30 | 50 | 70 | 100;
  preferredIce: 30 | 50 | 70 | 100;
  favoriteTopping: string;
  patienceSeconds: number;
  personalityTag: 'warm' | 'strict' | 'thoughtful' | 'energetic' | 'frugal' | 'precise';
}

export const CANONICAL_NPCS: Record<CanonicalNpcId, NpcProfile> = {
  co_hanh: {
    id: 'co_hanh',
    displayName: 'Cô Hạnh',
    roleTitle: 'Tiểu thương chợ sáng',
    preferredSweetness: 50,
    preferredIce: 70,
    favoriteTopping: 'jelly',
    patienceSeconds: 48,
    personalityTag: 'warm',
  },
  co_thu: {
    id: 'co_thu',
    displayName: 'Cô Thu',
    roleTitle: 'Hàng xóm khu tập thể',
    preferredSweetness: 30,
    preferredIce: 50,
    favoriteTopping: 'pudding',
    patienceSeconds: 38,
    personalityTag: 'strict',
  },
  anh_nam: {
    id: 'anh_nam',
    displayName: 'Anh Nam',
    roleTitle: 'Quản lý hiệu sách cũ',
    preferredSweetness: 50,
    preferredIce: 30,
    favoriteTopping: 'boba',
    patienceSeconds: 55,
    personalityTag: 'thoughtful',
  },
  bac_minh: {
    id: 'bac_minh',
    displayName: 'Bác Minh',
    roleTitle: 'Cựu cư dân phố cổ',
    preferredSweetness: 30,
    preferredIce: 30,
    favoriteTopping: 'jelly',
    patienceSeconds: 60,
    personalityTag: 'thoughtful',
  },
  bac_binh: {
    id: 'bac_binh',
    displayName: 'Bác Bình',
    roleTitle: 'Người chăm cây công viên',
    preferredSweetness: 50,
    preferredIce: 50,
    favoriteTopping: 'jelly',
    patienceSeconds: 58,
    personalityTag: 'warm',
  },
  lan: {
    id: 'lan',
    displayName: 'Lan',
    roleTitle: 'Bạn thân năng động',
    preferredSweetness: 70,
    preferredIce: 70,
    favoriteTopping: 'boba',
    patienceSeconds: 50,
    personalityTag: 'energetic',
  },
  me_mai: {
    id: 'me_mai',
    displayName: 'Mẹ Mai',
    roleTitle: 'Mẹ của bạn',
    preferredSweetness: 30,
    preferredIce: 30,
    favoriteTopping: 'pudding',
    patienceSeconds: 65,
    personalityTag: 'warm',
  },
  bo_quang: {
    id: 'bo_quang',
    displayName: 'Bố Quang',
    roleTitle: 'Bố của bạn — thợ sửa chữa khéo tay',
    preferredSweetness: 50,
    preferredIce: 50,
    favoriteTopping: 'boba',
    patienceSeconds: 65,
    personalityTag: 'thoughtful',
  },
  em_an: {
    id: 'em_an',
    displayName: 'Em An',
    roleTitle: 'Em út đang đi học',
    preferredSweetness: 100,
    preferredIce: 70,
    favoriteTopping: 'boba',
    patienceSeconds: 45,
    personalityTag: 'energetic',
  },
  thao: {
    id: 'thao',
    displayName: 'Thảo',
    roleTitle: 'Bạn thân thiết kế đồ họa',
    preferredSweetness: 50,
    preferredIce: 70,
    favoriteTopping: 'pudding',
    patienceSeconds: 52,
    personalityTag: 'precise',
  },
  duy: {
    id: 'duy',
    displayName: 'Duy',
    roleTitle: 'Bạn cùng nhóm — hay hụt ví cuối tháng',
    preferredSweetness: 70,
    preferredIce: 100,
    favoriteTopping: 'boba',
    patienceSeconds: 46,
    personalityTag: 'frugal',
  },
  khanh: {
    id: 'khanh',
    displayName: 'Khánh',
    roleTitle: 'Bạn điều phối lịch & sổ quỹ',
    preferredSweetness: 50,
    preferredIce: 50,
    favoriteTopping: 'jelly',
    patienceSeconds: 42,
    personalityTag: 'precise',
  },
  linh: {
    id: 'linh',
    displayName: 'Linh',
    roleTitle: 'Khách quen thích vị thanh ít ngọt',
    preferredSweetness: 30,
    preferredIce: 50,
    favoriteTopping: 'jelly',
    patienceSeconds: 44,
    personalityTag: 'precise',
  },
  phuc: {
    id: 'phuc',
    displayName: 'Phúc',
    roleTitle: 'Khách kỹ tính đang chịu áp lực công việc',
    preferredSweetness: 50,
    preferredIce: 70,
    favoriteTopping: 'boba',
    patienceSeconds: 34,
    personalityTag: 'strict',
  },
};

export type OrderIssueCode =
  | 'sweetness_mismatch'
  | 'ice_mismatch'
  | 'wrong_topping'
  | 'underfilled_pour'
  | 'overfilled_pour'
  | 'slow_service';

export type OrderRecoveryActionId =
  | 'remake_quick'
  | 'partial_discount'
  | 'full_refund_voucher';

export interface OrderRecoveryOption {
  id: OrderRecoveryActionId;
  label: string;
  description: string;
  cashDelta: number;
  timeSecondsDelta: number;
  energyDelta: number;
  relationshipDelta: number;
  resultingMood: 'happy' | 'neutral' | 'disappointed';
  npcReply: string;
  tomorrowCallbackText: string;
}

export interface OrderDeliveryAssessment {
  orderId: string;
  npcId: CanonicalNpcId;
  basePrice: number;
  qualityScore: number;
  needsRecovery: boolean;
  issues: OrderIssueCode[];
  initialMood: 'happy' | 'worried' | 'disappointed' | 'surprised';
  customerDialogue: string;
  recoveryOptions: OrderRecoveryOption[];
}

export interface OrderEvaluationInput {
  orderId: string;
  npcId: CanonicalNpcId;
  basePrice: number;
  targetSweetness: number;
  actualSweetness: number;
  targetIce: number;
  actualIce: number;
  targetTopping: string;
  actualTopping: string;
  pourFillRatio: number; // 1.0 is ideal [0.9..1.08]
  elapsedSeconds: number;
}

export function evaluateOrderDelivery(
  input: OrderEvaluationInput,
): OrderDeliveryAssessment {
  const profile = CANONICAL_NPCS[input.npcId] ?? CANONICAL_NPCS.linh;
  const issues: OrderIssueCode[] = [];
  let score = 100;

  const sweetDiff = Math.abs(input.actualSweetness - input.targetSweetness);
  if (sweetDiff > 15) {
    issues.push('sweetness_mismatch');
    score -= sweetDiff >= 30 ? 28 : 16;
  }

  const iceDiff = Math.abs(input.actualIce - input.targetIce);
  if (iceDiff > 18) {
    issues.push('ice_mismatch');
    score -= 14;
  }

  if (input.actualTopping !== input.targetTopping) {
    issues.push('wrong_topping');
    score -= 26;
  }

  if (input.pourFillRatio < 0.88) {
    issues.push('underfilled_pour');
    score -= 18;
  } else if (input.pourFillRatio > 1.1) {
    issues.push('overfilled_pour');
    score -= 15;
  }

  if (input.elapsedSeconds > profile.patienceSeconds) {
    issues.push('slow_service');
    score -= 15;
  }

  const qualityScore = Math.max(0, Math.min(100, score));
  const needsRecovery = qualityScore < 75 || issues.length >= 2;

  if (!needsRecovery) {
    const praised =
      qualityScore >= 92
        ? `${profile.displayName} mỉm cười: "Đúng chuẩn vị mình thích rồi, cảm ơn tiệm nhé!"`
        : `${profile.displayName} gật đầu: "Nước ổn đó, chúc quán hôm nay đắt khách nhé."`;
    return {
      orderId:stylesSafeId(input.orderId),
      npcId: profile.id,
      basePrice: input.basePrice,
      qualityScore,
      needsRecovery: false,
      issues,
      initialMood: qualityScore >= 92 ? 'happy' : 'surprised',
      customerDialogue: praised,
      recoveryOptions: [],
    };
  }

  const primaryIssueText = issues.includes('sweetness_mismatch')
    ? input.actualSweetness > input.targetSweetness
      ? 'hơi gắt ngọt so với mức mình dặn'
      : 'hơi nhạt vị đường'
    : issues.includes('wrong_topping')
    ? 'nhầm loại topping trong đơn rồi'
    : issues.includes('underfilled_pour')
    ? 'rót hơi lưng ly'
    : issues.includes('overfilled_pour')
    ? 'rót hơi đầy tràn mép cốc'
    : 'pha hơi lâu làm đá tan bớt';

  const customerDialogue =
    profile.id === 'linh'
      ? `Linh khẽ nhấp thử rồi ngại ngần: "Ơ, ly này ${primaryIssueText}... bạn chỉnh giúp mình một chút được không?"`
      : profile.id === 'phuc'
      ? `Phúc thở dài nhìn ly trà: "Hôm nay mình đang gấp mà ly nước lại ${primaryIssueText}. Quán tính xử lý sao đây?"`
      : profile.id === 'co_thu'
      ? `Cô Thu nhìn kỹ qua mắt kính: "Cháu ơi, làm hàng phố mình phải chỉn chu, ly này ${primaryIssueText} đấy nhé."`
      : `${profile.displayName} ngập ngừng: "Hình như ly này ${primaryIssueText}, tiệm xem lại giúp mình nhé?"`;

  const discountPayout = Math.round(input.basePrice * 0.7);

  const recoveryOptions: OrderRecoveryOption[] = [
    {
      id: 'remake_quick',
      label: 'Chỉnh / Pha lại ngay tại quầy',
      description: 'Tốn thêm 15 giây & 6 năng lượng, giữ nguyên tiền đơn hàng và làm khách hài lòng.',
      cashDelta: input.basePrice,
      timeSecondsDelta: 15,
      energyDelta: -6,
      relationshipDelta: 4,
      resultingMood: 'happy',
      npcReply: `${profile.displayName} tươi tỉnh hẳn: "Cảm ơn bạn đã chịu khó pha lại ngay, vị chuẩn lắm!"`,
      tomorrowCallbackText: `${profile.displayName} nhớ sự cẩn thận của bạn và sẽ giới thiệu thêm khách quen.`,
    },
    {
      id: 'partial_discount',
      label: `Xin lỗi & Giảm 30% (Thu ${discountPayout.toLocaleString('vi-VN')}đ)`,
      description: 'Không tốn thêm thời gian hay sức lực, thu 70% giá ly nước và giữ thiện cảm.',
      cashDelta: discountPayout,
      timeSecondsDelta: 0,
      energyDelta: -1,
      relationshipDelta: 2,
      resultingMood: 'neutral',
      npcReply: `${profile.displayName} gật đầu thông cảm: "Thôi được rồi, quán biết lắng nghe vậy là mình quý rồi."`,
      tomorrowCallbackText: `${profile.displayName} ghi nhận thái độ cầu thị của tiệm.`,
    },
    {
      id: 'full_refund_voucher',
      label: 'Miễn phí ly này & Hẹn bù ngày mai',
      description: 'Thu 0đ hôm nay nhưng tạo ấn tượng tốt, khách chắc chắn quay lại ngày mai kèm tiền tip +25%.',
      cashDelta: 0,
      timeSecondsDelta: 5,
      energyDelta: -2,
      relationshipDelta: 6,
      resultingMood: 'happy',
      npcReply: `${profile.displayName} bất ngờ: "Quán chu đáo quá! Mai mình nhất định ghé ủng hộ lại nhé."`,
      tomorrowCallbackText: `${profile.displayName} sẽ ghé sớm vào ngày mai với mức tip +25%.`,
    },
  ];

  return {
    orderId: stylesSafeId(input.orderId),
    npcId: profile.id,
    basePrice: input.basePrice,
    qualityScore,
    needsRecovery: true,
    issues,
    initialMood: profile.personalityTag === 'strict' ? 'disappointed' : 'worried',
    customerDialogue,
    recoveryOptions,
  };
}

function stylesSafeId(id: string): string {
  return id.trim() || 'order-default';
}

export type SocialChoiceId =
  | 'split_bill'
  | 'treat_friend'
  | 'reschedule'
  | 'decline_polite';

export interface SocialInviteOptionPreview {
  id: SocialChoiceId;
  label: string;
  cashDelta: number;
  timeMinutesDelta: number;
  energyDelta: number;
  satietyDelta: number;
  relationshipDelta: number;
  canAfford: boolean;
  npcReactionText: string;
  memoryTag: string;
  tomorrowConsequence: string;
}

export interface SocialInviteScenario {
  inviteId: string;
  day: number;
  npcId: CanonicalNpcId;
  title: string;
  locationName: string;
  dialoguePrompt: string;
  totalMealCost: number;
  options: SocialInviteOptionPreview[];
}

export function buildSocialInviteScenario(params: {
  inviteId: string;
  day: number;
  npcId: CanonicalNpcId;
  playerCash: number;
  totalMealCost?: number;
  hadBrokenPromiseBefore?: boolean;
}): SocialInviteScenario {
  const profile = CANONICAL_NPCS[params.npcId] ?? CANONICAL_NPCS.lan;
  const totalCost = params.totalMealCost ?? 70000;
  const halfCost = Math.round(totalCost / 2);

  const dialoguePrompt =
    params.npcId === 'duy'
      ? 'Duy gãi đầu cười trừ: "Tối nay tụi mình ra quán bún chả đầu ngõ ngồi chút không? Cuối tháng mình hơi kẹt ví nên nếu đi thì chia đôi nhé..."'
      : params.npcId === 'khanh'
      ? 'Khánh mở sổ tay: "Mình vừa chốt lịch nghỉ tối nay 45 phút ở quán ốc phố cổ, phần mỗi người 35.000đ. Bạn đi cùng cho vui chứ?"'
      : params.npcId === 'lan'
      ? 'Lan vẫy tay hào hứng: "Đóng quầy xong đi ăn nem nướng với mình đi! Có chuyện này hay lắm muốn kể bạn nghe!"'
      : `${profile.displayName} mỉm cười: "Hôm nay rảnh rỗi, mình ngồi ăn chút gì ấm bụng rồi trò chuyện nhé?"`;

  const brokenPenalty = params.hadBrokenPromiseBefore ? -5 : -1;

  const options: SocialInviteOptionPreview[] = [
    {
      id: 'split_bill',
      label: `Đi cùng & Chia đôi hóa đơn (-${halfCost.toLocaleString('vi-VN')}đ)`,
      cashDelta: -halfCost,
      timeMinutesDelta: 45,
      energyDelta: 8,
      satietyDelta: 32,
      relationshipDelta: 5,
      canAfford: params.playerCash >= halfCost,
      npcReactionText: `${profile.displayName} vui vẻ: "Chuẩn luôn, vừa ấm bụng vừa thoải mái cho cả hai!"`,
      memoryTag: `day-${params.day}-shared-meal-${profile.id}`,
      tomorrowConsequence: `${profile.displayName} nhớ buổi trò chuyện tối qua và ghé quán truyền thêm cảm hứng.`,
    },
    {
      id: 'treat_friend',
      label: `Mời ${profile.displayName} bữa này (-${totalCost.toLocaleString('vi-VN')}đ)`,
      cashDelta: -totalCost,
      timeMinutesDelta: 50,
      energyDelta: 10,
      satietyDelta: 35,
      relationshipDelta: 9,
      canAfford: params.playerCash >= totalCost,
      npcReactionText: `${profile.displayName} cảm động: "Ngại quá, để bữa sau mình mời lại hoặc qua phụ quán nhé!"`,
      memoryTag: `day-${params.day}-treated-${profile.id}`,
      tomorrowConsequence: `${profile.displayName} mang quà nhỏ hoặc giới thiệu khách mới tới tiệm vào ngày mai.`,
    },
    {
      id: 'reschedule',
      label: 'Hẹn dời sang tối mai (0đ hôm nay)',
      cashDelta: 0,
      timeMinutesDelta: 5,
      energyDelta: 0,
      satietyDelta: 0,
      relationshipDelta: params.hadBrokenPromiseBefore ? -4 : 1,
      canAfford: true,
      npcReactionText: params.hadBrokenPromiseBefore
        ? `${profile.displayName} hơi chùng giọng: "Bạn lại dời lịch nữa à... nhớ giữ lời lần này nhé."`
        : `${profile.displayName} gật đầu: "Ừa, vậy tối mai nhớ dành thời gian cho mình nha!"`,
      memoryTag: params.hadBrokenPromiseBefore
        ? `day-${params.day}-repeated-reschedule-${profile.id}`
        : `day-${params.day}-promised-tomorrow-${profile.id}`,
      tomorrowConsequence: `Đã hẹn ${profile.displayName} vào tối mai — nếu giữ lời sẽ tăng mạnh độ gắn kết.`,
    },
    {
      id: 'decline_polite',
      label: 'Từ chối khéo để nghỉ sớm (0đ)',
      cashDelta: 0,
      timeMinutesDelta: 0,
      energyDelta: 12,
      satietyDelta: 0,
      relationshipDelta: brokenPenalty,
      canAfford: true,
      npcReactionText: `${profile.displayName} vẫy tay: "Thôi bạn nghỉ sớm giữ sức đi, bán hàng cả ngày vất vả rồi."`,
      memoryTag: `day-${params.day}-declined-rest-${profile.id}`,
      tomorrowConsequence: 'Bạn ngủ sớm hơn nên sáng mai thức dậy với +10 năng lượng khởi đầu.',
    },
  ];

  return {
    inviteId: params.inviteId,
    day: params.day,
    npcId: profile.id,
    title: `Lời mời buổi tối từ ${profile.displayName}`,
    locationName: 'Quán ăn vỉa hè phố An Hòa',
    dialoguePrompt,
    totalMealCost: totalCost,
    options,
  };
}

export interface LifeSimInteractionLedger {
  day: number;
  cash: number;
  energy: number;
  satiety: number;
  timeMinutes: number;
  earnedToday: number;
  spentToday: number;
  relationships: Record<string, number>;
  npcMemories: Record<string, string[]>;
  pendingTomorrowCallbacks: string[];
  encountersToday: Array<{
    npcId: CanonicalNpcId;
    displayName: string;
    outcomeLabel: string;
    mood: 'happy' | 'neutral' | 'disappointed' | 'surprised';
  }>;
  lessonsToday: string[];
  appliedActionIds: string[];
}

export function createInitialInteractionLedger(
  overrides: Partial<LifeSimInteractionLedger> = {},
): LifeSimInteractionLedger {
  return {
    day: 1,
    cash: 150000,
    energy: 80,
    satiety: 70,
    timeMinutes: 8 * 60,
    earnedToday: 0,
    spentToday: 0,
    relationships: {},
    npcMemories: {},
    pendingTomorrowCallbacks: [],
    encountersToday: [],
    lessonsToday: [],
    appliedActionIds: [],
    ...overrides,
  };
}

/**
 * Pure, idempotent reducer for applying an Order Recovery choice.
 * Reload-safe: never double-charges or double-credits if actionKey was already applied.
 */
export function applyOrderRecoveryChoice(
  ledger: LifeSimInteractionLedger,
  assessment: OrderDeliveryAssessment,
  choiceId: OrderRecoveryActionId,
): LifeSimInteractionLedger {
  const actionKey = `order-recovery:${ledger.day}:${assessment.orderId}`;
  if (ledger.appliedActionIds.includes(actionKey)) {
    return ledger;
  }

  const option =
    assessment.recoveryOptions.find((o) => o.id === choiceId) ??
    assessment.recoveryOptions[0];
  if (!option) return ledger;

  const profile = CANONICAL_NPCS[assessment.npcId];
  const nextCash = Math.max(0, ledger.cash + option.cashDelta);
  const nextEarned =
    option.cashDelta > 0 ? ledger.earnedToday + option.cashDelta : ledger.earnedToday;
  const nextEnergy = Math.max(0, Math.min(100, ledger.energy + option.energyDelta));
  const nextTime = ledger.timeMinutes + Math.ceil(option.timeSecondsDelta / 60);
  const currentRel = ledger.relationships[assessment.npcId] ?? 50;
  const nextRel = Math.max(0, Math.min(100, currentRel + option.relationshipDelta));

  const prevMemories = ledger.npcMemories[assessment.npcId] ?? [];
  const memoryEntry = `day-${ledger.day}-recovery-${choiceId}`;

  const lesson =
    assessment.issues.includes('sweetness_mismatch')
      ? `Nhớ gu đường của ${profile.displayName} (${profile.preferredSweetness}% đường) để không phải pha lại.`
      : assessment.issues.includes('wrong_topping')
      ? `Kiểm tra kỹ topping yêu thích của ${profile.displayName} trước khi dập nắp.`
      : `Canh tốc độ rót trà đều tay để giữ chuẩn định lượng cho ${profile.displayName}.`;

  return {
    ...ledger,
    cash: nextCash,
    energy: nextEnergy,
    timeMinutes: nextTime,
    earnedToday: nextEarned,
    relationships: {
      ...ledger.relationships,
      [assessment.npcId]: nextRel,
    },
    npcMemories: {
      ...ledger.npcMemories,
      [assessment.npcId]: [...prevMemories, memoryEntry],
    },
    pendingTomorrowCallbacks: [
      ...ledger.pendingTomorrowCallbacks,
      option.tomorrowCallbackText,
    ],
    encountersToday: [
      ...ledger.encountersToday,
      {
        npcId: assessment.npcId,
        displayName: profile.displayName,
        outcomeLabel: option.label,
        mood: option.resultingMood,
      },
    ],
    lessonsToday: ledger.lessonsToday.includes(lesson)
      ? ledger.lessonsToday
      : [...ledger.lessonsToday, lesson],
    appliedActionIds: [...ledger.appliedActionIds, actionKey],
  };
}

/**
 * Pure, idempotent reducer for applying a Social Invite choice.
 * Reload-safe: prevents charging money twice after save/reload.
 */
export function applySocialInviteChoice(
  ledger: LifeSimInteractionLedger,
  scenario: SocialInviteScenario,
  choiceId: SocialChoiceId,
): LifeSimInteractionLedger {
  const actionKey = `social-invite:${scenario.day}:${scenario.inviteId}`;
  if (ledger.appliedActionIds.includes(actionKey)) {
    return ledger;
  }

  const option = scenario.options.find((o) => o.id === choiceId);
  if (!option) return ledger;

  // Fallback to reschedule if player cannot afford the chosen paid option
  const effectiveOption =
    !option.canAfford && option.cashDelta < 0
      ? scenario.options.find((o) => o.id === 'reschedule') ?? option
      : option;

  const profile = CANONICAL_NPCS[scenario.npcId];
  const nextCash = Math.max(0, ledger.cash + effectiveOption.cashDelta);
  const spentDelta = effectiveOption.cashDelta < 0 ? Math.abs(effectiveOption.cashDelta) : 0;
  const nextEnergy = Math.max(
    0,
    Math.min(100, ledger.energy + effectiveOption.energyDelta),
  );
  const nextSatiety = Math.max(
    0,
    Math.min(100, ledger.satiety + effectiveOption.satietyDelta),
  );
  const currentRel = ledger.relationships[scenario.npcId] ?? 50;
  const nextRel = Math.max(
    0,
    Math.min(100, currentRel + effectiveOption.relationshipDelta),
  );
  const prevMemories = ledger.npcMemories[scenario.npcId] ?? [];

  return {
    ...ledger,
    cash: nextCash,
    energy: nextEnergy,
    satiety: nextSatiety,
    timeMinutes: ledger.timeMinutes + effectiveOption.timeMinutesDelta,
    spentToday: ledger.spentToday + spentDelta,
    relationships: {
      ...ledger.relationships,
      [scenario.npcId]: nextRel,
    },
    npcMemories: {
      ...ledger.npcMemories,
      [scenario.npcId]: [...prevMemories, effectiveOption.memoryTag],
    },
    pendingTomorrowCallbacks: [
      ...ledger.pendingTomorrowCallbacks,
      effectiveOption.tomorrowConsequence,
    ],
    encountersToday: [
      ...ledger.encountersToday,
      {
        npcId: scenario.npcId,
        displayName: profile.displayName,
        outcomeLabel: effectiveOption.label,
        mood:
          effectiveOption.relationshipDelta > 0
            ? 'happy'
            : effectiveOption.relationshipDelta < 0
            ? 'disappointed'
            : 'neutral',
      },
    ],
    appliedActionIds: [...ledger.appliedActionIds, actionKey],
  };
}

export interface EndOfDaySummaryReport {
  day: number;
  headline: string;
  earnedCash: number;
  spentCash: number;
  netCash: number;
  closingCash: number;
  encounters: LifeSimInteractionLedger['encountersToday'];
  lessonsLearned: string[];
  tomorrowConsequences: string[];
  readyToSleepAndSave: boolean;
}

export function buildEndOfDaySummary(
  ledger: LifeSimInteractionLedger,
): EndOfDaySummaryReport {
  const netCash = ledger.earnedToday - ledger.spentToday;
  const headline =
    netCash >= 100000
      ? `Ngày ${ledger.day} rộn ràng: Quán đông khách và phố phường ấm áp`
      : netCash >= 0
      ? `Ngày ${ledger.day} êm đềm: Giữ vững nhịp sống nơi góc phố nhỏ`
      : `Ngày ${ledger.day} nhiều khoản chi: Đầu tư cho quan hệ và ngày mai`;

  const lessonsLearned =
    ledger.lessonsToday.length > 0
      ? ledger.lessonsToday
      : ['Giữ nhịp pha trà đều tay và quan sát kỹ khẩu vị riêng của từng vị khách quen.'];

  const tomorrowConsequences =
    ledger.pendingTomorrowCallbacks.length > 0
      ? ledger.pendingTomorrowCallbacks
      : ['Sáng mai mở cửa đón nắng sớm, kiểm tra lại nguyên liệu tại quầy trước giờ cao điểm.'];

  return {
    day: ledger.day,
    headline,
    earnedCash: ledger.earnedToday,
    spentCash: ledger.spentToday,
    netCash,
    closingCash: ledger.cash,
    encounters: ledger.encountersToday,
    lessonsLearned,
    tomorrowConsequences,
    readyToSleepAndSave: true,
  };
}
