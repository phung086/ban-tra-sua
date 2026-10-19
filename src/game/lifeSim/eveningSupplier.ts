import type { GameState } from '../types';

export type SupplierEveningChoice = 'reserve' | 'chat' | 'rest';

export const SUPPLIER_EVENING_OPTIONS = {
  reserve: { label: '🧺 Đặt giỏ nguyên liệu cho sáng mai', cost: 2000, minutes: 6, energy: -2, goodwill: 1, bond: 1 },
  chat: { label: '💬 Nhắn hỏi thăm cô Hạnh', cost: 0, minutes: 2, energy: 0, goodwill: 1, bond: 1 },
  rest: { label: '🌙 Về nghỉ, không đặt hàng', cost: 0, minutes: 0, energy: 0, goodwill: 0, bond: 0 },
} as const;

const CHOICES: readonly SupplierEveningChoice[] = ['reserve', 'chat', 'rest'];
const eventId = (day: number, choice: SupplierEveningChoice) => 'evening-supplier-' + day + '-' + choice;

/** Existing v3 reward IDs are an idempotent, persistent per-day choice ledger. */
export function getSupplierEveningChoice(
  game: Pick<GameState, 'day' | 'relationshipRewardIds'>,
  day = game.day,
): SupplierEveningChoice | null {
  if (!Number.isSafeInteger(day) || day < 1) return null;
  return CHOICES.find(choice => game.relationshipRewardIds.includes(eventId(day, choice))) ?? null;
}

/** The held basket is offered only the following day, once via the market's existing daily purchase guard. */
export function getSupplierReservationDiscount(
  game: Pick<GameState, 'day' | 'relationshipRewardIds'>,
): number {
  return game.day >= 2 && game.day <= 7 &&
    getSupplierEveningChoice(game, game.day - 1) === 'reserve' ? 6000 : 0;
}

export function canChooseSupplierEvening(game: GameState, choice: SupplierEveningChoice): boolean {
  if (!CHOICES.includes(choice) || game.phase !== 'summary' ||
    game.summary?.day !== game.day || game.day < 1 || game.day > 6 ||
    !Number.isSafeInteger(game.day) || getSupplierEveningChoice(game)) return false;
  if (![game.cash, game.city.minutes, game.city.energy, game.city.goodwill].every(Number.isFinite) ||
    game.cash < 0 || game.city.minutes < 0 || game.city.minutes > 1260 ||
    game.city.energy < 0 || game.city.energy > 100) return false;
  if (choice === 'rest') return true;
  const option = SUPPLIER_EVENING_OPTIONS[choice];
  return game.cash >= option.cost &&
    game.city.minutes + option.minutes <= 1260 &&
    game.city.energy + option.energy >= 0;
}

export function chooseSupplierEvening(game: GameState, choice: SupplierEveningChoice): GameState {
  if (!canChooseSupplierEvening(game, choice)) return game;
  const option = SUPPLIER_EVENING_OPTIONS[choice];
  const id = eventId(game.day, choice);
  const reply = choice === 'reserve'
    ? 'Cô Hạnh giữ giỏ trà cho sáng mai. Bạn trả 2.000 ₫ tiền giữ hàng; giỏ đầy đủ tại chợ sẽ giảm 6.000 ₫.'
    : choice === 'chat'
      ? 'Cô Hạnh nhắn: “Hôm nay bán có mệt không? Mai ghé chợ cô kể chuyện tiếp nhé.”'
      : 'Bạn khóa sổ và về nghỉ. Mai vẫn có thể mua nguyên liệu ở chợ với giá thường.';
  return {
    ...game,
    cash: game.cash - option.cost,
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: Math.min(100, game.city.energy + option.energy),
      goodwill: Math.min(100000, game.city.goodwill + option.goodwill),
      stories: {
        ...game.city.stories,
        bonds: {
          ...game.city.stories.bonds,
          hanh: (game.city.stories.bonds.hanh ?? 0) + option.bond,
        },
      },
      journal: ['Ngày ' + game.day + ' · ' + reply, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: 'hanh', customerName: 'Cô Hạnh',
      title: 'Giữ hàng ở chợ Ngọc Hà', text: reply, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: reply,
  };
}

/** NPC follow-up is visible only after the actual next-day wake action. */
export function getSupplierMorningCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step === 'asleep' || game.day < 2 || game.day > 7) return null;
  const choice = getSupplierEveningChoice(game, game.day - 1);
  if (choice === 'reserve') return 'Cô Hạnh: “Giỏ trà đã để riêng cho cháu. Ra chợ Ngọc Hà hôm nay giảm 6.000 ₫ nhé!”';
  if (choice === 'chat') return 'Cô Hạnh: “Tối qua cháu nhắn hỏi thăm, cô vui lắm. Hôm nay có ghé chợ thì chào cô nhé!”';
  return null;
}
