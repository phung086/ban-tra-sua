import type { GameState } from '../types';
import { BREAKFAST_OPTIONS, chooseBreakfast } from './morning';

export type CookingHeat = 'gentle' | 'quick';
type CookingMorning = GameState['morning'] & {
  cookingStage?: 'pan';
  cookingHeat?: CookingHeat;
};

export const COOKING_STYLES = {
  gentle: { label: 'Lửa nhỏ, trứng mềm', minutes: 20, energy: 5, satiety: 90, hint: 'No lâu nhưng mở tiệm muộn hơn' },
  quick: { label: 'Lửa vừa, làm nhanh', minutes: 10, energy: 2, satiety: 65, hint: 'Kịp mở tiệm, ít no hơn' },
} as const;

const morning = (game: GameState): CookingMorning => game.morning as CookingMorning;

export function isCookingBreakfast(game: GameState): boolean {
  return game.phase === 'prep' && game.morning.day === game.day &&
    game.morning.step === 'awake' && morning(game).cookingStage === 'pan';
}

export function getBreakfastCookingHeat(game: GameState): CookingHeat | null {
  if (game.morning.step !== 'finished' || game.morning.breakfast !== 'cook') return null;
  const heat = morning(game).cookingHeat;
  return heat === 'gentle' || heat === 'quick' ? heat : null;
}

export function canBeginBreakfastCooking(game: GameState): boolean {
  return game.phase === 'prep' && game.morning.day === game.day &&
    game.morning.step === 'awake' && !isCookingBreakfast(game) &&
    [game.cash, game.city.minutes, game.city.energy].every(Number.isFinite) &&
    game.cash >= BREAKFAST_OPTIONS.cook.cost && game.city.energy >= 1 &&
    game.city.minutes + 25 <= 1260;
}

export function beginBreakfastCooking(game: GameState): GameState {
  if (!canBeginBreakfastCooking(game)) return game;
  const prepared: CookingMorning = { ...game.morning, cookingStage: 'pan' };
  return {
    ...game,
    city: {
      ...game.city,
      minutes: game.city.minutes + 5,
      energy: game.city.energy - 1,
      journal: [`Ngày ${game.day} · Vo gạo, rửa trứng và chuẩn bị chảo (5 phút).`, ...game.city.journal].slice(0, 24),
    },
    morning: prepared,
    notice: 'Đã chuẩn bị chảo! Chọn cách chiên trứng, hoặc đổi sang bữa sáng khác.',
  };
}

export function canFinishBreakfastCooking(game: GameState, heat: CookingHeat): boolean {
  const style = COOKING_STYLES[heat];
  return Boolean(style) && isCookingBreakfast(game) &&
    [game.cash, game.city.minutes, game.city.energy].every(Number.isFinite) &&
    game.cash >= BREAKFAST_OPTIONS.cook.cost && game.city.energy >= 0 &&
    game.city.minutes + style.minutes <= 1260;
}

export function finishBreakfastCooking(game: GameState, heat: CookingHeat): GameState {
  if (!canFinishBreakfastCooking(game, heat)) return game;
  const style = COOKING_STYLES[heat];
  const paid = chooseBreakfast(game, 'cook');
  if (paid.morning.step !== 'finished') return game;
  const finished: CookingMorning = {
    ...paid.morning, cookingStage: undefined, cookingHeat: heat, satiety: style.satiety,
  };
  return {
    ...paid,
    city: {
      ...paid.city,
      minutes: game.city.minutes + style.minutes,
      energy: Math.min(100, game.city.energy + style.energy),
      journal: [`Ngày ${game.day} · ${style.label} (14.000 ₫). Độ no ${style.satiety}/100.`, ...paid.city.journal.slice(1)].slice(0, 24),
    },
    morning: finished,
    notice: `${style.label}. Độ no ${style.satiety}/100. Giờ có thể mở tiệm!`,
  };
}
