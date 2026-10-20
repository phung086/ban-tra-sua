import {morningActionBlock} from './morningAction';
import {hanhFruitDiscount} from './hanhHelpPromise';
import type { GameState } from '../types';

/** Daily market choices are persisted in morning state, not ephemeral UI state. */
export type MarketChoice = 'fruit' | 'chat' | 'leave';

export const MARKET_OPTIONS = {
  fruit: { label: 'Mua trái cây cô Hạnh', cost: 12000, minutes: 8, food: 12, bond: 1 },
  chat: { label: 'Hỏi thăm cô Hạnh', cost: 0, minutes: 5, food: 0, bond: 2 },
  leave: { label: 'Đi thẳng tới tiệm', cost: 0, minutes: 0, food: 0, bond: 0 },
} as const;

/** Real price for the current visit, including a one-day NPC promise discount. */
export function marketPrice(
  game: Pick<GameState, 'day' | 'relationshipRewardIds'>,
  choice: MarketChoice,
): number {
  return choice === 'fruit' ? MARKET_OPTIONS.fruit.cost - hanhFruitDiscount(game) : MARKET_OPTIONS[choice].cost;
}

export function marketChoice(game: GameState): MarketChoice | null {
  const value = game.morning.marketVisit;
  return value === 'fruit' || value === 'chat' || value === 'leave' ? value : null;
}

export function marketDialogue(choice: MarketChoice, hanhBond = 0): string {
  switch (choice) {
    case 'fruit': return hanhBond >= 4
      ? 'Cô Hạnh: Khách quen của cô đây rồi! Cô chọn trái cây tươi nhất cho cháu nhé.'
      : 'Cô Hạnh: Trái cây mới về sáng nay, nhớ ăn giữa ca nhé!';
    case 'chat': return hanhBond >= 4
      ? 'Cô Hạnh: Lại gặp cháu rồi! Hôm qua cháu hỏi thăm, cô vui cả ngày đấy.'
      : 'Cô Hạnh: Hôm nay chợ vắng. Cảm ơn cháu đã hỏi thăm.';
    case 'leave': return 'Bạn chào cô Hạnh rồi đi mở cửa tiệm.';
  }
}

export function visitMorningMarket(game: GameState, choice: MarketChoice): GameState {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step !== 'finished' || game.morning.marketVisit != null) return game;
  const option = MARKET_OPTIONS[choice];
  if (!option) return game;
  const cost = marketPrice(game, choice);
  if (game.cash < cost) return {
    ...game, notice: 'Chưa đủ tiền mua trái cây; có thể hỏi thăm miễn phí.',
  };
  const blocked=morningActionBlock(game,cost,option.minutes);
  if(blocked)return {...game,notice:blocked};
  const hanhBond = Math.min(1000, (game.city.stories.bonds.hanh ?? 0) + option.bond);
  const discount = choice === 'fruit' ? hanhFruitDiscount(game) : 0;
  const reply = marketDialogue(choice, hanhBond) +
    (discount ? ` Cô Hạnh bớt ${discount.toLocaleString('vi-VN')} ₫ vì cháu giữ lời hẹn.` : '');
  return {
    ...game,
    cash: game.cash - cost,
    morning: {
      ...game.morning, marketVisit: choice,
      satiety: Math.min(100, game.morning.satiety + option.food),
    },
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + option.minutes),
      journal: [`Ngày ${game.day}: ${option.label} (${cost.toLocaleString('vi-VN')} ₫). ${reply}`, ...game.city.journal].slice(0, 24),
      stories: {
        ...game.city.stories,
        bonds: {
          ...game.city.stories.bonds,
          hanh: hanhBond,
        },
      },
    },
    notice: reply,
  };
}
