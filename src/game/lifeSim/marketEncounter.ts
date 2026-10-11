import type { GameState } from '../types';
export type MarketChoice = 'fruit' | 'chat' | 'leave';
export const MARKET_OPTIONS = {
  fruit: { label: 'Mua trái cây cô Hạnh', cost: 12000, minutes: 8, food: 12, bond: 1 },
  chat: { label: 'Hỏi thăm cô Hạnh', cost: 0, minutes: 5, food: 0, bond: 2 },
  leave: { label: 'Đi thẳng tới tiệm', cost: 0, minutes: 0, food: 0, bond: 0 },
} as const;
export function marketChoice(game: GameState): MarketChoice | null {
  const value = game.morning.marketVisit;
  return value === 'fruit' || value === 'chat' || value === 'leave' ? value : null;
}
