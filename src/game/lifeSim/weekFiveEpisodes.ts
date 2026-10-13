import type { GameState } from '../types';

export type WeekFiveChoice = 'meet' | 'message';
type Outcome = {
  label: string; cost: number; minutes: number; energy: number;
  goodwill: number; satiety: number; reply: string; callback: string;
};
type Episode = {
  title: string; character: string; characterId: string; schedule: string;
  meetBefore: number; prompt: string; meet: Outcome; message: Outcome;
};
const outcome = (label: string, cost: number, minutes: number, energy: number,
  goodwill: number, satiety: number, reply: string, callback: string): Outcome =>
  ({ label, cost, minutes, energy, goodwill, satiety, reply, callback });

// Chapter V is a seven-day follow-up arc, not a new 3D district. Every day
// has a free, time-safe route; appointments are optional and never softlock shop.
const episodes: Record<number, Episode> = {
  31: {
    title: 'Tấm biển mới của tiệm', character: 'Thảo', characterId: 'friend-thao',
    schedule: 'Thảo nhận góp ý thiết kế trước 10:00', meetBefore: 600,
    prompt: 'Sau buổi trà khu phố, Thảo muốn giúp bạn sửa tấm biển tiệm. Bạn có rảnh trước giờ cô ấy đi làm?',
    meet: outcome('🎨 Cùng Thảo sửa biển', 12000, 25, -2, 3, 0,
      'Hai bạn chọn màu biển mới, không phải mua đồ trang trí 3D.',
      'Thảo nhắn bản phác thảo để bạn xem sau ca bán.'),
    message: outcome('💬 Gửi lời cảm ơn và hẹn lại', 0, 0, 0, 1, 0,
      'Bạn cảm ơn Thảo và để cô ấy tập trung công việc.',
      'Thảo giữ lời hẹn và gửi một mẫu chữ đơn giản.'),
  },
  32: {
    title: 'Em An ghé qua', character: 'An', characterId: 'family-sibling-an',
    schedule: 'An vào lớp lúc 09:00', meetBefore: 540,
    prompt: 'An ghé ngang trên đường tới trường, mang theo hộp cơm mẹ Mai gửi.',
    meet: outcome('🍱 Ăn cùng An trước giờ học', 0, 15, 2, 3, 25,
      'Hai chị em ăn cơm và kể chuyện ở nhà.',
      'An nhắn rằng bữa cơm ngắn hôm qua làm em vui.'),
    message: outcome('📱 Nhắn An đi học đúng giờ', 0, 0, 0, 1, 0,
      'Bạn nhận hộp cơm và nhắn An đi học kẻo muộn.',
      'An cảm ơn vì bạn nhớ lịch học của em.'),
  },
  33: {
    title: 'Lời góp ý của cô Thu', character: 'Cô Thu', characterId: 'thu',
    schedule: 'Cô Thu đi họp tổ dân phố lúc 11:00', meetBefore: 660,
    prompt: 'Cô Thu thấy ly trà hôm trước hơi ngọt. Cô muốn góp ý trước khi bạn mở tiệm.',
    meet: outcome('🫖 Nghe và ghi lại góp ý', 0, 18, -1, 3, 0,
      'Bạn ghi chú giảm ngọt cho khách, không tự sửa đơn hàng đang phục vụ.',
      'Cô Thu thấy bạn biết lắng nghe nên hẹn ghé tiệm nữa.'),
    message: outcome('📝 Hẹn cô góp ý sau ca', 0, 0, 0, 1, 0,
      'Bạn cảm ơn cô Thu và xin trao đổi sau ca bán.',
      'Cô Thu nhắc lại lời góp ý mà không giận bạn.'),
  },
  34: {
    title: 'Chợ sớm có rau mới', character: 'Cô Hạnh', characterId: 'hanh',
    schedule: 'Sạp cô Hạnh dọn hàng lúc 10:00', meetBefore: 600,
    prompt: 'Cô Hạnh có ít rau tươi cho bữa tối, nhưng bạn cần cân nhắc tiền nhập nguyên liệu.',
    meet: outcome('🥬 Mua rau và hỏi cách nấu', 18000, 25, -2, 3, 15,
      'Bạn mua rau bằng tiền hiện có, học cách nấu món đơn giản.',
      'Cô Hạnh để riêng bó rau vừa đủ cho lần sau.'),
    message: outcome('🙏 Hỏi giá và để hôm khác', 0, 0, 0, 1, 0,
      'Bạn hỏi giá rồi hẹn lần sau, không phát sinh nợ.',
      'Cô Hạnh quý việc bạn nói rõ khả năng chi tiêu.'),
  },
  35: {
    title: 'Ai trả tiền bữa nhóm?', character: 'Duy', characterId: 'friend-duy',
    schedule: 'Duy chốt lịch nhóm trước 12:00', meetBefore: 720,
    prompt: 'Duy đề nghị đi ăn với Lan và Thảo. Cả nhóm cần biết trước cách chia tiền.',
    meet: outcome('🥢 Xác nhận phần mình 22.000đ', 22000, 15, -1, 3, 20,
      'Bạn chỉ thanh toán phần đã đồng ý; Duy và mọi người tự trả phần của họ.',
      'Duy nhớ bạn đã nói rõ ngân sách trước buổi ăn.'),
    message: outcome('💬 Xin hẹn bữa khác miễn phí', 0, 0, 0, 2, 0,
      'Bạn nhắn mình chưa tiện chi tiền; cả nhóm vui vẻ đổi lịch.',
      'Duy gửi lời rủ đi dạo không tốn tiền lần tới.'),
  },
  36: {
    title: 'Bố Quang và bóng đèn', character: 'Bố Quang', characterId: 'family-father-quang',
    schedule: 'Bố Quang có lịch thăm bạn từ 11:00', meetBefore: 660,
    prompt: 'Bố Quang hỏi bóng đèn biển tiệm còn chập chờn không. Ông muốn giúp kiểm tra an toàn.',
    meet: outcome('🔧 Cùng bố kiểm tra khi ngắt điện', 0, 20, -2, 3, 0,
      'Hai bố con kiểm tra bên ngoài khi đã ngắt điện; phần sửa cần thợ chuyên môn.',
      'Bố Quang vui vì bạn quan tâm an toàn trước khi mở tiệm.'),
    message: outcome('📞 Hẹn bố ngày nghỉ', 0, 0, 0, 1, 0,
      'Bạn cảm ơn bố và hẹn kiểm tra vào ngày nghỉ.',
      'Bố Quang nhớ lời hẹn và dặn bạn đừng tự sửa điện.'),
  },
  37: {
    title: 'Góc xanh cuối tuần', character: 'Bác Bình', characterId: 'binh',
    schedule: 'Bác Bình chăm cây trước 10:00', meetBefore: 600,
    prompt: 'Bác Bình rủ bạn tưới cây ở công viên. Một tuần nữa trôi qua, bạn muốn giữ thói quen nào?',
    meet: outcome('🌿 Cùng bác tưới cây', 0, 20, -2, 3, 0,
      'Bạn giúp bác chăm góc xanh rồi về mở tiệm.',
      'Bác Bình nhớ bạn đã góp sức giữ khu phố xanh sạch.'),
    message: outcome('🌱 Hẹn bác lần sau', 0, 0, 0, 1, 0,
      'Bạn chúc bác một buổi sáng vui và hẹn khi rảnh.',
      'Bác Bình giữ một bình tưới nhỏ cho buổi gặp sau.'),
  },
};
const choices: readonly WeekFiveChoice[] = ['meet', 'message'];
const key = (day: number, choice: WeekFiveChoice) => `week-five-${day}-${choice}`;
const has = (game: GameState, id: string): boolean =>
  game.relationshipRewardIds?.includes(id) === true ||
  game.storyLog?.some(item => item.id === id) === true;

export function getWeekFiveEpisode(game: GameState): Episode | null {
  const episode = episodes[game.day];
  if (!episode) return null;
  if (game.day === 31 && game.relationshipRewardIds?.includes('week-four-30-takeTime'))
    return { ...episode, prompt: 'Thảo thấy buổi trà khu phố rất vui và muốn giúp sửa biển tiệm trước khi đi làm.' };
  if (game.day === 32 && has(game, key(31, 'meet')))
    return { ...episode, prompt: 'Thảo vừa gửi bản phác thảo. An ghé ngang trên đường tới trường, mang cơm mẹ Mai gửi.' };
  if (game.day === 35 && has(game, key(34, 'meet')))
    return { ...episode, prompt: 'Sau lần đi chợ cùng cô Hạnh, bạn muốn cân đối ngân sách trước lời mời đi ăn của Duy.' };
  if (game.day === 37 && has(game, key(36, 'meet')))
    return { ...episode, prompt: 'Sau khi kiểm tra đèn an toàn cùng bố, bạn muốn góp sức chăm góc xanh với bác Bình.' };
  return episode;
}

export function getWeekFiveDecision(game: GameState): WeekFiveChoice | null {
  return choices.find(choice => has(game, key(game.day, choice))) ?? null;
}
export function getWeekFiveCallback(game: GameState): string | null {
  const yesterday = episodes[game.day - 1];
  const choice = choices.find(c => has(game, key(game.day - 1, c)));
  return yesterday && choice ? yesterday[choice].callback : null;
}
export function canChooseWeekFive(game: GameState, choice: WeekFiveChoice): boolean {
  const episode = episodes[game.day];
  if (!episode || !choices.includes(choice) || game.phase !== 'prep' ||
    game.morning.day !== game.day || game.morning.step !== 'finished' ||
    getWeekFiveDecision(game)) return false;
  const effect = episode[choice];
  const { minutes, energy } = game.city;
  return Number.isFinite(game.cash) && Number.isFinite(minutes) &&
    Number.isFinite(energy) && game.cash >= effect.cost &&
    energy >= Math.max(0, -effect.energy) && minutes + effect.minutes <= 1260 &&
    (choice !== 'meet' || minutes + effect.minutes <= episode.meetBefore);
}
export function chooseWeekFive(game: GameState, choice: WeekFiveChoice): GameState {
  if (!choices.includes(choice) || !episodes[game.day] ||
    game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step !== 'finished' || getWeekFiveDecision(game)) return game;
  if (!canChooseWeekFive(game, choice))
    return { ...game, notice: 'Cuộc hẹn đã qua giờ hoặc chưa đủ tiền, sức. Bạn có thể nhắn hẹn lại miễn phí.' };
  const episode = episodes[game.day];
  const effect = episode[choice];
  const id = key(game.day, choice);
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
    relationshipRewardIds: [...(game.relationshipRewardIds ?? []), id],
    storyLog: [{
      id, customerId: episode.characterId, customerName: episode.character,
      title: episode.title, text: effect.reply, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: effect.reply,
  };
}
