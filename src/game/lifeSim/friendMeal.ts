import type { GameState } from '../types';

export type FriendMealChoice = 'split' | 'host' | 'decline';

export const FRIEND_MEAL_OPTIONS = {
  split: { label: 'Chia đôi hóa đơn với Thảo', cost: 26000, minutes: 35, satiety: 25, energy: -3, bond: 1 },
  host: { label: 'Mời Thảo, mình trả cả bàn', cost: 52000, minutes: 35, satiety: 25, energy: -3, bond: 2 },
  decline: { label: 'Hẹn Thảo hôm khác', cost: 0, minutes: 2, satiety: 0, energy: 0, bond: 0 },
} as const;

const PREFIX = 'friend-thao-meal:';

/** The v3 relationship ledger survives reload and resets by game day. */
export function friendMealForDay(game: GameState): FriendMealChoice | null {
  const marker = PREFIX + game.day + ':';
  const entry = game.relationshipRewardIds.find(id => id.startsWith(marker));
  const choice = entry?.slice(marker.length);
  return choice === 'split' || choice === 'host' || choice === 'decline' ? choice : null;
}

/** An invitation never spends money until the player explicitly confirms. */
export function chooseFriendMeal(game: GameState, choice: FriendMealChoice): GameState {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || friendMealForDay(game) !== null) return game;
  const option = FRIEND_MEAL_OPTIONS[choice];
  if (!option) return game;
  if (game.cash < option.cost) return {
    ...game, notice: 'Chưa đủ tiền. Mình có thể chia hóa đơn hoặc hẹn Thảo hôm khác.',
  };
  const response = choice === 'decline'
    ? 'Thảo: Không sao, khi nào rảnh mình gặp nhé.'
    : choice === 'split'
      ? 'Thảo: Chia đôi rõ ràng thế này thoải mái cho cả hai!'
      : 'Thảo: Cảm ơn nhé, lần sau để mình mời lại!';
  const remembered = game.relationshipRewardIds.some(id => id.startsWith(PREFIX));
  const notice = response + (remembered ? ' Thảo vẫn nhớ lần hai đứa hẹn nhau trước đó.' : '');
  return {
    ...game,
    cash: game.cash - option.cost,
    customerBond: {
      ...game.customerBond,
      'friend-thao': (game.customerBond['friend-thao'] ?? 0) + option.bond,
    },
    relationshipRewardIds: [...game.relationshipRewardIds, PREFIX + game.day + ':' + choice],
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      energy: Math.max(0, Math.min(100, game.city.energy + option.energy)),
      journal: [`Ngày ${game.day} · ${option.label} (${option.cost.toLocaleString('vi-VN')} ₫). ${notice}`, ...game.city.journal].slice(0, 24),
    },
    morning: { ...game.morning, satiety: Math.min(100, game.morning.satiety + option.satiety) },
    notice,
  };
}
