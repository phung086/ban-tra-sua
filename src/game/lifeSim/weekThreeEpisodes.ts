import type { GameState } from '../types';

export type WeekThreeChoice = 'care' | 'focus';
type Outcome = {
  label: string; cost: number; minutes: number; energy: number; goodwill: number;
  satiety: number; ice: number; reply: string; callback: string;
};
type Episode = {
  title: string; character: string; characterId: string; prompt: string;
  care: Outcome; focus: Outcome;
};
const choice = (
  label: string, cost: number, minutes: number, energy: number, goodwill: number,
  reply: string, callback: string, satiety = 0, ice = 0,
): Outcome => ({ label, cost, minutes, energy, goodwill, reply, callback, satiety, ice });

const episodes: Record<number, Episode> = {
  15: { title: 'Cơn mỏi vai', character: 'Lan', characterId: 'lan',
    prompt: 'Vai bạn mỏi sau một tuần dài. Lan khuyên nghỉ trước khi mở tiệm.',
    care: choice('🛌 Nghỉ ngơi 30 phút', 0, 30, 20, 0,
      'Bạn nghỉ một lát và thấy đỡ mệt hơn.', 'Lan hỏi hôm nay bạn đã đỡ mỏi vai chưa.'),
    focus: choice('📱 Nhắn Lan rồi mở tiệm', 0, 0, 0, 1,
      'Bạn báo Lan mình sẽ nghỉ sau ca.', 'Lan nhắc bạn giữ lời hứa nghỉ ngơi.') },
  16: { title: 'Lời cảm ơn muộn', character: 'Duy', characterId: 'duy',
    prompt: 'Duy nhớ buổi ăn cùng nhóm. Bạn muốn mời một bữa nhỏ để cảm ơn?',
    care: choice('🍜 Mời Duy ăn trưa', 22000, 25, -2, 2,
      'Duy vui vì bạn nhớ tới lời cảm ơn.', 'Duy gửi lời chúc ca bán hôm nay thuận lợi.', 12),
    focus: choice('💌 Gửi lời cảm ơn', 0, 0, 0, 1,
      'Bạn nhắn Duy lời cảm ơn chân thành.', 'Duy đã đọc tin nhắn và gửi biểu tượng cười.') },
  17: { title: 'Xe quệt sát đầu ngõ', character: 'Bố Quang', characterId: 'family-father-quang',
    prompt: 'Có va quệt nhỏ gần ngõ. Bạn an toàn nhưng hơi hoảng, bố Quang hỏi có cần giúp không.',
    care: choice('🚕 Nhờ bố đưa đến trạm y tế', 15000, 35, 8, 2,
      'Bạn được kiểm tra và trở về an toàn.', 'Bố Quang hỏi thăm bạn sau lần va quệt.'),
    focus: choice('☎️ Báo gia đình mình an toàn', 0, 0, 0, 1,
      'Bạn dừng lại ở chỗ an toàn và gọi cho gia đình.', 'Bố Quang nhắc bạn đi đường cẩn thận.') },
  18: { title: 'Nghỉ hay cố?', character: 'Mẹ Mai', characterId: 'family-mother-mai',
    prompt: 'Mẹ Mai nhắc bạn đừng làm việc quá sức. Bạn có thể nghỉ trước ca.',
    care: choice('🍵 Uống trà và nghỉ 40 phút', 0, 40, 25, 1,
      'Bạn nghỉ ngơi và lấy lại sức.', 'Mẹ Mai vui vì bạn biết chăm sóc bản thân.'),
    focus: choice('📝 Giảm việc trong hôm nay', 0, 0, 0, 1,
      'Bạn ghi lịch làm việc nhẹ nhàng hơn.', 'Mẹ Mai hỏi hôm nay bạn có bớt bận không.') },
  19: { title: 'Người khách cần yên tĩnh', character: 'Thu', characterId: 'thu',
    prompt: 'Thu có chuyện buồn và muốn ngồi yên một chút. Bạn phản ứng thế nào?',
    care: choice('🌿 Hỏi thăm và lắng nghe', 0, 12, -2, 2,
      'Bạn lắng nghe mà không ép Thu kể thêm.', 'Thu cảm ơn vì bạn đã lắng nghe.'),
    focus: choice('🪑 Để Thu có không gian', 0, 0, 0, 1,
      'Bạn mời Thu ngồi ở góc yên tĩnh.', 'Thu cảm ơn vì được tôn trọng.') },
  20: { title: 'Mất điện một giờ', character: 'Bố Quang', characterId: 'family-father-quang',
    prompt: 'Khu phố báo mất điện tạm thời. Bạn muốn chuẩn bị thùng đá dự phòng?',
    care: choice('🧊 Nhờ bố mua đá dự phòng', 16000, 20, -2, 2,
      'Bạn có thêm bốn phần đá để phục vụ sau khi điện trở lại.', 'Bố Quang hỏi thùng đá dự phòng có giúp được không.', 0, 4),
    focus: choice('📞 Hẹn khách quay lại', 0, 0, 0, 1,
      'Bạn thông báo rõ thời gian chờ với khách.', 'Khách cảm ơn vì được báo trước.') },
  21: { title: 'Bữa tiệc xóm nhỏ', character: 'Cô Hạnh', characterId: 'hanh',
    prompt: 'Hàng xóm rủ góp món cho bữa tiệc cuối tuần. Bạn muốn tham gia thế nào?',
    care: choice('🍲 Góp món ăn và ngồi cùng', 30000, 35, -3, 3,
      'Cả xóm chia nhau đồ ăn và những câu chuyện vui.', 'Cô Hạnh nhắc buổi tối cả xóm ngồi cùng nhau.', 20),
    focus: choice('💌 Gửi lời chúc tới cả xóm', 0, 0, 0, 1,
      'Bạn gửi lời chúc và hẹn dịp khác.', 'Cô Hạnh cảm ơn lời chúc của bạn.') },
};

const key = (day: number, selected: WeekThreeChoice) => `week-three-${day}-${selected}`;
const has = (game: GameState, id: string) =>
  game.relationshipRewardIds?.includes(id) || game.storyLog?.some(moment => moment.id === id);

export function getWeekThreeEpisode(game: GameState): Episode | null {
  const episode = episodes[game.day];
  if (!episode) return null;
  if (game.day === 16 && !has(game, 'week-two-8-join')) {
    return { ...episode, prompt: 'Duy ghé tiệm hỏi thăm. Bạn muốn cảm ơn vì luôn ủng hộ?' };
  }
  if (game.day === 21 && has(game, 'week-three-20-care')) {
    return { ...episode, prompt: 'Sau hôm bố Quang giúp chuẩn bị đá, cô Hạnh rủ bạn tới bữa tiệc xóm.' };
  }
  return episode;
}

export function getWeekThreeDecision(game: GameState): WeekThreeChoice | null {
  return (['care', 'focus'] as const).find(selected => has(game, key(game.day, selected))) ?? null;
}

export function getWeekThreeCallback(game: GameState): string | null {
  const yesterday = episodes[game.day - 1];
  if (!yesterday) return null;
  const selected = (['care', 'focus'] as const).find(option => has(game, key(game.day - 1, option)));
  return selected ? yesterday[selected].callback : null;
}

export function canChooseWeekThree(game: GameState, selected: WeekThreeChoice): boolean {
  const episode = episodes[game.day];
  if (!episode || !['care', 'focus'].includes(selected) ||
      game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || getWeekThreeDecision(game)) return false;
  const effect = episode[selected];
  return Number.isFinite(game.cash) && Number.isFinite(game.city.energy) &&
    Number.isFinite(game.city.minutes) && game.cash >= effect.cost &&
    game.city.energy >= Math.max(0, -effect.energy) &&
    game.city.minutes + effect.minutes <= 1260;
}

export function chooseWeekThree(game: GameState, selected: WeekThreeChoice): GameState {
  if (selected !== 'care' && selected !== 'focus') return game;
  if (!episodes[game.day] || game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || getWeekThreeDecision(game)) return game;
  if (!canChooseWeekThree(game, selected)) {
    return { ...game, notice: 'Không đủ tiền, sức hoặc thời gian. Bạn có thể chọn phương án miễn phí.' };
  }
  const episode = episodes[game.day];
  const effect = episode[selected];
  const id = key(game.day, selected);
  return {
    ...game,
    cash: game.cash - effect.cost,
    city: {
      ...game.city,
      minutes: game.city.minutes + effect.minutes,
      energy: Math.min(100, game.city.energy + effect.energy),
      goodwill: game.city.goodwill + effect.goodwill,
      journal: [`Ngày ${game.day}: ${effect.reply}`, ...game.city.journal].slice(0, 24),
    },
    morning: { ...game.morning, satiety: Math.min(100, game.morning.satiety + effect.satiety) },
    inventory: effect.ice
      ? { ...game.inventory, ice: game.inventory.ice + effect.ice }
      : game.inventory,
    relationshipRewardIds: [...(game.relationshipRewardIds ?? []), id],
    storyLog: [{
      id, customerId: episode.characterId, customerName: episode.character,
      title: episode.title, text: effect.reply, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: effect.reply,
  };
}
