import type { GameState } from '../types';

import { planLifeDay, type LifeDayPlan, type LifeDaySnapshot } from './dayPlanner';

export type BreakfastChoice = 'cook' | 'street' | 'skip';

export type MorningStep = 'asleep' | 'awake' | 'finished';

export type DayEpisodeChoice = 'help' | 'focus';

export type FatherCallChoice = 'listen' | 'promise';

export type MotherCallChoice = 'listen' | 'promise' | 'later' | 'photo';

export type LanMealChoice = 'split' | 'treat' | 'walk' | 'decline';

export interface MorningRoutineState {
day: number;
worldSeed: string;
plan: LifeDayPlan;
step: MorningStep;
breakfast: BreakfastChoice | null;
satiety: number;
shiftBreakOrder?: number;
episodeChoice?: DayEpisodeChoice | null;
fatherCall: FatherCallChoice | null;
motherCall?: MotherCallChoice | null;
lanMeal?: LanMealChoice | null;
lunchPrep: LunchPrepChoice | null;
}

export const MOTHER_CALL_OPTIONS = {listen: { label: 'Nghe mẹ kể chuyện', minutes: 10, bond: 2 },
promise: { label: 'Hẹn cuối tuần về ăn cơm', minutes: 5, bond: 1 },
later: { label: 'Nhắn mẹ tối gọi lại', minutes: 0, bond: 0 },
photo: { label: 'Gửi ảnh tiệm cho mẹ', minutes: 2, bond: 1 }} as const;

const MOTHER_KEY = 'family-mother-mai:';

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
  split: { label: 'Chia đôi hóa đơn với Lan', cost: 65000, minutes: 40, satiety: 20, bond: 2 },
  treat: { label: 'Mời Lan ăn · mình trả cả hai', cost: 130000, minutes: 40, satiety: 20, bond: 3 },
  walk: { label: 'Đi dạo công viên cùng Lan', cost: 0, minutes: 15, satiety: 0, bond: 1 },
  decline: { label: 'Hẹn Lan hôm khác', cost: 0, minutes: 0, satiety: 0, bond: 0 },
} as const;

export const BREAKFAST_OPTIONS = {cook: { label: 'Nấu cơm trứng ở nhà', cost: 14000, minutes: 20, satiety: 80, energy: 5 },
street: { label: 'Mua bánh mì đầu ngõ', cost: 20000, minutes: 10, satiety: 70, energy: 2 },
skip: { label: 'Đi làm luôn', cost: 0, minutes: 0, satiety: 30, energy: 0 }} as const;

export function createWorldSeed(): string {
  return 'pho-nho-' + Math.floor(Math.random() * 0x100000000).toString(36);
}

export function createMorning(snapshot: LifeDaySnapshot, worldSeed: string): MorningRoutineState {
  return {day: snapshot.day,
worldSeed,
plan: planLifeDay(snapshot, worldSeed),
step: 'asleep',
breakfast: null,
satiety: 30,
episodeChoice: null,
fatherCall: null,
motherCall: null,
lanMeal: null,
lunchPrep: null};
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
    return {...restored,
fatherCall,
motherCall: call === 'listen' || call === 'promise' || call === 'later' || call === 'photo' ? call : null,
lanMeal: meal === 'split' || meal === 'treat' || meal === 'walk' || meal === 'decline' ? meal : null,
lunchPrep: value.lunchPrep==="lunchbox"||value.lunchPrep==="water" ? value.lunchPrep : null};
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

export function chooseLanMeal(game: GameState, choice: LanMealChoice): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day || morning.step !== 'finished' || morning.lanMeal != null) return game;
  const option = LAN_MEAL_OPTIONS[choice];
  if (!option) return game;
  if (game.cash < option.cost) return { ...game, notice: 'Chưa đủ tiền đi ăn. Có thể hẹn Lan hôm khác, không mất phí.' };
  const bond = Math.min(1000, (game.city.stories.bonds.lan ?? 0) + option.bond);
  const dialogue = lanMealDialogue(choice, bond);
  return {
    ...game,
    cash: game.cash - option.cost,
    morning: { ...morning, lanMeal: choice, satiety: Math.min(100, morning.satiety + option.satiety) },
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      stories: { ...game.city.stories, bonds: { ...game.city.stories.bonds, lan: bond } },
      journal: [`Ngày ${game.day} · ${option.label} (${option.cost.toLocaleString('vi-VN')} ₫). ${dialogue}`, ...game.city.journal].slice(0, 24),
    },
    notice: dialogue,
  };
}

export function lanMealDialogue(choice: LanMealChoice, bond: number): string {
  if (choice === 'split') return bond >= 4
    ? 'Lan: Lại đi ăn cùng nhau rồi! Chia đôi như lần trước nhé.'
    : 'Lan: Chia đôi nhé, vậy cả hai đều thoải mái!';
  if (choice === 'treat') return bond >= 4
    ? 'Lan: Bạn đã mời mình nhiều rồi. Hôm khác nhất định để mình trả nhé!'
    : 'Lan: Cảm ơn bạn đã mời. Hôm khác để mình mời lại nhé!';
  if (choice === 'walk') return bond >= 4
    ? 'Lan: Mình thích những buổi đi dạo thế này. Không phải lúc nào gặp nhau cũng cần tiêu tiền!'
    : 'Lan: Đi dạo một vòng cũng vui mà! Lần sau mình lại gặp nhé.';
  return 'Lan: Không sao đâu, để hôm khác tụi mình đi ăn nhé!';
}

export type LunchPrepChoice = 'lunchbox' | 'water';

export const LUNCH_PREP_OPTIONS = {
  lunchbox: { label: 'Nấu cơm hộp mang theo', cost: 16000, minutes: 15, satiety: 12, energy: 5 },
  water: { label: 'Chuẩn bị bình nước lọc', cost: 0, minutes: 2, satiety: 0, energy: 2 },
} as const;

export function prepareLunch(game: GameState, choice: LunchPrepChoice): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day ||
    morning.step !== 'finished' || morning.lunchPrep != null) return game;
  const option = LUNCH_PREP_OPTIONS[choice];
  if (!option) return game;
  if (game.cash < option.cost) {
    return { ...game, notice: 'Chưa đủ tiền nấu cơm hộp. Mang nước lọc vẫn miễn phí nhé.' };
  }
  return {
    ...game,
    cash: game.cash - option.cost,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      energy: Math.min(100, game.city.energy + option.energy),
      journal: [`Ngày ${game.day} · ${option.label} trước ca bán (${option.cost.toLocaleString('vi-VN')} ₫).`,
        ...game.city.journal].slice(0, 24),
    },
    morning: {
      ...morning,
      lunchPrep: choice,
      satiety: Math.min(100, morning.satiety + option.satiety),
    },
    notice: `${option.label}. Đã sẵn sàng cho ca bán!`,
  };
}
