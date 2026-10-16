import type { GameState } from '../types';
import { getEveningCareChoice } from './eveningCare';

export type HaPackagingChoice = 'buy' | 'fold' | 'rest';

export const HA_PACKAGING = {
  buy: {
    label: '🛍️ Mua giúp Hà hộp giấy',
    cost: 12000, minutes: 10, energy: -1, goodwill: 2,
    text: 'Bạn hỏi giá trước rồi mua thêm hộp giấy cho Hà chuẩn bị cơm mang đi. Hà ghi lại số tiền để lần sau chủ động hơn.',
    nextMorning: 'Hà cười: “Hộp giấy hôm qua vừa đủ cho mẻ cơm sáng. Cảm ơn bạn đã giúp mình tính trước.”',
  },
  fold: {
    label: '📦 Phụ Hà gấp hộp cơm',
    cost: 0, minutes: 15, energy: -3, goodwill: 2,
    text: 'Bạn ở lại gấp hộp và xếp muỗng cho Hà. Không tốn tiền nhưng hơi mỏi tay; hai người trò chuyện vui vẻ.',
    nextMorning: 'Hà vẫy tay: “Hôm qua gấp hộp nhanh ghê! Nhờ bạn mà sáng nay mình không cuống.”',
  },
  rest: {
    label: '🌙 Báo Hà rồi về nghỉ',
    cost: 0, minutes: 0, energy: 4, goodwill: 0,
    text: 'Bạn nhắn Hà rằng hôm nay cần nghỉ. Hà hiểu và tự sắp xếp phần việc còn lại.',
    nextMorning: 'Hà nhắn: “Hôm qua nghỉ ngơi ổn chứ? Đừng cố quá sức, mình tự lo được mà.”',
  },
} as const;

const CHOICES: readonly HaPackagingChoice[] = ['buy', 'fold', 'rest'];
const eventId = (day: number, choice: HaPackagingChoice) => 'ha-packaging-' + day + '-' + choice;

/** A day-seven follow-up is earned by resolving the missed promise on day six. */
export function isHaPackagingDue(game: GameState): boolean {
  return game.day === 7 &&
    ['repair', 'reconcile'].includes(getEveningCareChoice(game, 6) ?? '');
}

export function getHaPackagingChoice(game: GameState, day = game.day): HaPackagingChoice | null {
  if (!Number.isSafeInteger(day) || day < 1) return null;
  return CHOICES.find(choice =>
    game.relationshipRewardIds.includes(eventId(day, choice)) ||
    game.storyLog.some(item => item.id === eventId(day, choice))) ?? null;
}

export function canChooseHaPackaging(game: GameState, choice: HaPackagingChoice): boolean {
  if (!CHOICES.includes(choice) || game.phase !== 'summary' ||
    game.summary?.day !== game.day || !isHaPackagingDue(game) ||
    getHaPackagingChoice(game)) return false;
  const { cash, city } = game;
  if (![cash, city.minutes, city.energy, city.goodwill].every(Number.isFinite) ||
    cash < 0 || city.minutes < 0 || city.minutes > 1260 ||
    city.energy < 0 || city.energy > 100) return false;
  const outcome = HA_PACKAGING[choice];
  return cash >= outcome.cost &&
    city.minutes + outcome.minutes <= 1260 &&
    city.energy + outcome.energy >= 0;
}

export function chooseHaPackaging(game: GameState, choice: HaPackagingChoice): GameState {
  if (!canChooseHaPackaging(game, choice)) return game;
  const outcome = HA_PACKAGING[choice];
  const id = eventId(game.day, choice);
  return {
    ...game,
    cash: game.cash - outcome.cost,
    city: {
      ...game.city,
      minutes: game.city.minutes + outcome.minutes,
      energy: Math.min(100, Math.max(0, game.city.energy + outcome.energy)),
      goodwill: game.city.goodwill + outcome.goodwill,
      journal: ['Ngày ' + game.day + ' · ' + outcome.text, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: 'neighbor-ha', customerName: 'Hà',
      title: 'Chuẩn bị hộp cơm cùng Hà', text: outcome.text,
      day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: outcome.text,
  };
}

export function getHaPackagingCallback(game: GameState): string | null {
  if (game.day !== 8 || game.phase !== 'prep' ||
    game.morning.day !== game.day || game.morning.step === 'asleep') return null;
  const choice = getHaPackagingChoice(game, 7);
  return choice ? HA_PACKAGING[choice].nextMorning : null;
}
