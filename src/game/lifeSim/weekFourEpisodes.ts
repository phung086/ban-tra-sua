import type { GameState } from '../types';

export type WeekFourChoice = 'takeTime' | 'keepSimple';
type Outcome = { label: string; cost: number; minutes: number; energy: number; goodwill: number; satiety: number; reply: string; callback: string };
type Episode = { title: string; character: string; characterId: string; prompt: string; takeTime: Outcome; keepSimple: Outcome };
const result = (label: string, cost: number, minutes: number, energy: number, goodwill: number, satiety: number, reply: string, callback: string): Outcome =>
  ({ label, cost, minutes, energy, goodwill, satiety, reply, callback });
const episodes: Record<number, Episode> = {
  22: { title: 'Con đường ra ngoại ô', character: 'Bác Minh', characterId: 'minh',
    prompt: 'Bác Minh muốn mang trà tới nhóm bạn ở ngoại ô. Tuyến đường chưa mở; bạn sẽ hẹn nhận ở đâu?',
    takeTime: result('🚌 Hẹn ở trạm xe', 6000, 18, -3, 2, 0, 'Bạn và bác Minh hẹn tại trạm xe, không đi vào khu chưa mở.', 'Bác Minh đã báo điểm hẹn cho nhóm bạn.'),
    keepSimple: result('📍 Nhận tại tiệm', 0, 0, 0, 1, 0, 'Bạn mời bác ghé tiệm khi tiện đường.', 'Bác Minh cảm ơn vì bạn không nhận giao vượt tuyến.') },
  23: { title: 'Hóa đơn không đợi', character: 'Mẹ Mai', characterId: 'family-mother-mai',
    prompt: 'Sổ chi có hóa đơn điện nước kỳ mới. Bạn muốn thanh toán hay cùng mẹ rà soát?',
    takeTime: result('🧾 Thanh toán 38.000đ', 38000, 5, 0, 1, 0, 'Bạn đã thanh toán khoản chi mô phỏng.', 'Mẹ Mai nhắc bạn kiểm tra sổ chi mỗi tuần.'),
    keepSimple: result('📒 Cùng mẹ rà soát', 0, 0, 0, 1, 0, 'Bạn hẹn kiểm tra cùng mẹ; không tự tạo khoản nợ.', 'Mẹ Mai hẹn tối nay cùng bạn xem lại chi tiêu.') },
  24: { title: 'Chợ sớm và món canh', character: 'Mẹ Mai', characterId: 'family-mother-mai',
    prompt: 'Mẹ rủ đi chợ mua đồ nấu canh cho bữa trưa. Bạn muốn nấu cùng mẹ?',
    takeTime: result('🥬 Đi chợ và nấu canh', 26000, 35, -5, 3, 30, 'Hai mẹ con nấu bữa canh nóng; bạn no hơn.', 'Mẹ Mai hỏi có muốn nấu món canh ấy lần nữa không.'),
    keepSimple: result('🍚 Ăn cơm có sẵn', 0, 0, 0, 1, 10, 'Bạn ăn cơm có sẵn, không phát sinh chi phí.', 'Mẹ Mai vui vì bạn đã ăn trước khi mở tiệm.') },
};
const key = (day: number, choice: WeekFourChoice) => `week-four-${day}-${choice}`;
const has = (game: GameState, id: string) => game.relationshipRewardIds?.includes(id) || game.storyLog?.some(item => item.id === id);
export function getWeekFourEpisode(game: GameState): Episode | null {
  const episode = episodes[game.day];
  if (!episode) return null;
  if (game.day === 23 && has(game, key(22, 'takeTime'))) return { ...episode, prompt: 'Sau chuyến hẹn ở trạm xe, mẹ Mai nhắc bạn xem lại hóa đơn và tiền đi lại.' };
  if (game.day === 24 && has(game, key(23, 'takeTime'))) return { ...episode, prompt: 'Hóa đơn đã thanh toán; mẹ Mai rủ bạn cùng nấu canh tại nhà.' };
  return episode;
}
export function getWeekFourDecision(game: GameState): WeekFourChoice | null {
  return (['takeTime', 'keepSimple'] as const).find(choice => has(game, key(game.day, choice))) ?? null;
}
export function getWeekFourCallback(game: GameState): string | null {
  const yesterday = episodes[game.day - 1];
  const choice = (['takeTime', 'keepSimple'] as const).find(c => has(game, key(game.day - 1, c)));
  return yesterday && choice ? yesterday[choice].callback : null;
}
export function canChooseWeekFour(game: GameState, choice: WeekFourChoice): boolean {
  const episode = episodes[game.day];
  if (!episode || (choice !== 'takeTime' && choice !== 'keepSimple') ||
      game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || getWeekFourDecision(game)) return false;
  const effect = episode[choice];
  return Number.isFinite(game.cash) && Number.isFinite(game.city.energy) &&
    Number.isFinite(game.city.minutes) && game.cash >= effect.cost &&
    game.city.energy >= Math.max(0, -effect.energy) &&
    game.city.minutes + effect.minutes <= 1260;
}
export function chooseWeekFour(game: GameState, choice: WeekFourChoice): GameState {
  if (choice !== 'takeTime' && choice !== 'keepSimple') return game;
  const episode = episodes[game.day];
  if (!episode || game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || getWeekFourDecision(game)) return game;
  if (!canChooseWeekFour(game, choice)) return { ...game, notice: 'Không đủ tiền, sức hoặc thời gian. Chọn phương án miễn phí để tiếp tục.' };
  const effect = episode[choice];
  const id = key(game.day, choice);
  return {
    ...game, cash: game.cash - effect.cost,
    city: { ...game.city, minutes: game.city.minutes + effect.minutes,
      energy: Math.min(100, game.city.energy + effect.energy),
      goodwill: game.city.goodwill + effect.goodwill,
      journal: [`Ngày ${game.day}: ${effect.reply}`, ...game.city.journal].slice(0, 24) },
    morning: { ...game.morning, satiety: Math.min(100, game.morning.satiety + effect.satiety) },
    relationshipRewardIds: [...(game.relationshipRewardIds ?? []), id],
    storyLog: [{ id, customerId: episode.characterId, customerName: episode.character,
      title: episode.title, text: effect.reply, day: game.day, rewardFans: 0 }, ...game.storyLog].slice(0, 24),
    notice: effect.reply,
  };
}
