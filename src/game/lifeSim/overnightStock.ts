import { RESTOCK_ITEMS } from '../content';
import type { GameState } from '../types';

export type OvernightStockChoice = 'chill' | 'sort' | 'leave';

export const OVERNIGHT_STOCK_OPTIONS = {
  chill: {
    label: '🧊 Thêm đá, cất topping vào tủ mát',
    cost: 3000, minutes: 10, energy: 2, freshness: 12,
  },
  sort: {
    label: '📦 Kiểm tra và xếp lại nguyên liệu',
    cost: 0, minutes: 5, energy: 1, freshness: 4,
  },
  leave: {
    label: '🌙 Để nguyên, về nghỉ',
    cost: 0, minutes: 0, energy: 0, freshness: 0,
  },
} as const;

const CHOICES: readonly OvernightStockChoice[] = ['chill', 'sort', 'leave'];
const eventId = (day: number, choice: OvernightStockChoice) =>
  `overnight-stock-${day}-${choice}`;

export function getOvernightStockChoice(game: GameState, day = game.day): OvernightStockChoice | null {
  if (!Number.isSafeInteger(day) || day < 1) return null;
  return CHOICES.find(choice => game.relationshipRewardIds.includes(eventId(day, choice))) ?? null;
}

export function perishableStock(game: GameState) {
  return RESTOCK_ITEMS.filter(item => item.perishable &&
    Number.isFinite(game.inventory[item.key]) && game.inventory[item.key] > 0);
}

export function canChooseOvernightStock(game: GameState, choice: OvernightStockChoice): boolean {
  if (!CHOICES.includes(choice) || game.phase !== 'summary' ||
    game.summary?.day !== game.day || getOvernightStockChoice(game)) return false;
  const option = OVERNIGHT_STOCK_OPTIONS[choice];
  if (![game.cash, game.city.minutes, game.city.energy].every(Number.isFinite) ||
    game.cash < 0 || game.city.minutes < 0 || game.city.minutes > 1260 ||
    game.city.energy < 0 || game.city.energy > 100) return false;
  if (choice !== 'leave' && perishableStock(game).length === 0) return false;
  return game.cash >= option.cost &&
    game.city.minutes + option.minutes <= 1260 &&
    game.city.energy >= option.energy;
}

/** Save-v3 ledger makes the evening choice once-only; the normal nextDay decay uses the resulting freshness. */
export function chooseOvernightStock(game: GameState, choice: OvernightStockChoice): GameState {
  if (!canChooseOvernightStock(game, choice)) return game;
  const option = OVERNIGHT_STOCK_OPTIONS[choice];
  const freshness = { ...game.freshness };
  const stock = perishableStock(game);
  if (option.freshness > 0) {
    for (const item of stock) {
      const before = freshness[item.key];
      freshness[item.key] = Math.min(100, Math.max(0, Number.isFinite(before) ? before : 100) + option.freshness);
    }
  }
  const message = choice === 'chill'
    ? 'Đã cất nguyên liệu dễ hỏng vào tủ mát. Độ tươi được giữ tốt hơn qua đêm.'
    : choice === 'sort'
      ? 'Đã kiểm tra hạn dùng và xếp gọn nguyên liệu. Sáng mai đỡ hao hụt hơn.'
      : 'Bạn khóa cửa và về nghỉ. Nguyên liệu sẽ hao hụt theo nhịp thường lệ.';
  return {
    ...game,
    cash: game.cash - option.cost,
    freshness,
    dailyCost: game.dailyCost + option.cost,
    summary: { ...game.summary!, profit: game.summary!.profit - option.cost },
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy - option.energy,
      journal: [`Ngày ${game.day} · ${message}`, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, eventId(game.day, choice)],
    notice: message,
  };
}

export function getOvernightStockCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.day < 2 || game.morning.day !== game.day ||
    game.morning.step === 'asleep') return null;
  const choice = getOvernightStockChoice(game, game.day - 1);
  if (choice === 'chill') return 'Hôm qua đã bảo quản kỹ. Kiểm tra kho: topping còn tươi hơn và có thể pha tiếp.';
  if (choice === 'sort') return 'Hôm qua đã kiểm kê. Kho gọn gàng, nguyên liệu dễ hỏng được giữ tốt hơn.';
  if (choice === 'leave') return 'Hôm qua đã về nghỉ sớm. Nhớ kiểm tra hạn dùng trước khi mở quầy.';
  return null;
}
