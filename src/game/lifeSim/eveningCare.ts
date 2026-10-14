import type { GameState } from '../types';

export type EveningCareChoice = 'dinner' | 'help' | 'rest';

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
  rest: {
    label: '💌 Nhắn Hà rồi về nghỉ',
    minutes: 0, cost: 0, energy: 6, goodwill: 1,
    text: 'Bạn nhắn Hà rằng hôm nay hơi mệt và muốn về nghỉ. Hà chúc bạn ngủ ngon.',
    nextMorning: 'Hà nhắn: “Nghỉ được là tốt rồi. Hôm nay có gì cần thì cứ gọi mình.”',
  },
};

const CHOICES: readonly EveningCareChoice[] = ['dinner', 'help', 'rest'];
const eventId = (day: number, choice: EveningCareChoice) => `evening-ha-${day}-${choice}`;

/** One choice after a completed shift; existing save-v3 ledgers persist it across reloads. */
export function getEveningCareChoice(game: GameState, day = game.day): EveningCareChoice | null {
  if (!Number.isSafeInteger(day) || day < 1) return null;
  return CHOICES.find(choice => game.relationshipRewardIds.includes(eventId(day, choice)) ||
    game.storyLog.some(moment => moment.id === eventId(day, choice))) ?? null;
}

export function canChooseEveningCare(game: GameState, choice: EveningCareChoice): boolean {
  if (!CHOICES.includes(choice) || game.phase !== 'summary' ||
    game.summary?.day !== game.day || !Number.isSafeInteger(game.day) ||
    game.day < 1 || getEveningCareChoice(game)) return false;
  if (![game.cash, game.city.minutes, game.city.energy, game.city.goodwill].every(Number.isFinite) ||
    game.cash < 0 || game.city.energy < 0 || game.city.energy > 100 ||
    game.city.minutes < 0 || game.city.minutes > 1260) return false;
  if (choice === 'rest') return true; // Late, broke or exhausted players can always finish safely.
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
  if (game.phase !== 'prep' || game.morning.day !== game.day || game.day < 2) return null;
  const choice = getEveningCareChoice(game, game.day - 1);
  return choice ? EVENING_CARE[choice].nextMorning : null;
}
