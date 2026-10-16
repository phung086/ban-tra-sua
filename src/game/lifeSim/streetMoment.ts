import type { GameState } from '../types';
import type { StreetHook } from './dayPlanner';

export type StreetChoice = 'help' | 'message';
type ActiveHook = Exclude<StreetHook, 'none'>;
type StreetOutcome = {
  label: string; minutes: number; energy: number; goodwill: number; fans: number;
  reply: string; callback: string;
};
export type StreetMoment = {
  hook: ActiveHook; character: string; characterId: string; title: string;
  prompt: string; deadline: number; help: StreetOutcome; message: StreetOutcome;
};

const MOMENTS: Record<ActiveHook, StreetMoment> = {
  'forgotten-umbrella': {
    hook: 'forgotten-umbrella', character: 'Bác Minh', characterId: 'minh',
    title: 'Chiếc ô bên ghế đá',
    prompt: 'Bác Minh bỏ quên chiếc ô ở ghế đá cạnh hồ. Bác đang đi tìm mà vẫn chưa thấy.',
    deadline: 660,
    help: {
      label: '☂️ Mang ô trả bác', minutes: 15, energy: -3, goodwill: 3, fans: 1,
      reply: 'Bạn mang chiếc ô đến cho bác Minh. Bác kể thêm một kỷ niệm về khu phố và cảm ơn trước khi bạn mở tiệm.',
      callback: 'Bác Minh chào bạn từ bên hồ: “May mà hôm qua có cháu mang ô về!”',
    },
    message: {
      label: '📱 Nhắn bác vị trí chiếc ô', minutes: 0, energy: 0, goodwill: 1, fans: 0,
      reply: 'Bạn gửi tin chỉ đúng chỗ để bác Minh tự lấy ô, không lỡ giờ mở tiệm.',
      callback: 'Bác Minh nhắn rằng đã tìm được chiếc ô nhờ lời chỉ dẫn của bạn.',
    },
  },
  'neighbor-help': {
    hook: 'neighbor-help', character: 'Bác Bình', characterId: 'binh',
    title: 'Góc cây trước ngõ',
    prompt: 'Bác Bình đang mang bình tưới và mấy chậu cây nhỏ ra đầu ngõ. Một chậu hơi nặng với bác.',
    deadline: 690,
    help: {
      label: '🌿 Giúp bác mang chậu cây', minutes: 20, energy: -4, goodwill: 4, fans: 1,
      reply: 'Hai bác cháu đặt chậu cây vào chỗ râm mát. Người đi đường ghé nhìn góc xanh mới.',
      callback: 'Bác Bình chỉ chậu cây đã tươi hơn và nhớ bạn đã giúp bác hôm qua.',
    },
    message: {
      label: '💬 Hỏi thăm và hẹn giúp sau', minutes: 0, energy: 0, goodwill: 1, fans: 0,
      reply: 'Bạn hỏi thăm bác Bình và nói rõ giờ mở tiệm, không hứa làm việc mình chưa kịp.',
      callback: 'Bác Bình cảm ơn bạn đã báo lịch, và kể rằng có hàng xóm giúp bê chậu cây.',
    },
  },
};

const choices: readonly StreetChoice[] = ['help', 'message'];
const key = (day: number, hook: ActiveHook, choice: StreetChoice) =>
  `street-moment-${day}-${hook}-${choice}`;
const remembered = (game: GameState, id: string) =>
  game.relationshipRewardIds?.includes(id) === true ||
  game.storyLog?.some(entry => entry.id === id) === true;

export function getStreetMoment(game: GameState): StreetMoment | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day) return null;
  return MOMENTS[game.morning.plan.streetHook as ActiveHook] ?? null;
}

export function getStreetMomentChoice(game: GameState): StreetChoice | null {
  const moment = getStreetMoment(game);
  return moment ? choices.find(choice => remembered(game, key(game.day, moment.hook, choice))) ?? null : null;
}

export function getStreetMomentCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.day <= 1) return null;
  for (const moment of Object.values(MOMENTS))
    for (const choice of choices)
      if (remembered(game, key(game.day - 1, moment.hook, choice)))
        return moment[choice].callback;
  return null;
}

export function canChooseStreetMoment(game: GameState, choice: StreetChoice): boolean {
  const moment = getStreetMoment(game);
  if (!moment || !choices.includes(choice) || game.morning.step !== 'finished' || getStreetMomentChoice(game))
    return false;
  if (![game.city.minutes, game.city.energy, game.city.goodwill, game.fans].every(Number.isFinite))
    return false;
  if (choice === 'message') return true; // A late or tired player is never softlocked.
  const outcome = moment.help;
  return game.city.minutes + outcome.minutes <= Math.min(1260, moment.deadline) &&
    game.city.energy >= -outcome.energy;
}

export function chooseStreetMoment(game: GameState, choice: StreetChoice): GameState {
  if (!canChooseStreetMoment(game, choice)) return game;
  const moment = getStreetMoment(game)!;
  const outcome = moment[choice];
  const id = key(game.day, moment.hook, choice);
  return {
    ...game,
    fans: game.fans + outcome.fans,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + outcome.minutes),
      energy: Math.max(0, Math.min(100, game.city.energy + outcome.energy)),
      goodwill: game.city.goodwill + outcome.goodwill,
      journal: [`Ngày ${game.day}: ${outcome.reply}`, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...(game.relationshipRewardIds ?? []), id],
    storyLog: [{
      id, customerId: moment.characterId, customerName: moment.character,
      title: moment.title, text: outcome.reply, day: game.day, rewardFans: outcome.fans,
    }, ...game.storyLog].slice(0, 24),
    notice: outcome.reply,
  };
}
