import type { GameState } from '../types';

export type MarketChoice = 'fruit' | 'chat' | 'leave';

export const MARKET_OPTIONS = {
  fruit: { label: 'Mua trái cây cô Hạnh', cost: 12000, minutes: 8, satiety: 12, bond: 1, reply: 'Cô Hạnh: “Quả vừa về sáng nay đấy. Nhớ ăn giữa ca cho có sức nhé!”' },
  chat: { label: 'Hỏi thăm cô Hạnh', cost: 0, minutes: 5, satiety: 0, bond: 2, reply: 'Cô Hạnh: “Hôm nay cô bán hơi chậm. Cảm ơn cháu đã hỏi thăm!”' },
  leave: { label: 'Đi thẳng tới tiệm', cost: 0, minutes: 0, satiety: 0, bond: 0, reply: 'Bạn chào cô Hạnh từ xa rồi đi mở cửa tiệm.' },
} as const;

export function marketChoice(game: GameState): MarketChoice | null {
  const choice = (game.morning as typeof game.morning & { marketVisit?: unknown }).marketVisit;
  return choice === 'fruit' || choice === 'chat' || choice === 'leave' ? choice : null;
}

export function visitMorningMarket(game: GameState, choice: MarketChoice): GameState {
  const morning = game.morning;
  if (game.phase !== 'prep' || morning.day !== game.day ||
      morning.step !== 'finished' || marketChoice(game) !== null) return game;
  const option = MARKET_OPTIONS[choice];
  if (!option) return game;
  if (game.cash < option.cost) return {
    ...game, notice: 'Chưa đủ tiền mua trái cây. Cô Hạnh vẫn vui nếu mình hỏi thăm.',
  };
  const stories = game.city.stories;
  return {
    ...game,
    cash: game.cash - option.cost,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      journal: [`Ngày ${game.day} · ${option.label} · ${option.reply}`, ...game.city.journal].slice(0, 24),
      stories: option.bond ? {
        ...stories,
        bonds: { ...stories.bonds, hanh: Math.min(1000, (stories.bonds.hanh ?? 0) + option.bond) },
      } : stories,
    },
    morning: {
      ...morning,
      marketVisit: choice,
      satiety: Math.min(100, morning.satiety + option.satiety),
    },
    notice: option.reply,
  };
}
