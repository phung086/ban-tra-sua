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
