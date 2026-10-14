import type { GameState } from '../types';

/** One optional, persistent family beat during the first week; no save-schema migration. */
const MEMORY_PREFIX = 'family-an-morning:';
const BOND_KEY = 'family-sibling-an';
const FIRST_DAY = 2;
const LAST_DAY = 7;

export const AN_CALL_CHOICES = {
  fare: {
    label: 'Gửi An tiền xe buýt',
    cost: 12000,
    minutes: 5,
    energy: 0,
    bond: 2,
    response: 'An nhắn cảm ơn, rồi vội chạy ra bến xe.',
    tomorrow: 'An khoe đã kịp tiết học đầu. Em bảo sẽ tự để dành tiền xe tuần sau.',
  },
  guide: {
    label: 'Chỉ An chuyến xe kế tiếp',
    cost: 0,
    minutes: 10,
    energy: 1,
    bond: 1,
    response: 'Hai chị em cùng xem tuyến đường. An đã bình tĩnh hơn.',
    tomorrow: 'An nhắn: “Em tìm được tuyến mới rồi. Lần sau em tự tra thử!”',
  },
  later: {
    label: 'Nhắn sẽ hỏi thăm sau ca',
    cost: 0,
    minutes: 0,
    energy: 0,
    bond: 0,
    response: 'An đã xem tin nhắn. Hôm nay mình cần ưu tiên công việc.',
    tomorrow: 'An nhắn đã tự tìm được đường. Em vẫn mong lần sau được nói chuyện lâu hơn.',
  },
} as const;

export type AnCallChoice = keyof typeof AN_CALL_CHOICES;
export interface AnCallMemory { day: number; choice: AnCallChoice }

export function getAnCallMemory(game: GameState): AnCallMemory | null {
  for (const id of game.relationshipRewardIds) {
    const match = /^family-an-morning:(\d+):(fare|guide|later)$/.exec(id);
    if (!match) continue;
    const day = Number(match[1]);
    if (Number.isSafeInteger(day) && day >= FIRST_DAY && day <= LAST_DAY)
      return { day, choice: match[2] as AnCallChoice };
  }
  return null;
}

export function canAnswerAnCall(game: GameState): boolean {
  return game.phase === 'prep' &&
    game.morning.day === game.day &&
    game.morning.step === 'finished' &&
    game.day >= FIRST_DAY && game.day <= LAST_DAY &&
    getAnCallMemory(game) === null;
}

export function canChooseAnCall(game: GameState, choice: AnCallChoice): boolean {
  if (!canAnswerAnCall(game) || !Object.prototype.hasOwnProperty.call(AN_CALL_CHOICES, choice)) return false;
  const option = AN_CALL_CHOICES[choice];
  return game.cash >= option.cost && game.city.energy >= option.energy &&
    game.city.minutes + option.minutes <= 1260;
}

export function answerAnCall(game: GameState, choice: AnCallChoice): GameState {
  if (!canAnswerAnCall(game) || !Object.prototype.hasOwnProperty.call(AN_CALL_CHOICES, choice)) return game;
  if (!canChooseAnCall(game, choice))
    return { ...game, notice: 'Không đủ tiền, sức hoặc thời gian. Bạn vẫn có thể nhắn An sau ca.' };
  const option = AN_CALL_CHOICES[choice];
  return {
    ...game,
    cash: game.cash - option.cost,
    customerBond: { ...game.customerBond, [BOND_KEY]: (game.customerBond[BOND_KEY] ?? 0) + option.bond },
    relationshipRewardIds: [...game.relationshipRewardIds, `${MEMORY_PREFIX}${game.day}:${choice}`],
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy - option.energy,
      journal: [`Ngày ${game.day} · An: ${option.label}.`, ...game.city.journal].slice(0, 24),
    },
    notice: option.response,
  };
}

export function getAnCallReply(game: GameState): string | null {
  const memory = getAnCallMemory(game);
  if (!memory || game.day !== memory.day + 1) return null;
  return AN_CALL_CHOICES[memory.choice].tomorrow;
}

export function getAnCallReceipt(game: GameState): string | null {
  const memory = getAnCallMemory(game);
  if (!memory || game.day !== memory.day) return null;
  return AN_CALL_CHOICES[memory.choice].response;
}
