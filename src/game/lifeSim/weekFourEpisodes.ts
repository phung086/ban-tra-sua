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
  25: { title: 'Bạn đã có hẹn khác', character: 'Lan', characterId: 'lan',
    prompt: 'Lan nhắn nhóm bạn đổi giờ ăn vì Thảo bận. Bạn muốn điều chỉnh cuộc hẹn thế nào?',
    takeTime: result('🥢 Hẹn Lan ăn bún sau ca', 18000, 25, -2, 3, 15, 'Bạn cùng Lan ăn bún và để Thảo chọn dịp khác.', 'Lan nhớ bạn đã linh hoạt đổi lịch để cả nhóm thoải mái.'),
    keepSimple: result('💬 Hẹn lại cả nhóm', 0, 0, 0, 1, 0, 'Bạn nhắn nhóm chọn một buổi khác, không ai phải vội.', 'Lan đã nhắn Thảo lịch hẹn mới; cả nhóm vẫn giữ liên lạc.') },
  26: { title: 'Chuyến xe lạc đường', character: 'Bác Minh', characterId: 'minh',
    prompt: 'Bác Minh báo xe đi nhầm hướng. Tuyến ngoại ô chưa mở, bạn chỉ nhận đơn ở điểm hẹn an toàn.',
    takeTime: result('🗺️ Hỏi đường đến trạm gần nhất', 4000, 20, -2, 2, 0, 'Bạn hỏi nhân viên trạm và hẹn lại điểm nhận trà trong khu đã mở.', 'Bác Minh cảm ơn vì bạn không mạo hiểm đi đường lạ.'),
    keepSimple: result('📞 Hủy giao xa, hẹn tại tiệm', 0, 0, 0, 1, 0, 'Bạn báo rõ với khách và giữ đơn để nhận tại tiệm.', 'Bác Minh báo nhóm bạn vẫn muốn ghé tiệm lần sau.') },
  27: { title: 'Quà sinh nhật nhỏ', character: 'Thảo', characterId: 'thao',
    prompt: 'Hôm nay là sinh nhật Thảo. Lan rủ bạn gửi một món quà vừa sức trước ca bán.',
    takeTime: result('🎁 Mua quà nhỏ tặng Thảo', 24000, 20, -2, 3, 0, 'Thảo vui vì món quà giản dị và lời chúc chân thành.', 'Thảo đặt món trà quen để cảm ơn lời chúc sinh nhật.'),
    keepSimple: result('💌 Viết thiệp tay', 0, 8, 0, 2, 0, 'Bạn viết thiệp bằng giấy có sẵn; Thảo rất trân trọng.', 'Thảo cất tấm thiệp và nhắn bạn một lời cảm ơn.') },
  28: { title: 'Một ngày buồn', character: 'Mẹ Mai', characterId: 'family-mother-mai',
    prompt: 'Mẹ Mai gọi hỏi thăm khi bạn thấy mệt.',
    takeTime: result('Gọi cho mẹ và nghỉ ngơi', 0, 20, 15, 2, 0, 'Bạn nghỉ một chút cùng mẹ.', 'Mẹ Mai nhớ cuộc gọi hôm qua.'),
    keepSimple: result('Nhắn mẹ hẹn tối nói chuyện', 0, 0, 0, 1, 0, 'Bạn hẹn mẹ tối nay.', 'Mẹ Mai nhắc bạn giữ lời hẹn.') },
  29: { title: 'Gió từ phương xa', character: 'Lan', characterId: 'lan',
    prompt: 'Lan muốn lên kế hoạch đi chơi. Thành phố bên cạnh chưa mở.',
    takeTime: result('Tìm tuyến xe nội đô', 8000, 20, -2, 2, 0, 'Bạn cùng Lan tìm hiểu bến xe hiện có.', 'Lan nhớ kế hoạch đi chơi.'),
    keepSimple: result('Hẹn nhóm bàn sau', 0, 0, 0, 1, 0, 'Bạn hẹn Lan lúc khác.', 'Lan nhắn lịch mới cho cả nhóm.') },
  30: { title: 'Tiệm còn sáng đèn', character: 'Cô Hạnh', characterId: 'hanh',
    prompt: 'Tháng đầu mở tiệm kết thúc. Bạn muốn cảm ơn khu phố thế nào?',
    takeTime: result('Mời khu phố uống trà', 20000, 30, -3, 3, 10, 'Bạn mời mọi người uống trà tại tiệm.', 'Cô Hạnh nhớ buổi trà cuối tháng.'),
    keepSimple: result('Viết lời cảm ơn', 0, 0, 0, 2, 0, 'Bạn gửi lời cảm ơn mọi người.', 'Cô Hạnh giữ lại lời nhắn.') },
};
const key = (day: number, choice: WeekFourChoice) => `week-four-${day}-${choice}`;
const has = (game: GameState, id: string) => game.relationshipRewardIds?.includes(id) || game.storyLog?.some(item => item.id === id);
export function getWeekFourEpisode(game: GameState): Episode | null {
  const episode = episodes[game.day];
  if (!episode) return null;
  if (game.day === 23 && has(game, key(22, 'takeTime'))) return { ...episode, prompt: 'Sau chuyến hẹn ở trạm xe, mẹ Mai nhắc bạn xem lại hóa đơn và tiền đi lại.' };
  if (game.day === 24 && has(game, key(23, 'takeTime'))) return { ...episode, prompt: 'Hóa đơn đã thanh toán; mẹ Mai rủ bạn cùng nấu canh tại nhà.' };
  if (game.day === 25 && has(game, key(24, 'takeTime'))) return { ...episode, prompt: 'Sau bữa canh cùng mẹ, Lan nhắn lịch hẹn nhóm thay đổi. Bạn muốn phản hồi thế nào?' };
  if (game.day === 26 && has(game, key(22, 'takeTime'))) return { ...episode, prompt: 'Nhớ điểm hẹn trạm xe hôm trước, bác Minh gọi nhờ bạn xác nhận tuyến an toàn.' };
  if (game.day === 27 && has(game, key(25, 'keepSimple'))) return { ...episode, prompt: 'Nhóm bạn đã hẹn lại sau hôm Thảo bận. Hôm nay là sinh nhật Thảo, bạn muốn gửi lời chúc thế nào?' };
  if (game.day === 28 && has(game, key(27, 'keepSimple')))
    return { ...episode, prompt: 'Thảo vẫn giữ tấm thiệp bạn viết. Mẹ Mai thấy bạn có chuyện buồn và muốn lắng nghe.' };
  if (game.day === 29 && has(game, key(28, 'takeTime')))
    return { ...episode, prompt: 'Sau khi gọi cho mẹ và nghỉ ngơi, bạn cùng Lan lên kế hoạch đi chơi. Thành phố bên cạnh vẫn chưa mở.' };
  if (game.day === 30 && has(game, key(29, 'takeTime')))
    return { ...episode, prompt: 'Lan đã giữ bản đồ bến xe cho tương lai. Cô Hạnh hỏi bạn muốn khép lại tháng đầu thế nào.' };
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
export function getWeekFourMilestone(game: GameState): string | null {
  if (game.day !== 30) return null;
  const family = has(game, key(28, 'takeTime'))
    ? 'Bạn đã dành thời gian nghỉ ngơi và gọi về nhà.'
    : has(game, key(28, 'keepSimple'))
      ? 'Bạn đã nói rõ khi mình cần một khoảng lặng.'
      : 'Bạn vẫn có thể dành thời gian cho gia đình vào những ngày tới.';
  const friends = has(game, key(29, 'takeTime'))
    ? 'Lan và bạn đã tìm hiểu tuyến xe cho chuyến đi tương lai.'
    : has(game, key(29, 'keepSimple'))
      ? 'Nhóm bạn đã hẹn lịch để cùng lên kế hoạch.'
      : 'Chuyến đi cùng bạn bè vẫn còn ở phía trước.';
  const ending = has(game, key(30, 'takeTime'))
    ? 'Khu phố đã ghé buổi trà nhỏ của bạn.'
    : has(game, key(30, 'keepSimple'))
      ? 'Lời cảm ơn cuối tháng đã được gửi tới mọi người.'
      : 'Bạn có thể chọn cách khép lại tháng đầu theo khả năng của mình.';
  return [family, friends, ending].join(' ');
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
