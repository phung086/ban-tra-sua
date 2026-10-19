import type { GameState } from '../types';
import { morningActionBlock } from './morningAction';

/** A two-morning friendship arc with an always-free way to postpone. */
export type ThaoMenuChoice = 'book' | 'decline' | 'print' | 'handwrite' | 'later';
export type ThaoMenuStage = 'invite' | 'make';

export const THAO_MENU_OPTIONS = {
  book: {
    label: '📅 Hẹn Thảo làm bảng thực đơn', cost: 0, minutes: 5, energy: 1,
    fans: 0, goodwill: 0, bond: 1,
    text: 'Thảo: “Mai mình ghé xem thực đơn nhé. Mình sẽ ghi rõ giá để khách dễ chọn.”',
  },
  decline: {
    label: '💬 Cảm ơn, để tuần sau', cost: 0, minutes: 0, energy: 0,
    fans: 0, goodwill: 0, bond: 0,
    text: 'Thảo: “Không sao, khi nào cần cứ nhắn mình. Đừng ôm hết việc nhé.”',
  },
  print: {
    label: '🖨️ In bảng rõ giá, dễ đọc', cost: 24000, minutes: 15, energy: 2,
    fans: 3, goodwill: 1, bond: 1,
    text: 'Hai người treo bảng thực đơn mới, ghi rõ giá từng món. Khách đi ngang dừng lại xem, tiệm có thêm 3 fan.',
  },
  handwrite: {
    label: '✍️ Viết bảng tay cùng Thảo', cost: 0, minutes: 12, energy: 2,
    fans: 1, goodwill: 1, bond: 1,
    text: 'Bạn và Thảo viết bảng tay dễ đọc từ giấy sẵn có. Không tốn tiền, tiệm có thêm 1 fan.',
  },
  later: {
    label: '🌿 Cảm ơn và giữ bảng cũ', cost: 0, minutes: 0, energy: 0,
    fans: 0, goodwill: 0, bond: 0,
    text: 'Thảo: “Hôm nay bận thì cứ mở tiệm đã. Tuần sau mình tính tiếp nhé.”',
  },
} as const;

const INVITE_CHOICES: readonly ThaoMenuChoice[] = ['book', 'decline'];
const MAKE_CHOICES: readonly ThaoMenuChoice[] = ['print', 'handwrite', 'later'];
const eventId = (day: number, choice: ThaoMenuChoice) => 'thao-menu-' + day + '-' + choice;
const isInviteDay = (day: number) => Number.isSafeInteger(day) && day >= 2 && (day - 2) % 7 === 0;

export function getThaoMenuChoice(game: GameState, day = game.day): ThaoMenuChoice | null {
  if (!Number.isSafeInteger(day) || day < 1) return null;
  const choices = [...INVITE_CHOICES, ...MAKE_CHOICES];
  return choices.find(choice => game.relationshipRewardIds.includes(eventId(day, choice)) ||
    game.storyLog.some(item => item.id === eventId(day, choice))) ?? null;
}

export function getThaoMenuStage(game: GameState): ThaoMenuStage | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step !== 'finished') return null;
  if (isInviteDay(game.day)) return 'invite';
  if (isInviteDay(game.day - 1) && getThaoMenuChoice(game, game.day - 1) === 'book')
    return 'make';
  return null;
}

export function canChooseThaoMenu(game: GameState, choice: ThaoMenuChoice): boolean {
  const stage = getThaoMenuStage(game);
  if (!stage || getThaoMenuChoice(game) ||
    !(stage === 'invite' ? INVITE_CHOICES : MAKE_CHOICES).includes(choice)) return false;
  if (![game.cash, game.city.minutes, game.city.energy, game.city.goodwill, game.fans,
    game.dailyFansGained, game.customerBond['friend-thao'] ?? 0].every(Number.isFinite) ||
    game.cash < 0 || game.city.minutes < 0 || game.city.minutes > 1260 ||
    game.city.energy < 0 || game.city.energy > 100) return false;
  const option = THAO_MENU_OPTIONS[choice];
  return morningActionBlock(game, option.cost, option.minutes, option.energy) === null;
}

export function chooseThaoMenu(game: GameState, choice: ThaoMenuChoice): GameState {
  if (!canChooseThaoMenu(game, choice)) return game;
  const option = THAO_MENU_OPTIONS[choice];
  const id = eventId(game.day, choice);
  return {
    ...game,
    cash: game.cash - option.cost,
    fans: game.fans + option.fans,
    dailyFansGained: game.dailyFansGained + option.fans,
    customerBond: {
      ...game.customerBond,
      'friend-thao': (game.customerBond['friend-thao'] ?? 0) + option.bond,
    },
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy - option.energy,
      goodwill: game.city.goodwill + option.goodwill,
      journal: ['Ngày ' + game.day + ' · ' + option.text, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: 'friend-thao', customerName: 'Thảo',
      title: 'Bảng thực đơn cùng Thảo', text: option.text,
      day: game.day, rewardFans: option.fans,
    }, ...game.storyLog].slice(0, 24),
    notice: option.text,
  };
}

/** Storefront sign is derived from the durable v3 reward ledger, never storyLog
 * (which is capped at 24 entries). Later weekly choices replace the old sign.
 */
export function getThaoMenuSign(game: GameState): { day: number; kind: 'print' | 'handwrite'; label: string } | null {
  if (!Number.isSafeInteger(game.day) || game.day < 3) return null;
  let latest: { day: number; kind: 'print' | 'handwrite'; label: string } | null = null;
  for (const id of game.relationshipRewardIds) {
    const match = /^thao-menu-(\d+)-(print|handwrite)$/.exec(id);
    if (!match) continue;
    const day = Number(match[1]);
    if (!Number.isSafeInteger(day) || day < 3 || day > game.day ||
      (day - 3) % 7 !== 0 || (latest && day <= latest.day)) continue;
    const kind = match[2] as 'print' | 'handwrite';
    latest = { day, kind, label: kind === 'print' ? 'Bảng in rõ giá' : 'Bảng viết tay' };
  }
  return latest;
}

/** A dialogue callback only; no extra rewards on the next morning. */
export function getThaoMenuCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step === 'asleep') return null;
  const choice = getThaoMenuChoice(game, game.day - 1);
  if (choice === 'print') return 'Thảo nhắn: “Hôm qua khách đọc bảng giá rất nhanh. Nhớ giữ menu rõ ràng nhé!”';
  if (choice === 'handwrite') return 'Thảo gửi ảnh bảng viết tay: “Tự làm vẫn đẹp mà. Hôm nào mình sửa thêm nhé!”';
  if (choice === 'later') return 'Thảo: “Cứ bán hàng bình thường nhé, tuần sau mình lại bàn chuyện thực đơn.”';
  if (choice === 'decline') return 'Thảo nhắn: “Không sao đâu, mình vẫn có thể giúp khi bạn sẵn sàng. Chúc tiệm một ngày vui!”';
  return null;
}
