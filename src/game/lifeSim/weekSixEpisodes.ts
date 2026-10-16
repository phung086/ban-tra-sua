import type { GameState } from '../types';

// Chapter VI extends the playable pre-shop day loop; no unbuilt district is unlocked.
export type WeekSixChoice = 'meet' | 'message';
type Outcome = {
  label: string; cost: number; minutes: number; energy: number; goodwill: number;
  satiety: number; reply: string; callback: string; stockSugar: number; fans: number;
};
type Episode = {
  title: string; character: string; characterId: string; schedule: string;
  meetBefore: number; prompt: string; meet: Outcome; message: Outcome;
};
const episodes: Record<number, Episode> = {
  "38": {
    "title": "Bữa tối giữ lời",
    "character": "Mẹ Mai",
    "characterId": "family-mother-mai",
    "schedule": "Mẹ Mai chuẩn bị đi làm lúc 10:00",
    "meetBefore": 600,
    "prompt": "Mẹ Mai rủ bạn ăn cơm và bàn kế hoạch nấu bữa tối. Bạn muốn ngồi lại một chút trước ca bán?",
    "meet": {
      "label": "🍚 Ăn cơm cùng mẹ",
      "cost": 0,
      "minutes": 20,
      "energy": 6,
      "goodwill": 3,
      "satiety": 20,
      "reply": "Hai mẹ con ăn cơm và hẹn tối cùng nấu món canh.",
      "callback": "Mẹ Mai nhắn công thức món canh và hỏi bạn có về ăn tối không.",
      "stockSugar": 0,
      "fans": 0
    },
    "message": {
      "label": "📞 Hẹn mẹ tối nay",
      "cost": 0,
      "minutes": 0,
      "energy": 0,
      "goodwill": 1,
      "satiety": 0,
      "reply": "Bạn gọi báo mẹ rằng mình sẽ sắp xếp sau ca.",
      "callback": "Mẹ Mai vui vì bạn báo lịch rõ ràng.",
      "stockSugar": 0,
      "fans": 0
    }
  },
  "39": {
    "title": "Cuốn sổ của anh Nam",
    "character": "Anh Nam",
    "characterId": "nam",
    "schedule": "Anh Nam mở hiệu sách đến 09:45 rồi đi giao sách",
    "meetBefore": 585,
    "prompt": "Anh Nam muốn giới thiệu sổ ghi ý tưởng để bạn theo dõi món trà khách thích.",
    "meet": {
      "label": "📚 Ghé hiệu sách trao đổi",
      "cost": 0,
      "minutes": 18,
      "energy": -1,
      "goodwill": 3,
      "satiety": 0,
      "reply": "Anh Nam cho bạn mượn cuốn sổ để ghi ý kiến khách.",
      "callback": "Anh Nam nhắc bạn ghi lại góp ý của cô Thu vào cuốn sổ.",
      "stockSugar": 0,
      "fans": 0
    },
    "message": {
      "label": "💬 Xin mẫu sổ qua tin nhắn",
      "cost": 0,
      "minutes": 0,
      "energy": 0,
      "goodwill": 1,
      "satiety": 0,
      "reply": "Anh Nam gửi mẫu ghi chú đơn giản để bạn tự làm.",
      "callback": "Anh Nam hỏi mẫu sổ có giúp bạn nhớ đơn không.",
      "stockSugar": 0,
      "fans": 0
    }
  },
  "40": {
    "title": "Nguồn đường cho ca bán",
    "character": "Cô Hạnh",
    "characterId": "hanh",
    "schedule": "Cô Hạnh bán nguyên liệu đến 10:30",
    "meetBefore": 630,
    "prompt": "Cô Hạnh có gói đường dự phòng. Mua sớm sẽ thêm nguyên liệu thực vào kho để pha trà hôm nay.",
    "meet": {
      "label": "🛍️ Mua 4 phần đường",
      "cost": 12000,
      "minutes": 20,
      "energy": -2,
      "goodwill": 2,
      "satiety": 0,
      "reply": "Bạn thanh toán 12.000đ và nhận 4 phần đường cho kho pha trà.",
      "callback": "Cô Hạnh nhớ bạn đã thanh toán đúng hẹn và hỏi kho còn đủ không.",
      "stockSugar": 4,
      "fans": 0
    },
    "message": {
      "label": "📱 Hỏi giá và để lần sau",
      "cost": 0,
      "minutes": 0,
      "energy": 0,
      "goodwill": 1,
      "satiety": 0,
      "reply": "Bạn hỏi giá rồi giữ ngân sách cho ca bán.",
      "callback": "Cô Hạnh giữ bảng giá để bạn so sánh khi cần.",
      "stockSugar": 0,
      "fans": 0
    }
  },
  "41": {
    "title": "Khách quen muốn ít ngọt",
    "character": "Cô Thu",
    "characterId": "thu",
    "schedule": "Cô Thu ghé trước 11:00",
    "meetBefore": 660,
    "prompt": "Cô Thu muốn bạn nhớ cách chọn độ ngọt khi pha trà. Bạn có muốn dành thời gian ghi chú?",
    "meet": {
      "label": "🫖 Nghe góp ý và ghi sổ",
      "cost": 0,
      "minutes": 15,
      "energy": -1,
      "goodwill": 3,
      "satiety": 0,
      "reply": "Bạn ghi lại khẩu vị ít ngọt; khách thấy được lắng nghe và giới thiệu thêm một người bạn.",
      "callback": "Cô Thu nhắc bạn kiểm tra lượng đường trước khi giao ly.",
      "stockSugar": 0,
      "fans": 1
    },
    "message": {
      "label": "📝 Xin góp ý qua tin nhắn",
      "cost": 0,
      "minutes": 0,
      "energy": 0,
      "goodwill": 1,
      "satiety": 0,
      "reply": "Cô Thu gửi ghi chú ngắn; bạn vẫn tự chọn công thức khi có đơn.",
      "callback": "Cô Thu cảm ơn vì bạn vẫn lắng nghe dù đang bận.",
      "stockSugar": 0,
      "fans": 0
    }
  },
  "42": {
    "title": "Bữa nhóm có ngân sách",
    "character": "Duy",
    "characterId": "friend-duy",
    "schedule": "Duy chốt bàn ăn lúc 11:30",
    "meetBefore": 690,
    "prompt": "Duy rủ Lan và Thảo ăn cùng, mỗi người tự trả phần mình. Bạn muốn xác nhận trước khoản 18.000đ?",
    "meet": {
      "label": "🥢 Đồng ý trả phần mình",
      "cost": 18000,
      "minutes": 25,
      "energy": -2,
      "goodwill": 3,
      "satiety": 20,
      "reply": "Bạn trả đúng 18.000đ đã đồng ý; không phải trả hộ cả nhóm.",
      "callback": "Duy cảm ơn vì cả nhóm đã thống nhất hóa đơn từ đầu.",
      "stockSugar": 0,
      "fans": 0
    },
    "message": {
      "label": "🚶 Rủ nhóm đi dạo miễn phí",
      "cost": 0,
      "minutes": 0,
      "energy": 0,
      "goodwill": 2,
      "satiety": 0,
      "reply": "Bạn rủ mọi người đi dạo sau ca, không phát sinh hóa đơn.",
      "callback": "Duy nhắn địa điểm đi dạo gần tiệm cho cả nhóm.",
      "stockSugar": 0,
      "fans": 0
    }
  },
  "43": {
    "title": "An cần người nghe",
    "character": "An",
    "characterId": "family-sibling-an",
    "schedule": "An vào lớp lúc 09:30",
    "meetBefore": 570,
    "prompt": "An lo buổi thuyết trình ở trường và muốn bạn nghe thử vài câu mở đầu.",
    "meet": {
      "label": "🎒 Nghe An tập nói",
      "cost": 0,
      "minutes": 15,
      "energy": -1,
      "goodwill": 3,
      "satiety": 0,
      "reply": "Bạn lắng nghe, giúp An bớt hồi hộp trước khi vào lớp.",
      "callback": "An kể rằng phần mở đầu hôm qua đã giúp em tự tin hơn.",
      "stockSugar": 0,
      "fans": 0
    },
    "message": {
      "label": "💌 Gửi lời động viên",
      "cost": 0,
      "minutes": 0,
      "energy": 0,
      "goodwill": 1,
      "satiety": 0,
      "reply": "Bạn nhắn An cố gắng và hẹn nghe kể sau giờ học.",
      "callback": "An nhắn cảm ơn vì bạn nhớ lịch học.",
      "stockSugar": 0,
      "fans": 0
    }
  },
  "44": {
    "title": "Một tuần biết nhờ nhau",
    "character": "Bác Bình",
    "characterId": "binh",
    "schedule": "Bác Bình tổ chức dọn góc phố trước 11:00",
    "meetBefore": 660,
    "prompt": "Bác Bình rủ cả khu phố chăm cây và ghé tiệm uống trà. Bạn muốn tham gia một chút trước ca bán?",
    "meet": {
      "label": "🌿 Cùng dọn góc phố",
      "cost": 0,
      "minutes": 25,
      "energy": -3,
      "goodwill": 4,
      "satiety": 0,
      "reply": "Bạn cùng bác Bình chăm cây; hai người hàng xóm biết đến tiệm.",
      "callback": "Bác Bình kể với cô Hạnh rằng bạn luôn sẵn lòng giúp khu phố.",
      "stockSugar": 0,
      "fans": 2
    },
    "message": {
      "label": "📮 Gửi lời chúc và hẹn lại",
      "cost": 0,
      "minutes": 0,
      "energy": 0,
      "goodwill": 1,
      "satiety": 0,
      "reply": "Bạn gửi lời chúc và giữ sức cho ca bán.",
      "callback": "Bác Bình nhắn rằng lần tới bạn vẫn có thể tham gia.",
      "stockSugar": 0,
      "fans": 0
    }
  }
};
const choices: readonly WeekSixChoice[] = ['meet', 'message'];
const key = (day: number, choice: WeekSixChoice) => `week-six-${day}-${choice}`;
const remembers = (game: GameState, id: string): boolean =>
  game.relationshipRewardIds?.includes(id) === true ||
  game.storyLog?.some(moment => moment.id === id) === true;

export function getWeekSixEpisode(game: GameState): Episode | null {
  const episode = episodes[game.day];
  if (!episode) return null;
  if (game.day === 38 && remembers(game, 'week-five-37-meet'))
    return { ...episode, prompt: 'Bác Bình cảm ơn bạn đã chăm cây hôm qua. Mẹ Mai rủ bạn ăn cơm và lên kế hoạch nấu bữa tối.' };
  if (game.day === 40 && remembers(game, key(39, 'meet')))
    return { ...episode, prompt: 'Anh Nam đã cho mượn sổ ghi ý tưởng. Cô Hạnh hỏi bạn có muốn bổ sung đường cho ca bán hôm nay không.' };
  if (game.day === 41 && remembers(game, key(40, 'meet')))
    return { ...episode, prompt: 'Bạn đã mua đường dự phòng ở chợ. Cô Thu muốn góp ý để mỗi ly trà đúng khẩu vị.' };
  if (game.day === 42 && remembers(game, 'week-five-35-message'))
    return { ...episode, prompt: 'Duy nhớ lần trước bạn xin đổi lịch vì ngân sách. Hôm nay cả nhóm muốn chốt rõ mỗi người trả bao nhiêu.' };
  if (game.day === 44 && remembers(game, key(43, 'meet')))
    return { ...episode, prompt: 'An đã tự tin hơn sau buổi tập nói. Bác Bình rủ bạn góp sức chăm góc phố trước ca bán.' };
  return episode;
}

export function getWeekSixDecision(game: GameState): WeekSixChoice | null {
  return choices.find(choice => remembers(game, key(game.day, choice))) ?? null;
}
export function getWeekSixCallback(game: GameState): string | null {
  const yesterday = episodes[game.day - 1];
  const choice = choices.find(c => remembers(game, key(game.day - 1, c)));
  return yesterday && choice ? yesterday[choice].callback : null;
}
export function getWeekSixRecap(game: GameState): string | null {
  if (game.day !== 44) return null;
  const supply = remembers(game, key(40, 'meet'))
    ? 'Bạn đã chủ động chuẩn bị đường cho những ca bán.'
    : 'Bạn đang cân nhắc nguồn hàng phù hợp ngân sách.';
  const friendship = remembers(game, key(42, 'meet'))
    ? 'Nhóm bạn đã thống nhất rõ tiền ăn.'
    : remembers(game, key(42, 'message'))
      ? 'Nhóm bạn giữ được cuộc hẹn không tốn tiền.'
      : 'Bạn có thể chủ động hẹn nhóm bạn vào tuần sau.';
  const community = remembers(game, key(44, 'meet'))
    ? 'Góc phố sạch hơn và thêm hàng xóm biết đến tiệm.'
    : remembers(game, key(44, 'message'))
      ? 'Bạn giữ lời hẹn giúp khu phố khi có thời gian.'
      : 'Khu phố vẫn chờ bạn trong những ngày tới.';
  return [supply, friendship, community].join(' ');
}

export function canChooseWeekSix(game: GameState, choice: WeekSixChoice): boolean {
  const episode = episodes[game.day];
  if (!episode || !choices.includes(choice) || game.phase !== 'prep' ||
      game.morning.day !== game.day || game.morning.step !== 'finished' ||
      getWeekSixDecision(game)) return false;
  const effect = episode[choice];
  if (!Number.isFinite(game.cash) || !Number.isFinite(game.city.minutes) ||
      !Number.isFinite(game.city.energy) || !Number.isFinite(game.inventory.sugar) ||
      !Number.isFinite(game.morning.satiety)) return false;
  if (choice === 'message') return true; // Zero-cost fallback, even after the appointment.
  return game.cash >= effect.cost && game.city.energy >= Math.max(0, -effect.energy) &&
    game.city.minutes + effect.minutes <= Math.min(1260, episode.meetBefore);
}

export function chooseWeekSix(game: GameState, choice: WeekSixChoice): GameState {
  if (!choices.includes(choice) || !episodes[game.day] || game.phase !== 'prep' ||
      game.morning.day !== game.day || game.morning.step !== 'finished' ||
      getWeekSixDecision(game)) return game;
  if (!canChooseWeekSix(game, choice))
    return { ...game, notice: 'Đã qua giờ hẹn hoặc chưa đủ tiền, sức. Bạn có thể nhắn hẹn lại miễn phí.' };
  const episode = episodes[game.day];
  const effect = episode[choice];
  const id = key(game.day, choice);
  return {
    ...game,
    cash: game.cash - effect.cost,
    fans: game.fans + effect.fans,
    inventory: effect.stockSugar > 0
      ? { ...game.inventory, sugar: game.inventory.sugar + effect.stockSugar }
      : game.inventory,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + effect.minutes),
      energy: Math.min(100, Math.max(0, game.city.energy + effect.energy)),
      goodwill: game.city.goodwill + effect.goodwill,
      journal: [`Ngày ${game.day}: ${effect.reply}`, ...game.city.journal].slice(0, 24),
    },
    morning: {
      ...game.morning,
      satiety: Math.min(100, Math.max(0, game.morning.satiety + effect.satiety)),
    },
    relationshipRewardIds: [...(game.relationshipRewardIds ?? []), id],
    storyLog: [{
      id, customerId: episode.characterId, customerName: episode.character,
      title: episode.title, text: effect.reply, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: effect.reply,
  };
}
