import type { GameState } from '../types';

export type WeekTwoDecision = 'join' | 'later';

export interface WeekTwoOutcome {
  label: string;
  cost: number;
  minutes: number;
  energy: number;
  goodwill: number;
  satiety: number;
  milk: number;
  reply: string;
  callback: string;
}

export interface WeekTwoEpisode {
  day: number;
  title: string;
  character: string;
  characterId: string;
  prompt: string;
  join: WeekTwoOutcome;
  later: WeekTwoOutcome;
}

const outcome = (
  label: string, cost: number, minutes: number, energy: number, goodwill: number,
  reply: string, callback: string, satiety = 0, milk = 0,
): WeekTwoOutcome => ({ label, cost, minutes, energy, goodwill, satiety, milk, reply, callback });

/** Seven player-facing scenes, no new GPU assets. Prices are fictional in-game VND. */
const EPISODES: Record<number, WeekTwoEpisode> = {
  8: {
    day: 8, title: 'Nhóm chat sáng', character: 'Lan', characterId: 'lan',
    prompt: 'Lan rủ cả nhóm đi ăn tối. Bạn muốn dành trước ngân sách hay hẹn sau?',
    join: outcome('🍜 Đặt phần ăn cùng nhóm · 32.000đ', 32000, 20, 2, 2,
      'Lan chốt bàn cho nhóm và nhắc mọi người chỉ gọi trong ngân sách đã thống nhất.',
      'Lan gửi ảnh cả nhóm và cảm ơn vì bạn đã lên kế hoạch rõ ràng.', 12),
    later: outcome('💬 Hẹn Lan hôm khác · miễn phí', 0, 2, 0, 0,
      'Bạn nói cần lo tiệm trước. Lan vui vẻ để dành lời mời cho lần sau.',
      'Lan nhắn: “Khi nào rảnh mình hẹn lại nhé!”'),
  },
  9: {
    day: 9, title: 'Sữa giao trễ', character: 'Cô Hạnh', characterId: 'hanh',
    prompt: 'Nhà cung cấp sữa đến muộn. Cô Hạnh có một lô nhỏ để tiệm kịp bán.',
    join: outcome('🥛 Mua sữa dự phòng · 18.000đ', 18000, 12, 1, 1,
      'Cô Hạnh giao ba phần sữa dự phòng. Tiệm có thêm nguyên liệu cho ca hôm nay.',
      'Cô Hạnh hỏi xem lô sữa dự phòng hôm qua có đủ dùng không.', 0, 3),
    later: outcome('📋 Giữ menu hiện có · miễn phí', 0, 0, 0, 0,
      'Bạn kiểm tra kho và chỉ nhận đơn phù hợp lượng nguyên liệu đang có.',
      'Cô Hạnh nhắc: “Lần sau báo cô sớm nếu cần hàng nhé.”'),
  },
  10: {
    day: 10, title: 'Bữa bún sau ca', character: 'Thảo', characterId: 'thao',
    prompt: 'Thảo mời ăn bún. Mọi người thống nhất chia đều hóa đơn trước khi gọi món.',
    join: outcome('🥢 Chia hóa đơn · 26.000đ', 26000, 25, 2, 2,
      'Bạn thanh toán đúng phần của mình. Thảo thích cách cả nhóm rõ ràng tiền bạc.',
      'Thảo nhắc bữa bún vui vẻ và gửi công thức nước dùng.', 16),
    later: outcome('📱 Nhắn lời cảm ơn · miễn phí', 0, 1, 0, 0,
      'Bạn từ chối lịch hôm nay nhưng hẹn Thảo khi tiệm bớt bận.',
      'Thảo hỏi bạn có muốn ăn cùng vào dịp khác không.'),
  },
  11: {
    day: 11, title: 'Tin nhắn chưa gửi', character: 'Thảo', characterId: 'thao',
    prompt: 'Thảo ít nói hơn mọi ngày. Bạn có muốn dành thời gian lắng nghe?',
    join: outcome('🌿 Gặp Thảo ở ghế đá', 0, 18, 3, 2,
      'Bạn ngồi nghe Thảo kể chuyện. Không cần lời khuyên nào, chỉ có sự hiện diện.',
      'Thảo nhắn cảm ơn vì hôm qua bạn đã ngồi cùng.'),
    later: outcome('💌 Nhắn hỏi thăm', 0, 2, 0, 1,
      'Bạn gửi một tin nhắn nhẹ nhàng, để Thảo tự chọn lúc trả lời.',
      'Thảo đã đọc tin nhắn và gửi lại một biểu tượng trái tim.'),
  },
  12: {
    day: 12, title: 'Cơn mưa và chiếc ô', character: 'Lan', characterId: 'lan',
    prompt: 'Trời đổ mưa. Lan đang tìm chiếc ô bị để quên trước cửa tiệm.',
    join: outcome('☂️ Cùng Lan tìm ô', 0, 12, 2, 2,
      'Hai người tìm thấy ô cạnh kệ báo. Lan hứa lần sau sẽ cẩn thận hơn.',
      'Lan mang ô tới và rủ bạn ghé quán khi trời tạnh.'),
    later: outcome('🏠 Chỉ chỗ trú mưa', 0, 1, 0, 1,
      'Bạn chỉ Lan vào mái hiên tránh mưa rồi quay lại chuẩn bị quầy.',
      'Lan cảm ơn vì hôm qua bạn đã chỉ chỗ trú mưa.'),
  },
  13: {
    day: 13, title: 'Hỏi thăm nhà bên', character: 'Bác Bình', characterId: 'binh',
    prompt: 'Bác Bình mệt nhẹ và nhờ hàng xóm mua giúp vài món sinh hoạt.',
    join: outcome('🛍️ Mua giúp đồ cần thiết · 12.000đ', 12000, 15, 2, 2,
      'Bạn ghé cửa hàng mua giúp bác ít đồ và nhắc bác nghỉ ngơi.',
      'Bác Bình đã khỏe hơn và cảm ơn vì túi đồ hôm qua.'),
    later: outcome('☎️ Gọi hỏi thăm bác', 0, 3, 0, 1,
      'Bạn gọi hỏi thăm và nhờ người nhà bác ghé kiểm tra.',
      'Bác Bình nói lời hỏi thăm hôm qua khiến bác thấy ấm lòng.'),
  },
  14: {
    day: 14, title: 'Sổ chi cuối tuần', character: 'Mẹ Mai', characterId: 'mai',
    prompt: 'Đến kỳ thanh toán điện nước trong game. Bạn muốn trả ngay hay ghi lịch nhắc?',
    join: outcome('🧾 Thanh toán kỳ này · 55.000đ', 55000, 5, 0, 1,
      'Bạn thanh toán khoản điện nước mô phỏng và ghi lại trong sổ chi.',
      'Mẹ Mai khen bạn đã chủ động quản lý khoản chi cuối tuần.'),
    later: outcome('📅 Ghi lịch nhắc thanh toán', 0, 2, 0, 0,
      'Bạn ghi chú khoản cần thanh toán sau, không phát sinh nợ tự động trong phiên này.',
      'Mẹ Mai nhắc xem lại sổ chi khi tiệm có doanh thu.'),
  },
};

export function getWeekTwoEpisode(day: number): WeekTwoEpisode | null {
  return EPISODES[day] ?? null;
}

export function getWeekTwoDecision(game: GameState): WeekTwoDecision | null {
  for (const decision of ['join', 'later'] as const) {
    const id = `week-two-${game.day}-${decision}`;
    if (game.relationshipRewardIds?.includes(id) || game.storyLog?.some(item => item.id === id)) return decision;
  }
  return null;
}

export function getWeekTwoCallback(game: GameState): string | null {
  const previous = getWeekTwoEpisode(game.day - 1);
  if (!previous) return null;
  for (const decision of ['join', 'later'] as const) {
    const id = `week-two-${previous.day}-${decision}`;
    if (game.relationshipRewardIds?.includes(id) || game.storyLog?.some(item => item.id === id)) return previous[decision].callback;
  }
  return null;
}

export function canChooseWeekTwo(game: GameState, decision: WeekTwoDecision): boolean {
  const episode = getWeekTwoEpisode(game.day);
  if (!episode || game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || getWeekTwoDecision(game)) return false;
  const option = episode[decision];
  return Number.isFinite(game.cash) && Number.isFinite(game.city.energy) && Number.isFinite(game.city.minutes) &&
    game.cash >= option.cost && game.city.energy >= option.energy &&
    game.city.minutes + option.minutes <= 1260;
}

export function chooseWeekTwo(game: GameState, decision: WeekTwoDecision): GameState {
  if (decision !== 'join' && decision !== 'later') return game;
  const episode = getWeekTwoEpisode(game.day);
  if (!episode || game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || getWeekTwoDecision(game)) return game;
  if (!canChooseWeekTwo(game, decision)) {
    return { ...game, notice: 'Chưa đủ tiền, sức hoặc thời gian. Bạn có thể chọn phương án miễn phí.' };
  }
  const selected = episode[decision];
  return {
    ...game,
    cash: game.cash - selected.cost,
    morning: {
      ...game.morning,
      satiety: Math.min(100, game.morning.satiety + selected.satiety),
    },
    city: {
      ...game.city,
      minutes: game.city.minutes + selected.minutes,
      energy: game.city.energy - selected.energy,
      goodwill: game.city.goodwill + selected.goodwill,
      journal: [
        'Ngày ' + game.day + ' · ' + episode.title + ': ' + selected.reply,
        ...game.city.journal,
      ].slice(0, 24),
    },
    relationshipRewardIds: [...(game.relationshipRewardIds ?? []), `week-two-${game.day}-${decision}`],
    inventory: selected.milk > 0
      ? { ...game.inventory, classicMilkTea: game.inventory.classicMilkTea + selected.milk }
      : game.inventory,
    storyLog: [{
      id: 'week-two-' + game.day + '-' + decision,
      customerId: episode.characterId,
      customerName: episode.character,
      title: episode.title,
      text: selected.reply,
      day: game.day,
      rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: selected.reply,
  };
}
