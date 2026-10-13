import type { GameState } from '../types';

export type WeekTwoDecision = 'join' | 'later';
type Outcome = { label: string; cost: number; minutes: number; energy: number; goodwill: number; satiety: number; milk: number; reply: string; callback: string };
type Episode = { title: string; character: string; characterId: string; prompt: string; join: Outcome; later: Outcome };
const option = (label: string, cost: number, minutes: number, energy: number, goodwill: number, reply: string, callback: string, satiety = 0, milk = 0): Outcome =>
  ({ label, cost, minutes, energy, goodwill, reply, callback, satiety, milk });

const episodes: Record<number, Episode> = {
  8: { title: 'Nhóm chat sáng', character: 'Lan', characterId: 'lan',
    prompt: 'Lan rủ nhóm bạn đi ăn. Bạn có muốn nhận lời và thống nhất trước ngân sách?',
    join: option('🍜 Đi ăn cùng nhóm', 32000, 20, 2, 2, 'Lan chốt bàn và cảm ơn bạn đã bàn rõ chi phí.', 'Lan gửi ảnh cả nhóm hôm qua.', 12),
    later: option('💬 Hẹn ngày khác', 0, 2, 0, 0, 'Lan hiểu bạn đang bận với tiệm.', 'Lan nhắn: khi nào rảnh mình hẹn lại!') },
  9: { title: 'Sữa giao trễ', character: 'Cô Hạnh', characterId: 'hanh',
    prompt: 'Cô Hạnh có ba phần sữa dự phòng. Bạn có muốn mua để kịp bán hôm nay?',
    join: option('🥛 Mua ba phần sữa', 18000, 12, 1, 1, 'Tiệm đã có thêm sữa dự phòng.', 'Cô Hạnh hỏi lô sữa hôm qua dùng có tốt không.', 0, 3),
    later: option('📋 Bán theo kho hiện có', 0, 0, 0, 0, 'Bạn kiểm tra kho trước khi nhận đơn.', 'Cô Hạnh nhắc gọi sớm khi cần thêm sữa.') },
  10: { title: 'Bữa bún sau ca', character: 'Thảo', characterId: 'thao',
    prompt: 'Thảo mời ăn bún. Mọi người đồng ý chia đều hóa đơn trước khi gọi món.',
    join: option('🥢 Chia hóa đơn', 26000, 25, 2, 2, 'Bạn thanh toán đúng phần của mình.', 'Thảo nhắc bữa bún và gửi công thức nước dùng.', 16),
    later: option('📱 Nhắn lời cảm ơn', 0, 1, 0, 0, 'Bạn hẹn Thảo dịp khác.', 'Thảo hỏi khi nào bạn rảnh.') },
  11: { title: 'Tin nhắn chưa gửi', character: 'Thảo', characterId: 'thao',
    prompt: 'Thảo có vẻ trầm lặng. Bạn có muốn gặp và lắng nghe?',
    join: option('🌿 Gặp ở ghế đá', 0, 18, 3, 2, 'Bạn lắng nghe Thảo kể chuyện.', 'Thảo cảm ơn vì hôm qua bạn đã ngồi cùng.'),
    later: option('💌 Nhắn hỏi thăm', 0, 2, 0, 1, 'Bạn nhắn hỏi thăm và chờ Thảo trả lời.', 'Thảo gửi lại một trái tim.') },
  12: { title: 'Cơn mưa và chiếc ô', character: 'Lan', characterId: 'lan',
    prompt: 'Trời mưa, Lan đang tìm chiếc ô để quên gần cửa tiệm.',
    join: option('☂️ Cùng tìm ô', 0, 12, 2, 2, 'Hai người tìm được ô cạnh kệ báo.', 'Lan cảm ơn vì chiếc ô hôm qua.'),
    later: option('🏠 Chỉ chỗ trú mưa', 0, 1, 0, 1, 'Bạn chỉ Lan vào mái hiên.', 'Lan cảm ơn vì đã được trú mưa.') },
  13: { title: 'Hỏi thăm nhà bên', character: 'Bác Bình', characterId: 'binh',
    prompt: 'Bác Bình nhờ mua giúp vài món sinh hoạt. Bạn có thời gian không?',
    join: option('🛍️ Mua giúp bác', 12000, 15, 2, 2, 'Bạn mua đồ và nhắc bác nghỉ ngơi.', 'Bác Bình cảm ơn túi đồ hôm qua.'),
    later: option('☎️ Gọi hỏi thăm', 0, 3, 0, 1, 'Bạn gọi hỏi thăm và nhờ người nhà ghé bác.', 'Bác Bình rất vui vì lời hỏi thăm.') },
  14: { title: 'Sổ chi cuối tuần', character: 'Mẹ Mai', characterId: 'family-mother-mai',
    prompt: 'Đến kỳ đóng điện nước mô phỏng. Bạn muốn thanh toán ngay hay đặt lịch nhắc?',
    join: option('🧾 Thanh toán điện nước', 55000, 5, 0, 1, 'Bạn đã ghi khoản chi vào sổ.', 'Mẹ Mai khen bạn quản lý chi tiêu tốt.'),
    later: option('📅 Ghi lịch nhắc', 0, 2, 0, 0, 'Bạn ghi chú thanh toán sau, không phát sinh nợ tự động.', 'Mẹ Mai nhắc xem lại sổ chi.') },
};
export function getWeekTwoEpisode(day: number): Episode | null { return episodes[day] ?? null; }
const id = (day: number, decision: WeekTwoDecision) => 'week-two-' + day + '-' + decision;
const remembered = (game: GameState, key: string) =>
  game.relationshipRewardIds?.includes(key) || game.storyLog?.some(item => item.id === key);
export function getWeekTwoDecision(game: GameState): WeekTwoDecision | null {
  return (['join', 'later'] as const).find(choice => remembered(game, id(game.day, choice))) ?? null;
}
export function getWeekTwoCallback(game: GameState): string | null {
  const previous = episodes[game.day - 1];
  if (!previous) return null;
  const choice = (['join', 'later'] as const).find(item => remembered(game, id(game.day - 1, item)));
  return choice ? previous[choice].callback : null;
}
export function canChooseWeekTwo(game: GameState, choice: WeekTwoDecision): boolean {
  const episode = episodes[game.day];
  if (!episode || game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || getWeekTwoDecision(game)) return false;
  const selected = episode[choice];
  return !!selected && Number.isFinite(game.cash) && Number.isFinite(game.city.energy) &&
    Number.isFinite(game.city.minutes) && game.cash >= selected.cost &&
    game.city.energy >= selected.energy && game.city.minutes + selected.minutes <= 1260;
}
export function chooseWeekTwo(game: GameState, choice: WeekTwoDecision): GameState {
  if (choice !== 'join' && choice !== 'later') return game;
  const episode = episodes[game.day];
  if (!episode || game.phase !== 'prep' || game.morning.step !== 'finished' ||
      game.morning.day !== game.day || getWeekTwoDecision(game)) return game;
  if (!canChooseWeekTwo(game, choice)) return { ...game, notice: 'Chưa đủ tiền, sức hoặc thời gian; hãy chọn phương án miễn phí.' };
  const selected = episode[choice], key = id(game.day, choice);
  return {
    ...game, cash: game.cash - selected.cost,
    morning: { ...game.morning, satiety: Math.min(100, game.morning.satiety + selected.satiety) },
    city: { ...game.city, minutes: game.city.minutes + selected.minutes,
      energy: game.city.energy - selected.energy, goodwill: game.city.goodwill + selected.goodwill,
      journal: ['Ngày ' + game.day + ': ' + selected.reply, ...game.city.journal].slice(0, 24) },
    inventory: selected.milk ? { ...game.inventory, classicMilkTea: game.inventory.classicMilkTea + selected.milk } : game.inventory,
    relationshipRewardIds: [...(game.relationshipRewardIds ?? []), key],
    storyLog: [{ id: key, customerId: episode.characterId, customerName: episode.character,
      title: episode.title, text: selected.reply, day: game.day, rewardFans: 0 }, ...game.storyLog].slice(0, 24),
    notice: selected.reply,
  };
}
