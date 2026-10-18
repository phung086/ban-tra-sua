import type { GameState } from '../types';

const DRINK_MINUTES = 4;
const ENERGY_GAIN = 3;

/** A bottle prepared at home can be used once during a real tea shift. */
export function canDrinkPackedWater(game: GameState): boolean {
  const { morning, city } = game;
  return game.phase === 'open' && Boolean(game.currentOrder) &&
    morning.day === game.day && morning.step === 'finished' &&
    morning.lunchPrep === 'water' && morning.packedWaterDrunk !== true &&
    morning.shiftBreakOrder !== game.served &&
    [city.minutes, city.energy, morning.satiety].every(Number.isFinite) &&
    city.minutes >= 0 && city.minutes + DRINK_MINUTES <= 1260 &&
    city.energy >= 0 && city.energy < 100 &&
    morning.satiety >= 0 && morning.satiety <= 100;
}

/** No extra purchase, no duplicate stamina, no new save schema. */
export function drinkPackedWater(game: GameState): GameState {
  if (!canDrinkPackedWater(game)) return game;
  return {
    ...game,
    morning: {
      ...game.morning,
      packedWaterDrunk: true,
      shiftBreakOrder: game.served,
    },
    city: {
      ...game.city,
      minutes: game.city.minutes + DRINK_MINUTES,
      energy: Math.min(100, game.city.energy + ENERGY_GAIN),
      journal: [
        `Ngày ${game.day} · Uống nước lọc đã mang từ nhà (4 phút, 0 ₫).`,
        ...game.city.journal,
      ].slice(0, 24),
    },
    notice: 'Uống nước lọc mang theo. Đỡ mệt hơn để pha và giao ly tiếp theo!',
  };
}
