import type { GameState } from '../types';
import { morningActionBlock } from './morningAction';

export type HaChoice = 'help' | 'chat';
const PREFIX = 'neighbor-ha:';

export const HA_OPTIONS = {
  help: { label: 'Phụ chị Hà chuyển thùng rau', minutes: 12, energy: 3, satiety: 25, goodwill: 1 },
  chat: { label: 'Ngồi trò chuyện một chút', minutes: 4, energy: 0, satiety: 0, goodwill: 0 },
} as const;

export function haChoice(game: GameState, day = game.day): HaChoice | null {
  const key = PREFIX + day + ':';
  const found = game.city.stories.choices.find(item => item.startsWith(key))?.slice(key.length);
  return found === 'help' || found === 'chat' ? found : null;
}

export function haYesterdayReply(game: GameState): string | null {
  if (game.day < 2) return null;
  const previous = haChoice(game, game.day - 1);
  if (previous === 'help') return 'Chị Hà nhớ hôm qua bạn phụ chuyển rau: “Hôm nay ăn uống tử tế nhé, có gì cứ ghé chị.”';
  if (previous === 'chat') return 'Chị Hà nhớ buổi trò chuyện hôm qua: “Chuyện tiệm hôm nay thế nào rồi?”';
  return null;
}

export function canVisitHa(game: GameState): boolean {
  return game.phase === 'prep' && game.morning.day === game.day &&
    game.morning.step === 'finished' && game.morning.satiety < 60 &&
    haChoice(game) === null;
}

export function chooseHa(game: GameState, choice: HaChoice): GameState {
  if (!canVisitHa(game)) return game;
  const option = HA_OPTIONS[choice];
  if (!option) return game;
  const blocked = morningActionBlock(game, 0, option.minutes, option.energy);
  if (blocked) return { ...game, notice: blocked };
  const remembered = game.city.stories.choices.some(item => item.startsWith(PREFIX) && !item.startsWith(PREFIX + game.day + ':'));
  const reply = choice === 'help'
    ? remembered
      ? 'Chị Hà: “Lại giúp chị à? Cảm ơn nhé! Đây, ăn bát cơm nóng rồi hẵng mở tiệm.”'
      : 'Chị Hà: “Cảm ơn em đã phụ chuyển rau. Chị mời bát cơm nóng, không lấy tiền đâu.”'
    : remembered
      ? 'Chị Hà: “Lâu rồi mới ngồi nói chuyện tiếp. Khi nào rảnh lại ghé nhé.”'
      : 'Chị Hà: “Tiệm mới bận lắm nhỉ? Cứ từ từ thôi, đừng quên chăm mình.”';
  return {
    ...game,
    morning: { ...game.morning, satiety: Math.min(100, game.morning.satiety + option.satiety) },
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy - option.energy,
      goodwill: Math.min(100000, game.city.goodwill + option.goodwill),
      stories: {
        ...game.city.stories,
        choices: [...game.city.stories.choices, PREFIX + game.day + ':' + choice].slice(-100),
      },
      journal: [`Ngày ${game.day} · Chị Hà: ${option.label.toLowerCase()} · 0 ₫.`, ...game.city.journal].slice(0, 24),
    },
    customerBond: { ...game.customerBond, 'neighbor-ha': (game.customerBond['neighbor-ha'] ?? 0) + 1 },
    storyLog: [{
      id: `neighbor-ha-${game.day}`, customerId: 'neighbor-ha', customerName: 'Chị Hà',
      title: 'Bữa cơm đầu ngõ', text: reply, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: reply,
  };
}
