import type { GameState } from '../types';
import { planLifeDay, type LifeDayPlan, type LifeDaySnapshot } from './dayPlanner';

export type BreakfastChoice = 'cook' | 'street' | 'skip';
export type MorningStep = 'asleep' | 'awake' | 'finished';

export interface MorningRoutineState {
  day: number;
  worldSeed: string;
  plan: LifeDayPlan;
  step: MorningStep;
  breakfast: BreakfastChoice | null;
  satiety: number;
  /** Once-only daily market choice, carried through existing v3 saves. */
  marketVisit?: 'fruit' | 'chat' | 'leave' | null;
}

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
    // Preserve valid old saves and sanitize optional fields without resetting breakfast.
    const restored = value as unknown as MorningRoutineState;
    const choice = value.marketVisit;
    return { ...restored, marketVisit: choice === 'fruit' || choice === 'chat' || choice === 'leave' ? choice : null };
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
