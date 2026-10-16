import type { GameState } from '../types';
import type { DayEpisodeChoice } from './morning';

export interface DayEpisode {
  day: number;
  title: string;
  character: string;
  characterId: string;
  question: string;
  helpLabel: string;
  focusLabel: string;
  minutes: number;
  energy: number;
  goodwill: number;
  helpReply: string;
  focusReply: string;
  callback: string;
}

/** Small playable story beats for the opening week, with no new scene or assets. */
const EPISODES: Record<number, DayEpisode> = {
  2: {
    day: 2, title: 'Trang sổ ở hiệu sách', character: 'Anh Nam', characterId: 'nam',
    question: 'Anh Nam đang tìm cuốn sổ ghi tên khách mượn sách. Bạn có ghé giúp anh một lát không?',
    helpLabel: '📚 Giúp Nam tìm sổ', focusLabel: '🧋 Xin phép về mở tiệm',
    minutes: 10, energy: 4, goodwill: 2,
    helpReply: 'Nam tìm được cuốn sổ kẹp sau giá sách. Anh cười: “May quá, nhờ bạn đấy!”',
    focusReply: 'Nam gật đầu: “Không sao, bạn cứ lo cho tiệm trước.”',
    callback: 'Nam nhắn cảm ơn lần nữa. Cuốn sổ đã về đúng ngăn sách.',
  },
  3: {
    day: 3, title: 'Tờ áp phích đầu phố', character: 'Lan', characterId: 'lan',
    question: 'Lan đang treo áp phích cho buổi đọc sách cuối tuần. Gió cứ thổi tung một góc giấy.',
    helpLabel: '🪧 Giữ giúp Lan tờ áp phích', focusLabel: '👋 Hẹn gặp Lan lúc khác',
    minutes: 8, energy: 3, goodwill: 1,
    helpReply: 'Hai người dán xong tờ cuối. Lan bảo: “Cuối tuần nhớ ghé nhé!”',
    focusReply: 'Lan xua tay: “Bạn cứ mở hàng đi, để tớ xoay xở được.”',
    callback: 'Lan gửi ảnh tờ áp phích vẫn đứng vững trước gió.',
  },
  4: {
    day: 4, title: 'Một ly ít đường', character: 'Cô Thu', characterId: 'thu',
    question: 'Cô Thu muốn góp ý cho thực đơn: “Đừng ngọt quá, người già cũng muốn uống trà mà.”',
    helpLabel: '📝 Ghi lại góp ý của cô', focusLabel: '🏪 Cảm ơn rồi mở tiệm',
    minutes: 6, energy: 2, goodwill: 2,
    helpReply: 'Cô Thu mỉm cười: “Biết nghe khách thế mới giữ được tiệm lâu.”',
    focusReply: 'Cô Thu nói: “Khi nào rảnh nhớ thử món ít đường nhé.”',
    callback: 'Cô Thu đi ngang và hỏi liệu hôm nay tiệm có lựa chọn ít đường.',
  },
  5: {
    day: 5, title: 'Băng ghế dưới tán sấu', character: 'Bác Bình', characterId: 'binh',
    question: 'Bác Bình đang nhặt lá quanh băng ghế để trẻ con có chỗ ngồi chơi.',
    helpLabel: '🍃 Phụ bác dọn lá', focusLabel: '☀️ Chào bác rồi đi làm',
    minutes: 12, energy: 5, goodwill: 2,
    helpReply: 'Bác Bình đưa bạn chai nước: “Làm một chút thôi, đừng để muộn việc.”',
    focusReply: 'Bác Bình cười hiền: “Lo làm ăn nhé, bác tự dọn được.”',
    callback: 'Băng ghế sạch sẽ. Bác Bình đã để sẵn một chai nước nhỏ.',
  },
  6: {
    day: 6, title: 'Gánh hàng sớm', character: 'Cô Hạnh', characterId: 'hanh',
    question: 'Cô Hạnh đang chuyển hai sọt hàng vào sạp trước giờ chợ đông.',
    helpLabel: '🥬 Bê giúp một sọt hàng', focusLabel: '🕗 Chúc cô bán đắt hàng',
    minutes: 10, energy: 4, goodwill: 2,
    helpReply: 'Cô Hạnh gật gù: “Đúng giờ và biết giúp người, thế là quý.”',
    focusReply: 'Cô Hạnh vẫy tay: “Hôm nào rảnh thì ghé mua nhé.”',
    callback: 'Cô Hạnh nhớ bạn đã phụ bưng sọt hàng hôm trước.',
  },
  7: {
    day: 7, title: 'Bức ảnh cuối tuần', character: 'Bác Minh', characterId: 'minh',
    question: 'Bác Minh mang theo một tấm ảnh cũ của con phố và muốn kể chuyện trước giờ tiệm mở.',
    helpLabel: '📷 Ngồi nghe chuyện phố xưa', focusLabel: '☕ Hẹn bác sang tuần',
    minutes: 12, energy: 2, goodwill: 2,
    helpReply: 'Bác kể về hàng sấu ngày trước. Bạn nhận ra mình đã có một tuần ở đây.',
    focusReply: 'Bác Minh cất ảnh: “Để tuần sau bác kể tiếp nhé.”',
    callback: 'Bác Minh hứa sẽ mang thêm một tấm ảnh phố xưa.',
  },
};

export function getDayEpisode(day: number): DayEpisode | null {
  return EPISODES[day] ?? null;
}

/** A follow-up on the next day survives sleep and reload via the existing storyLog. */
export function getEpisodeCallback(game: GameState): string | null {
  const previous = EPISODES[game.day - 1];
  if (!previous) return null;
  const moment = game.storyLog.find(item => item.id === `day-episode-${game.day - 1}-help`);
  return moment ? previous.callback : null;
}

export function chooseDayEpisode(game: GameState, choice: DayEpisodeChoice): GameState {
  const episode = getDayEpisode(game.day);
  if (!episode || game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step !== 'finished' || game.morning.episodeChoice != null ||
    (choice !== 'help' && choice !== 'focus')) return game;
  const helping = choice === 'help';
  if (helping && (game.city.energy < episode.energy || game.city.minutes + episode.minutes > 1260)) {
    return { ...game, notice: 'Hôm nay đã mệt hoặc quá muộn. Bạn vẫn có thể chào rồi về mở tiệm.' };
  }
  const minutes = helping ? episode.minutes : 0;
  const reply = helping ? episode.helpReply : episode.focusReply;
  return {
    ...game,
    morning: { ...game.morning, episodeChoice: choice },
    city: {
      ...game.city,
      minutes: game.city.minutes + minutes,
      energy: Math.max(0, game.city.energy - (helping ? episode.energy : 0)),
      goodwill: game.city.goodwill + (helping ? episode.goodwill : 0),
      journal: [`Ngày ${game.day} · ${episode.title}: ${reply}`, ...game.city.journal].slice(0, 24),
    },
    storyLog: [
      ...game.storyLog,
      {
        id: `day-episode-${game.day}-${choice}`,
        customerId: episode.characterId,
        customerName: episode.character,
        title: episode.title,
        text: reply,
        day: game.day,
        rewardFans: 0,
      },
    ],
    notice: reply,
  };
}
