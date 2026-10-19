import type { GameState } from '../types';

/**
 * Follows through on the existing father Quang promise, without a new save key.
 * A weekend appointment is optional and may be postponed indefinitely.
 */
export type FatherSignChoice = 'repair' | 'clean' | 'postpone';

export const FATHER_SIGN_OPTIONS = {
  repair: {
    label: '🔧 Cùng bố thay ốc và sửa biển',
    cost: 12000, minutes: 25, energy: -4, bond: 3, goodwill: 1, fans: 2,
    reply: 'Hai bố con mua ít ốc mới, siết lại biển hiệu và lau sạch bảng tên. Bố Quang cười: “Vậy là yên tâm rồi!”',
    callback: 'Bố Quang nhắn: “Biển hiệu sáng hẳn. Hôm qua làm cùng con vui lắm!”',
  },
  clean: {
    label: '🧽 Cùng bố lau lại biển cũ',
    cost: 0, minutes: 15, energy: -2, bond: 2, goodwill: 0, fans: 1,
    reply: 'Chưa cần mua đồ mới. Hai bố con lau sạch biển hiệu và kiểm tra chỗ bắt vít còn chắc.',
    callback: 'Bố Quang nhắn: “Biển hiệu sạch rồi. Để dành tiền nhập trà nhé con!”',
  },
  postpone: {
    label: '💌 Báo bố hẹn cuối tuần sau',
    cost: 0, minutes: 0, energy: 0, bond: 0, goodwill: 0, fans: 0,
    reply: 'Bạn nhắn bố rằng hôm nay chưa đủ sức hoặc thời gian. Bố đồng ý hẹn cuối tuần sau, không trách.',
    callback: 'Bố Quang nhắn: “Cuối tuần sau nếu con rảnh thì mình xem biển hiệu nhé.”',
  },
} as const;

const PROMISE = 'family-father-quang-sign';
const COMPLETED = 'family-father-quang-sign:completed';
const CHOICES: readonly FatherSignChoice[] = ['repair', 'clean', 'postpone'];
const eventId = (day: number, choice: FatherSignChoice) =>
  'family-father-quang-sign:day:' + day + ':' + choice;

export function getFatherSignChoice(game: GameState, day = game.day): FatherSignChoice | null {
  if (!Number.isSafeInteger(day) || day < 1) return null;
  return CHOICES.find(choice => game.relationshipRewardIds?.includes(eventId(day, choice))) ?? null;
}

export function isFatherSignDue(game: GameState): boolean {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || !Number.isSafeInteger(game.day) ||
      game.day < 7 || game.day % 7 !== 0 ||
      !game.relationshipRewardIds?.includes(PROMISE)) return false;
  // Keep today's outcome visible even when the appointment was completed.
  return !game.relationshipRewardIds.includes(COMPLETED) || getFatherSignChoice(game) !== null;
}

export function canChooseFatherSign(game: GameState, choice: FatherSignChoice): boolean {
  if (!CHOICES.includes(choice) || !isFatherSignDue(game) ||
      getFatherSignChoice(game) !== null ||
      game.relationshipRewardIds.includes(COMPLETED)) return false;
  if (![game.cash, game.city.minutes, game.city.energy, game.city.goodwill, game.fans]
      .every(Number.isFinite) || game.cash < 0 ||
      game.city.minutes < 0 || game.city.minutes > 1260 ||
      game.city.energy < 0 || game.city.energy > 100) return false;
  if (choice === 'postpone') return true; // No forced purchase or energy softlock.
  const option = FATHER_SIGN_OPTIONS[choice];
  return game.cash >= option.cost &&
    game.city.energy >= -option.energy &&
    game.city.minutes + option.minutes <= 1260;
}

export function chooseFatherSign(game: GameState, choice: FatherSignChoice): GameState {
  if (!canChooseFatherSign(game, choice)) return game;
  const option = FATHER_SIGN_OPTIONS[choice];
  const id = eventId(game.day, choice);
  const completed = choice !== 'postpone';
  return {
    ...game,
    cash: game.cash - option.cost,
    fans: game.fans + option.fans,
    customerBond: {
      ...game.customerBond,
      'family-father-quang': (game.customerBond['family-father-quang'] ?? 0) + option.bond,
    },
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy + option.energy,
      goodwill: game.city.goodwill + option.goodwill,
      journal: ['Ngày ' + game.day + ' · ' + option.reply, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [
      ...game.relationshipRewardIds,
      id,
      ...(completed ? [COMPLETED] : []),
    ],
    storyLog: [{
      id, customerId: 'family-father-quang', customerName: 'Bố Quang',
      title: 'Lời hẹn sửa biển hiệu', text: option.reply,
      day: game.day, rewardFans: option.fans,
    }, ...game.storyLog].slice(0, 24),
    notice: option.reply,
  };
}

export function getFatherSignCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step === 'asleep' || game.day < 8) return null;
  const choice = getFatherSignChoice(game, game.day - 1);
  return choice ? FATHER_SIGN_OPTIONS[choice].callback : null;
}
