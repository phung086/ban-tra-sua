import type { GameState } from '../types';
import { planLifeDay, type LifeDayPlan, type LifeDaySnapshot } from './dayPlanner';

export type BreakfastChoice = 'cook' | 'street' | 'skip';
export type MarketVisitChoice = 'basket' | 'chat';
export type MorningStep = 'asleep' | 'awake' | 'finished';

export interface MorningRoutineState {
  day: number;
  worldSeed: string;
  plan: LifeDayPlan;
  step: MorningStep;
  breakfast: BreakfastChoice | null;
  satiety: number;
  /** Optional on old v3 saves; normalized when loading. */
  marketVisit?: MarketVisitChoice | null;
  homeCooked?: boolean;
}

export const MARKET_OPTIONS = {
  basket: { label: 'Mua rau và trứng ở chợ', cost: 12000, minutes: 12, energy: 2 },
  chat: { label: 'Hỏi thăm cô Hạnh', cost: 0, minutes: 4, energy: 0 },
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
    marketVisit: null,
    homeCooked: false,
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
    value.satiety >= 0 && value.satiety <= 100) {
    // Save v3 predates the market feature. Normalize optional flags so a
    // corrupt save cannot grant a cooked meal without buying ingredients.
    const marketVisit: MarketVisitChoice | null = value.marketVisit === 'basket' || value.marketVisit === 'chat'
      ? value.marketVisit : null;
    return {
      ...(value as unknown as MorningRoutineState),
      marketVisit,
      homeCooked: marketVisit === 'basket' && value.homeCooked === true,
    };
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

/** Optional market trip after breakfast. Cô Hạnh remembers yesterday's visit. */
export function visitMorningMarket(game: GameState, choice: MarketVisitChoice): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day || morning.step !== 'finished' || morning.marketVisit != null) return game;
  const option = MARKET_OPTIONS[choice];
  if (!option) return game;
  if (game.cash < option.cost) return { ...game, notice: 'Chưa đủ tiền mua rau. Có thể hỏi thăm cô Hạnh miễn phí.' };
  const remembered = game.storyLog.some(moment => moment.customerId === 'hanh' && moment.id.startsWith('morning-market-'));
  const reply = choice === 'basket'
    ? remembered ? 'Cô Hạnh nhớ mặt: “Lại nấu cơm à? Rau hôm nay tươi lắm!”' : 'Cô Hạnh lựa cho mình mớ rau và hai quả trứng tươi.'
    : remembered ? 'Cô Hạnh cười: “Hôm trước nói chuyện vui quá, hôm nay bán đắt nhé!”' : 'Cô Hạnh kể chuyện chợ sớm và chúc tiệm đông khách.';
  return {
    ...game,
    cash: game.cash - option.cost,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      energy: Math.max(0, game.city.energy - option.energy),
      goodwill: game.city.goodwill + 1,
      journal: [`Ngày ${game.day} · ${option.label} (${option.cost.toLocaleString('vi-VN')} ₫).`, ...game.city.journal].slice(0, 24),
    },
    morning: { ...morning, marketVisit: choice, homeCooked: false },
    storyLog: [{
      id: `morning-market-${game.day}`, customerId: 'hanh', customerName: 'Cô Hạnh',
      title: 'Chợ đầu ngõ', text: reply, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: reply,
  };
}

/** Cook the purchased ingredients at home; never consume the same basket twice. */
export function cookMarketMeal(game: GameState): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day || morning.step !== 'finished' ||
      morning.marketVisit !== 'basket' || morning.homeCooked === true) return game;
  if (game.city.energy < 3) return { ...game, notice: 'Mệt quá rồi, nghỉ ngơi trước khi nấu nhé.' };
  return {
    ...game,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + 18),
      energy: game.city.energy - 3,
      journal: [`Ngày ${game.day} · Nấu canh rau và trứng tại nhà.`, ...game.city.journal].slice(0, 24),
    },
    morning: { ...morning, homeCooked: true, satiety: Math.min(100, morning.satiety + 20) },
    notice: 'Bữa cơm nhà đã xong! No bụng hơn trước khi mở tiệm.',
  };
}
