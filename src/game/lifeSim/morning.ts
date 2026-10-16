import type { GameState } from '../types';
import { planLifeDay, type LifeDayPlan, type LifeDaySnapshot } from './dayPlanner';

export type BreakfastChoice = 'cook' | 'street' | 'skip';
export type MorningStep = 'asleep' | 'awake' | 'finished';
export type DayEpisodeChoice = 'help' | 'focus';
export type FatherCallChoice = 'listen' | 'promise';
export type MotherCallChoice = 'listen' | 'promise' | 'later' | 'photo';
export type LanMealChoice = 'split' | 'treat' | 'decline';

export interface MorningRoutineState {
  day: number;
  worldSeed: string;
  plan: LifeDayPlan;
  step: MorningStep;
  breakfast: BreakfastChoice | null;
  satiety: number;
  shiftBreakOrder?: number;
  /** Optional for legacy v3 saves; reset when a new day begins. */
  episodeChoice?: DayEpisodeChoice | null;
  fatherCall: FatherCallChoice | null;
  /** Optional on older v3 saves; one family decision per day. */
  motherCall?: MotherCallChoice | null;
  /** Optional once-only friend invitation, persisted with the morning save. */
  lanMeal?: LanMealChoice | null;
}

export const MOTHER_CALL_OPTIONS = {
  listen: { label: 'Nghe mẹ kể chuyện', minutes: 10, bond: 2 },
  promise: { label: 'Hẹn cuối tuần về ăn cơm', minutes: 5, bond: 1 },
  later: { label: 'Nhắn mẹ tối gọi lại', minutes: 0, bond: 0 },
  photo: { label: 'Gửi ảnh tiệm cho mẹ', minutes: 2, bond: 1 },
} as const;

const MOTHER_KEY = 'family-mother-mai:';

/** Day 1 introduces Mai; later calls use the persisted seeded planner. */
export function shouldOfferMotherCall(morning: MorningRoutineState): boolean {
  return morning.day === 1 || morning.day % 3 === 0 || morning.plan.socialHook === 'family-call';
}

export function motherCallMemory(game: Pick<GameState, 'city'>): { bond: number; promised: boolean } {
  const memories = game.city.stories.choices.filter(item => item.startsWith(MOTHER_KEY));
  return {
    bond: memories.reduce((sum, item) => sum + (item.endsWith(':listen') ? 2 : (item.endsWith(':promise') || item.endsWith(':photo')) ? 1 : 0), 0),
    promised: memories.some(item => item.endsWith(':promise')),
  };
}

/** The story ledger is authoritative if an older partial save lacks the morning flag. */
export function motherCallDecision(game: GameState): MotherCallChoice | null {
  const prefix = MOTHER_KEY + game.day + ':';
  const entry = game.city.stories.choices.find(item => item.startsWith(prefix))?.slice(prefix.length);
  if (entry === 'listen' || entry === 'promise' || entry === 'later' || entry === 'photo') return entry;
  const choice = game.morning.motherCall;
  return choice === 'listen' || choice === 'promise' || choice === 'later' || choice === 'photo' ? choice : null;
}

export function motherCallPrompt(game: GameState): string {
  if (motherCallMemory(game).promised)
    return 'Mẹ Mai: Mẹ nhớ con hẹn về ăn cơm. Không cần vội, chỉ muốn biết con vẫn ổn.';
  if (game.morning.breakfast === 'skip') return 'Mẹ Mai: Con lại bỏ bữa sáng à? Nhớ ăn gì đó khi rảnh nhé.';
  if (game.morning.breakfast === 'cook') return 'Mẹ Mai: Nghe con tự nấu cơm sáng mẹ vui lắm. Giữ sức khỏe nhé!';
  if (game.morning.breakfast === 'street') return 'Mẹ Mai: Bánh mì đầu ngõ ngon không? Hôm nào dẫn mẹ ra ăn với.';
  return game.day === 1
    ? 'Mẹ Mai: Sáng đầu tiên tự mở tiệm thế nào rồi con? Mẹ gọi hỏi thăm thôi.'
    : 'Mẹ Mai: Hôm nay tiệm thế nào? Con có thời gian nói chuyện một chút không?';
}

export function motherCallDialogue(choice: MotherCallChoice, bond: number): string {
  if (choice === 'listen') return bond >= 4
    ? 'Mẹ Mai: Dạo này con hay gọi về, mẹ vui lắm. Nhớ ăn uống đều nhé.'
    : 'Mẹ Mai: Nghe giọng con là mẹ yên tâm rồi. Khi nào rảnh mình lại trò chuyện.';
  if (choice === 'promise')
    return 'Mẹ Mai: Cuối tuần nếu sắp xếp được thì về ăn cơm nhé. Không cần cố quá đâu.';
  if (choice === 'photo') return 'Mẹ Mai: Mẹ xem ảnh tiệm rồi, góc cửa sổ dễ thương quá! Chúc con bán đắt hàng.';
  return 'Mẹ Mai: Ừ, con cứ lo cho tiệm trước. Tối rảnh thì nhắn mẹ một câu nhé.';
}

export const LAN_MEAL_OPTIONS = {
  split: { label: 'Đi ăn cùng Lan · chia đôi', cost: 65000, minutes: 40, satiety: 20, bond: 2 },
  treat: { label: 'Mời Lan ăn · mình trả cả hai', cost: 130000, minutes: 40, satiety: 20, bond: 3 },
  decline: { label: 'Hẹn Lan hôm khác', cost: 0, minutes: 0, satiety: 0, bond: 0 },
} as const;

export const BREAKFAST_OPTIONS = {
  cook: { label: 'Nấu cơm trứng ở nhà', cost: 14000, minutes: 20, satiety: 80, energy: 5 },
  street: { label: 'Mua bánh mì đầu ngõ', cost: 20000, minutes: 10, satiety: 70, energy: 2 },
  skip: { label: 'Đi làm luôn', cost: 0, minutes: 0, satiety: 30, energy: 0 },
} as const;

/** Only new games roll a seed. Subsequent days and reloads reuse the same value. */
export function createWorldSeed(): string {
  return 'pho-nho-' + Math.floor(Math.random() * 0x100000000).toString(36);
}

export function createMorning(snapshot: LifeDaySnapshot, worldSeed: string): MorningRoutineState {
  return {
    day: snapshot.day,
    worldSeed,
    plan: planLifeDay(snapshot, worldSeed),
    step: 'asleep',
    breakfast: null,
    satiety: 30,
    episodeChoice: null,
    fatherCall: null,
    motherCall: null,
    lanMeal: null,
  };
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A malformed or old v3 save keeps the shop progress; never reset the player's cash. */
export function hydrateMorning(
  value: unknown,
  snapshot: LifeDaySnapshot,
  shopPhase: GameState['phase'],
): MorningRoutineState {
  if (object(value) && object(value.plan) &&
    value.day === snapshot.day &&
    typeof value.worldSeed === 'string' && value.worldSeed.length > 0 && value.worldSeed.length <= 128 &&
    value.plan.schemaVersion === 1 && value.plan.day === snapshot.day &&
    value.plan.worldSeed === value.worldSeed &&
    ['on-time', 'snoozed', 'overslept'].includes(String(value.plan.wakeVariant)) &&
    typeof value.plan.wakeMinute === 'number' && Number.isFinite(value.plan.wakeMinute) &&
    value.plan.wakeMinute >= 360 && value.plan.wakeMinute <= 1260 &&
    ['asleep', 'awake', 'finished'].includes(String(value.step)) &&
    (value.breakfast === null || ['cook', 'street', 'skip'].includes(String(value.breakfast))) &&
    typeof value.satiety === 'number' && Number.isFinite(value.satiety) &&
    value.satiety >= 0 && value.satiety <= 100 &&
    (!('episodeChoice' in value) || value.episodeChoice === null ||
      value.episodeChoice === 'help' || value.episodeChoice === 'focus')) {
    // Older v3 mornings lack fatherCall; keep the resolved breakfast and migrate safely.
    const fatherCall = value.fatherCall === 'listen' || value.fatherCall === 'promise' ? value.fatherCall : null;
    const restored = value as unknown as MorningRoutineState;
    const call = value.motherCall;
    const meal = value.lanMeal;
    return { ...restored, fatherCall,
      motherCall: call === 'listen' || call === 'promise' || call === 'later' || call === 'photo' ? call : null,
      lanMeal: meal === 'split' || meal === 'treat' || meal === 'decline' ? meal : null };
  }
  // Existing saves have no morning session. A currently-open shift must never
  // be interrupted by a new waking screen after an update.
  const restored = createMorning(snapshot, 'legacy-pho-nho-v3');
  if (shopPhase !== 'prep') return { ...restored, step: 'finished', breakfast: 'skip' };
  return restored;
}

export function wakeMorning(game: GameState): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day || morning.step !== 'asleep') return game;
  const late = morning.plan.wakeVariant === 'overslept';
  const notice = late
    ? 'Ôi, ngủ quên mất rồi! Vẫn có thể ăn sáng rồi mở tiệm muộn một chút.'
    : morning.plan.wakeVariant === 'snoozed'
      ? 'Đã tắt báo thức một lần. Hôm nay mình thong thả bắt đầu nhé.'
      : 'Dậy đúng giờ! Một ngày mới ở Phố Nhỏ bắt đầu.';
  return {
    ...game,
    city: { ...game.city, minutes: Math.max(game.city.minutes, morning.plan.wakeMinute) },
    morning: { ...morning, step: 'awake' },
    notice,
  };
}

export function chooseBreakfast(game: GameState, choice: BreakfastChoice): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day || morning.step !== 'awake') return game;
  const option = BREAKFAST_OPTIONS[choice];
  if (!option) return game;
  if (game.cash < option.cost)
    return { ...game, notice: 'Chưa đủ tiền cho bữa này. Mình có thể chọn bữa khác hoặc mở tiệm trước.' };
  return {
    ...game,
    cash: game.cash - option.cost,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      energy: Math.min(100, game.city.energy + option.energy),
      journal: [`Ngày ${game.day} · ${option.label} (${option.cost.toLocaleString('vi-VN')} ₫).`, ...game.city.journal].slice(0, 24),
    },
    morning: { ...morning, step: 'finished', breakfast: choice, satiety: option.satiety },
    notice: `${option.label}. Giờ có thể mở cửa tiệm và đón khách!`,
  };
}

/** Optional after-breakfast family moment, once per day. No hidden charges. */
export function callFather(game: GameState, choice: FatherCallChoice): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day || morning.step !== 'finished' || morning.fatherCall !== null) return game;
  if (choice !== 'listen' && choice !== 'promise') return game;
  const minutes = choice === 'listen' ? 5 : 8;
  const bond = choice === 'listen' ? 1 : 2;
  const promised = game.relationshipRewardIds.includes('family-father-quang-sign');
  const reply = choice === 'listen'
    ? promised ? 'Bố Quang: Bố nhớ lời con hứa. Đừng lo, hôm nào rảnh mình sửa biển hiệu cùng nhau.'
      : 'Bố Quang: Cứ từ từ mà làm, tiệm mới rồi sẽ đông khách thôi.'
    : 'Bố Quang: Vậy cuối tuần hai bố con cùng xem lại biển hiệu nhé!';
  return {
    ...game,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + minutes),
      journal: [`Ngày ${game.day} · Gọi bố Quang: ${choice === 'listen' ? 'nghe bố tâm sự' : 'hẹn sửa biển hiệu'}.`, ...game.city.journal].slice(0, 24),
    },
    morning: { ...morning, fatherCall: choice },
    customerBond: { ...game.customerBond, 'family-father-quang': (game.customerBond['family-father-quang'] ?? 0) + bond },
    relationshipRewardIds: choice === 'promise' && !promised
      ? [...game.relationshipRewardIds, 'family-father-quang-sign']
      : game.relationshipRewardIds,
    notice: reply,
  };
}

/** A player-confirmed call commits game time, a dialogue and NPC memory once. */
export function chooseMotherCall(game: GameState, choice: MotherCallChoice): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day || morning.step !== 'finished' ||
      motherCallDecision(game) !== null || !shouldOfferMotherCall(morning)) return game;
  const option = MOTHER_CALL_OPTIONS[choice];
  if (!option) return game;
  const dayKey = MOTHER_KEY + game.day + ':';
  if (game.city.stories.choices.some(item => item.startsWith(dayKey))) return game;
  const reply = motherCallDialogue(choice, motherCallMemory(game).bond + option.bond);
  return {
    ...game,
    morning: { ...morning, motherCall: choice },
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      stories: {
        ...game.city.stories,
        choices: [...game.city.stories.choices, dayKey + choice].slice(-100),
      },
      journal: [`Ngày ${game.day} · Gọi mẹ Mai: ${option.label}. ${reply}`, ...game.city.journal].slice(0, 24),
    },
    notice: reply,
  };
}

/** Lan invites the player to a small meal before opening. Costs are shown in the UI first. */
export function chooseLanMeal(game: GameState, choice: LanMealChoice): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day || morning.step !== 'finished' || morning.lanMeal) return game;
  const option = LAN_MEAL_OPTIONS[choice];
  if (!option) return game;
  if (game.cash < option.cost) return { ...game, notice: 'Chưa đủ tiền đi ăn. Có thể hẹn Lan hôm khác, không mất phí.' };
  const lanBond = Math.min(1000, (game.city.stories.bonds.lan ?? 0) + option.bond);
  const dialogue = choice === 'split'
    ? 'Lan: Chia đôi nhé, vậy cả hai đều thoải mái!'
    : choice === 'treat'
      ? 'Lan: Cảm ơn bạn đã mời. Hôm khác để mình mời lại nhé!'
      : 'Lan: Không sao đâu, để hôm khác tụi mình đi ăn nhé!';
  return {
    ...game,
    cash: game.cash - option.cost,
    morning: { ...morning, lanMeal: choice, satiety: Math.min(100, morning.satiety + option.satiety) },
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      journal: [`Ngày ${game.day} · ${option.label} (${option.cost.toLocaleString('vi-VN')} ₫). ${dialogue}`, ...game.city.journal].slice(0, 24),
      stories: { ...game.city.stories, bonds: { ...game.city.stories.bonds, lan: lanBond } },
    },
    notice: dialogue,
  };
}
