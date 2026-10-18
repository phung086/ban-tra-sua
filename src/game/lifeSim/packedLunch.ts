import type { GameState } from '../types';

type PackedLunchMemory = GameState['morning'] & { packedLunchEaten?: boolean };
const alreadyEaten = (game: GameState) => (game.morning as PackedLunchMemory).packedLunchEaten === true;

/**
 * The lunchbox is bought and prepared at home, then eaten at the tea counter.
 * Eating it must never charge money twice or duplicate food after a reload.
 */
export function canEatPackedLunch(game: GameState): boolean {
  return game.phase === 'open' && Boolean(game.currentOrder) &&
    game.morning.day === game.day && game.morning.step === 'finished' &&
    game.morning.lunchPrep === 'lunchbox' && !alreadyEaten(game) &&
    game.morning.shiftBreakOrder !== game.served &&
    [game.city.minutes, game.city.energy, game.morning.satiety].every(Number.isFinite) &&
    game.city.minutes >= 0 && game.city.minutes + 10 <= 1260 &&
    game.city.energy >= 0 && game.city.energy <= 100 &&
    game.morning.satiety >= 0 && game.morning.satiety <= 100 &&
    (game.morning.satiety < 100 || game.city.energy < 100);
}

export function eatPackedLunch(game: GameState): GameState {
  if (!canEatPackedLunch(game)) return game;
  return {
    ...game,
    morning: {
      ...game.morning,
      packedLunchEaten: true,
      shiftBreakOrder: game.served,
      satiety: Math.min(100, game.morning.satiety + 30),
    } as PackedLunchMemory,
    city: {
      ...game.city,
      minutes: game.city.minutes + 10,
      energy: Math.min(100, game.city.energy + 4),
      journal: [
        `Ngày ${game.day} · Ăn cơm hộp đã chuẩn bị ở nhà (10 phút, không trả thêm tiền).`,
        ...game.city.journal,
      ].slice(0, 24),
    },
    notice: 'Ăn cơm hộp mang theo. No bụng hơn để tiếp tục pha và giao trà!',
  };
}
