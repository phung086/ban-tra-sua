import type { GameState } from '../types';

export type FriendMealChoice = 'split' | 'host' | 'decline';

export function friendMealForDay(game: GameState): FriendMealChoice | null {
  void game;
  return null;
}
