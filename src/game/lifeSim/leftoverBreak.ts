import type { GameState } from '../types';

type MealMemory = GameState['morning'] & { leftoverBreakUsed?: boolean };
const used = (game: GameState) => (game.morning as MealMemory).leftoverBreakUsed === true;

/** One spare portion from a leftover breakfast; never duplicates on reload. */
export function canEatLeftoverBreak(game: GameState): boolean {
  return game.phase === 'open' && Boolean(game.currentOrder) &&
    game.morning.day === game.day && game.morning.step === 'finished' &&
    game.morning.breakfast === 'leftovers' && !used(game) &&
    game.morning.shiftBreakOrder !== game.served &&
    [game.city.minutes, game.city.energy, game.morning.satiety].every(Number.isFinite) &&
    game.city.minutes >= 0 && game.city.minutes + 6 <= 1260 &&
    game.city.energy >= 0 && game.city.energy <= 100 &&
    game.morning.satiety >= 0 && game.morning.satiety <= 100 &&
    (game.morning.satiety < 100 || game.city.energy < 100);
}

export function eatLeftoverBreak(game: GameState): GameState {
  if (!canEatLeftoverBreak(game)) return game;
  return {
    ...game,
    morning: { ...game.morning, leftoverBreakUsed: true,
      shiftBreakOrder: game.served,
      satiety: Math.min(100, game.morning.satiety + 20) },
    city: { ...game.city, minutes: game.city.minutes + 6,
      energy: Math.min(100, game.city.energy + 2),
      journal: [`Ngày ${game.day} · Ăn phần cơm nguội còn lại ở quầy (6 phút, 0 ₫).`,
        ...game.city.journal].slice(0, 24) },
    notice: 'Ăn phần cơm nguội mang theo. Đỡ đói rồi, tiếp tục bán trà nhé!',
  };
}
