import type { GameState } from '../types';

export type ShiftBreakChoice = 'snack' | 'rest';

export const SHIFT_BREAK_OPTIONS = {
  snack: {
    label: '🍌 Ăn chuối ở quầy',
    cost: 9000,
    minutes: 5,
    satiety: 24,
    energy: 2,
    description: 'No thêm để giữ sức cho những đơn tiếp theo.',
  },
  rest: {
    label: '🪑 Ngồi nghỉ và uống nước',
    cost: 0,
    minutes: 12,
    satiety: 0,
    energy: 6,
    description: 'Không tốn tiền nhưng mất 12 phút trong ngày.',
  },
} as const;

/** Only successful deliveries consume energy: no double charge on invalid orders. */
export function applyShiftFatigue(game: GameState): GameState {
  if (game.phase !== 'open' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' ||
      ![game.morning.satiety, game.city.energy].every(Number.isFinite) ||
      game.morning.satiety < 0 || game.morning.satiety > 100 ||
      game.city.energy < 0 || game.city.energy > 100) return game;
  const satiety = Math.max(0, Math.min(100, game.morning.satiety - 8));
  const energyCost = satiety >= 60 ? 1 : satiety >= 30 ? 2 : 4;
  return {
    ...game,
    morning: { ...game.morning, satiety },
    city: { ...game.city, energy: Math.max(0, game.city.energy - energyCost) },
  };
}

export function canTakeShiftBreak(game: GameState, choice: ShiftBreakChoice): boolean {
  const option = SHIFT_BREAK_OPTIONS[choice];
  if (!option || game.phase !== 'open' || !game.currentOrder ||
      game.morning.day !== game.day || game.morning.step !== 'finished' ||
      game.morning.shiftBreakOrder === game.served ||
      ![game.cash, game.city.minutes, game.city.energy, game.morning.satiety].every(Number.isFinite))
    return false;
  if (game.city.minutes + option.minutes > 1260 || game.cash < option.cost) return false;
  return choice === 'snack'
    ? game.morning.satiety < 100 || game.city.energy < 100
    : game.city.energy < 100;
}

/** A single meaningful break per customer order, persisted in the v3 morning state. */
export function takeShiftBreak(game: GameState, choice: ShiftBreakChoice): GameState {
  if (!canTakeShiftBreak(game, choice)) return game;
  const option = SHIFT_BREAK_OPTIONS[choice];
  return {
    ...game,
    cash: game.cash - option.cost,
    morning: {
      ...game.morning,
      satiety: Math.min(100, game.morning.satiety + option.satiety),
      shiftBreakOrder: game.served,
    },
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: Math.min(100, game.city.energy + option.energy),
      journal: [
        `Ngày ${game.day} · Nghỉ giữa ca: ${option.label} (${option.cost.toLocaleString('vi-VN')} ₫).`,
        ...game.city.journal,
      ].slice(0, 24),
    },
    notice: `${option.label}. ${option.description}`,
  };
}
