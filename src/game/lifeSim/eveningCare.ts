import type { GameState } from '../types';

export type EveningCareChoice = 'dinner' | 'help' | 'rest' | 'thanks' | 'postpone' | 'apologize';

interface EveningOutcome {
  label: string;
  minutes: number;
  cost: number;
  energy: number;
  goodwill: number;
  text: string;
  nextMorning: string;
}

export const EVENING_CARE: Record<EveningCareChoice, EveningOutcome> = {
  dinner: {
    label: '🍚 Ăn cơm tối ở quán Hà',
    minutes: 20, cost: 22000, energy: 12, goodwill: 2,
    text: 'Bạn hỏi giá trước rồi ăn một suất cơm nóng ở quán Hà. Hai người kể chuyện một ngày bán hàng.',
    nextMorning: 'Hà vẫy tay từ đầu ngõ: “Hôm qua ăn được không? Hôm nay nhớ uống đủ nước nhé!”',
  },
  help: {
    label: '🧹 Giúp Hà dọn quán',
    minutes: 15, cost: 0, energy: -4, goodwill: 3,
    text: 'Bạn phụ Hà xếp ghế và lau bàn một lát. Hà cảm ơn, hẹn hôm khác cùng ăn cơm.',
    nextMorning: 'Hà để sẵn chiếc ghế trước cửa: “Hôm qua nhờ bạn mà mình đóng quán kịp giờ.”',
  },
  thanks: {
    label: '🍱 Nhận suất cơm Hà cảm ơn',
    minutes: 15, cost: 0, energy: 10, goodwill: 2,
    text: 'Hà nhớ lần bạn phụ dọn quán hai hôm trước. Hôm nay Hà để dành một suất cơm nóng để cảm ơn, không lấy tiền.',
    nextMorning: 'Hà cười: “Hôm qua ăn cơm ngon nhé. Có qua có lại, xóm mình mới vui.”',
  },
  postpone: {
    label: '📅 Hẹn Hà ngày mai',
    minutes: 0, cost: 0, energy: 0, goodwill: 0,
    text: 'Bạn nhắn Hà rằng hôm nay chưa ghé được. Hà đồng ý giữ suất cơm đến tối mai.',
    nextMorning: 'Hà nhắn: “Tối nay mình vẫn giữ phần cơm nhé, nếu bạn tiện thì ghé.”',
  },
  apologize: {
    label: '💬 Xin lỗi Hà vì lỡ hẹn',
    minutes: 5, cost: 0, energy: 0, goodwill: 1,
    text: 'Bạn ghé quán và nhận lỗi vì đã lỡ cuộc hẹn. Hà hơi buồn nhưng vui vì bạn đã nói thật.',
    nextMorning: 'Hà mỉm cười: “Không sao, lần tới cứ báo mình sớm nhé. Mình vẫn là hàng xóm mà!”',
  },
  rest: {
    label: '💌 Nhắn Hà rồi về nghỉ',
    minutes: 0, cost: 0, energy: 6, goodwill: 1,
    text: 'Bạn nhắn Hà rằng hôm nay hơi mệt và muốn về nghỉ. Hà chúc bạn ngủ ngon.',
    nextMorning: 'Hà nhắn: “Nghỉ được là tốt rồi. Hôm nay có gì cần thì cứ gọi mình.”',
  },
};

const CHOICES: readonly EveningCareChoice[] = ['dinner', 'help', 'rest', 'thanks', 'postpone', 'apologize'];
const eventId = (day: number, choice: EveningCareChoice) => `evening-ha-${day}-${choice}`;

/** One choice after a completed shift; existing save-v3 ledgers persist it across reloads. */
export function getEveningCareChoice(game: GameState, day = game.day): EveningCareChoice | null {
  if (!Number.isSafeInteger(day) || day < 1) return null;
  return CHOICES.find(choice => game.relationshipRewardIds.includes(eventId(day, choice)) ||
    game.storyLog.some(moment => moment.id === eventId(day, choice))) ?? null;
}

/** An unkept one-day reschedule creates a next-day repair opportunity, never a debt. */
export function hasMissedHaPromise(game: GameState): boolean {
  return Number.isSafeInteger(game.day) && game.day >= 5 &&
    getEveningCareChoice(game, game.day - 4) === 'help' &&
    getEveningCareChoice(game, game.day - 2) === 'postpone' &&
    getEveningCareChoice(game, game.day - 1) !== 'thanks';
}

export function canChooseEveningCare(game: GameState, choice: EveningCareChoice): boolean {
  if (!CHOICES.includes(choice) || game.phase !== 'summary' ||
    game.summary?.day !== game.day || !Number.isSafeInteger(game.day) ||
    game.day < 1 || getEveningCareChoice(game)) return false;
  if (![game.cash, game.city.minutes, game.city.energy, game.city.goodwill].every(Number.isFinite) ||
    game.cash < 0 || game.city.energy < 0 || game.city.energy > 100 ||
    game.city.minutes < 0 || game.city.minutes > 1260) return false;
  // One invitation after helping, with a single explicit one-day postponement.
  // Declining or simply sleeping on the invitation day does not silently extend it.
  const directInvite = game.day >= 3 &&
    getEveningCareChoice(game, game.day - 2) === 'help';
  const rescheduledInvite = game.day >= 4 &&
    getEveningCareChoice(game, game.day - 3) === 'help' &&
    getEveningCareChoice(game, game.day - 1) === 'postpone';
  if (choice === 'thanks' && !directInvite && !rescheduledInvite) return false;
  if (choice === 'postpone' && !directInvite) return false;
  if (choice === 'apologize' && !hasMissedHaPromise(game)) return false;
  if (choice === 'rest' || choice === 'postpone') return true; // No-cost fallback, even late.
  const outcome = EVENING_CARE[choice];
  return game.cash >= outcome.cost &&
    game.city.minutes + outcome.minutes <= 1260 &&
    game.city.energy + outcome.energy >= 0;
}

export function chooseEveningCare(game: GameState, choice: EveningCareChoice): GameState {
  if (!canChooseEveningCare(game, choice)) return game;
  const outcome = EVENING_CARE[choice];
  const id = eventId(game.day, choice);
  return {
    ...game,
    cash: game.cash - outcome.cost,
    city: {
      ...game.city,
      minutes: game.city.minutes + outcome.minutes,
      energy: Math.max(0, Math.min(100, game.city.energy + outcome.energy)),
      goodwill: game.city.goodwill + outcome.goodwill,
      journal: [`Ngày ${game.day} · ${outcome.text}`, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id,
      customerId: 'neighbor-ha',
      customerName: 'Hà',
      title: 'Bữa tối cuối ca',
      text: outcome.text,
      day: game.day,
      rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: outcome.text,
  };
}

/** A specific, once-only callback appears after sleep, not on the same evening. */
export function getEveningCareCallback(game: GameState): string | null {
  // NPCs cannot send a morning greeting before the player has actually woken up.
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step === 'asleep' || game.day < 2) return null;
  const choice = getEveningCareChoice(game, game.day - 1);
  return choice ? EVENING_CARE[choice].nextMorning : null;
}
