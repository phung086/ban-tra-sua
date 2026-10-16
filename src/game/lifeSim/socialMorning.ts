import type { GameState } from '../types';
import type { SocialHook } from './dayPlanner';

export type SocialMorningChoice = 'visit' | 'reply';
type ActiveSocialHook = Exclude<SocialHook, 'none'>;

interface SocialOutcome {
  label: string;
  minutes: number;
  cost: number;
  energy: number;
  goodwill: number;
  fans: number;
  reply: string;
  nextDay: string;
}

export interface SocialMorningEvent {
  hook: ActiveSocialHook;
  character: string;
  characterId: string;
  emoji: string;
  title: string;
  prompt: string;
  deadline: number;
  visit: SocialOutcome;
  reply: SocialOutcome;
}

const EVENTS: Record<ActiveSocialHook, SocialMorningEvent> = {
  'friend-invite': {
    hook: 'friend-invite',
    character: 'Lan',
    characterId: 'lan',
    emoji: '👩',
    title: 'Lan rủ ghé chợ hoa',
    prompt: 'Lan nhắn: “Tớ thấy một góc chợ hoa xinh lắm. Trước giờ mở tiệm đi ngắm một lát không?” Bạn còn phải chuẩn bị quầy trà.',
    deadline: 630,
    visit: {
      label: '🌷 Đi dạo cùng Lan, mua hai chiếc bánh',
      minutes: 25, cost: 16000, energy: -4, goodwill: 2, fans: 2,
      reply: 'Bạn nói trước giá hai chiếc bánh là 16.000đ, Lan đồng ý chia chuyện vui. Lan chụp một tấm ảnh tiệm trà đăng lên nhóm bạn.',
      nextDay: 'Lan gửi ảnh chợ hoa hôm qua: “Có thêm hai người hỏi địa chỉ tiệm cậu đấy!”',
    },
    reply: {
      label: '📱 Hẹn Lan vào một ngày rảnh',
      minutes: 0, cost: 0, energy: 0, goodwill: 1, fans: 0,
      reply: 'Bạn nói rõ sáng nay cần chuẩn bị tiệm. Lan nhắn: “Ừ, để hôm khác nhé!”',
      nextDay: 'Lan nhắn lại: “Hôm nào rảnh mình đi dạo nhé, nhớ báo tớ trước.”',
    },
  },
  'family-call': {
    hook: 'family-call',
    character: 'Mẹ Mai',
    characterId: 'family-mother-mai',
    emoji: '👩‍🍳',
    title: 'Cuộc gọi của mẹ',
    prompt: 'Mẹ Mai gọi hỏi sáng nay con đã ăn gì và tiệm có bận không. Mẹ cũng muốn kể một chuyện nhỏ ở nhà.',
    deadline: 690,
    visit: {
      label: '☎️ Ngồi xuống nghe mẹ kể chuyện',
      minutes: 15, cost: 0, energy: 3, goodwill: 3, fans: 0,
      reply: 'Bạn kể về bữa sáng và dành thời gian nghe mẹ nói. Câu chuyện không có gì lớn, nhưng cả hai đều thấy nhẹ lòng.',
      nextDay: 'Mẹ Mai nhắn: “Hôm qua nói chuyện với con mẹ vui lắm. Nhớ giữ sức nhé!”',
    },
    reply: {
      label: '💬 Nhắn mẹ sẽ gọi sau ca bán',
      minutes: 0, cost: 0, energy: 0, goodwill: 1, fans: 0,
      reply: 'Bạn nhắn rằng mình đang chuẩn bị tiệm và sẽ gọi khi rảnh. Mẹ thả một trái tim, không giục thêm.',
      nextDay: 'Mẹ Mai hỏi: “Hôm qua con bận lắm à? Khi nào tiện thì kể mẹ nghe nhé.”',
    },
  },
};

const CHOICES: readonly SocialMorningChoice[] = ['visit', 'reply'];
const decisionId = (day: number, hook: ActiveSocialHook, choice: SocialMorningChoice) =>
  `social-morning-${day}-${hook}-${choice}`;

function hasMemory(game: GameState, id: string): boolean {
  return game.relationshipRewardIds?.includes(id) === true ||
    game.storyLog?.some(entry => entry.id === id) === true;
}

export function getSocialMorningEvent(game: GameState): SocialMorningEvent | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day) return null;
  return EVENTS[game.morning.plan.socialHook as ActiveSocialHook] ?? null;
}

export function getSocialMorningDecision(game: GameState): SocialMorningChoice | null {
  const event = getSocialMorningEvent(game);
  return event ? CHOICES.find(choice => hasMemory(game, decisionId(game.day, event.hook, choice))) ?? null : null;
}

export function getSocialMorningCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.day < 2) return null;
  for (const event of Object.values(EVENTS)) {
    for (const choice of CHOICES) {
      if (hasMemory(game, decisionId(game.day - 1, event.hook, choice)))
        return event[choice].nextDay;
    }
  }
  return null;
}

export function canChooseSocialMorning(game: GameState, choice: SocialMorningChoice): boolean {
  const event = getSocialMorningEvent(game);
  if (!event || !CHOICES.includes(choice) ||
      game.morning.step !== 'finished' || getSocialMorningDecision(game)) return false;
  if (![game.cash, game.city.minutes, game.city.energy, game.city.goodwill, game.fans].every(Number.isFinite))
    return false;
  if (choice === 'reply') return true; // Always permit a respectful, free alternative.
  const outcome = event.visit;
  return game.cash >= outcome.cost && game.city.energy + outcome.energy >= 0 &&
    game.city.minutes + outcome.minutes <= Math.min(1260, event.deadline);
}

export function chooseSocialMorning(game: GameState, choice: SocialMorningChoice): GameState {
  if (!canChooseSocialMorning(game, choice)) return game;
  const event = getSocialMorningEvent(game)!;
  const outcome = event[choice];
  const id = decisionId(game.day, event.hook, choice);
  return {
    ...game,
    cash: game.cash - outcome.cost,
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
      id, customerId: event.characterId, customerName: event.character,
      title: event.title, text: outcome.reply, day: game.day, rewardFans: outcome.fans,
    }, ...game.storyLog].slice(0, 24),
    notice: outcome.reply,
  };
}
