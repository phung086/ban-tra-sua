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

export function visitMorningMarket(game: GameState, choice: MarketChoice): GameState {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step !== 'finished' || marketChoice(game) !== null) return game;
  const option = MARKET_OPTIONS[choice];
  if (!option) return game;
  if (game.cash < option.cost) return {
    ...game, notice: 'Chưa đủ tiền mua trái cây; có thể hỏi thăm miễn phí.',
  };
  const reply = choice === 'fruit'
    ? 'Cô Hạnh: Trái cây mới về sáng nay, nhớ ăn giữa ca nhé!'
    : choice === 'chat'
      ? 'Cô Hạnh: Hôm nay chợ vắng. Cảm ơn cháu đã hỏi thăm.'
      : 'Bạn chào cô Hạnh rồi đi mở cửa tiệm.';
  return {
    ...game,
    cash: game.cash - option.cost,
    morning: {
      ...game.morning, marketVisit: choice,
      satiety: Math.min(100, game.morning.satiety + option.food),
    },
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      journal: [`Ngày ${game.day}: ${option.label}. ${reply}`, ...game.city.journal].slice(0, 24),
      stories: {
        ...game.city.stories,
        bonds: {
          ...game.city.stories.bonds,
          hanh: Math.min(1000, (game.city.stories.bonds.hanh ?? 0) + option.bond),
        },
      },
    },
    notice: reply,
  };
}
