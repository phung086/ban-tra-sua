import type { GameState } from '../types';

export type PromiseChoice = 'keep' | 'postpone';
type PromiseKind = 'friend-invite' | 'family-call';

interface PromiseOutcome {
  label: string;
  minutes: number;
  cost: number;
  energy: number;
  goodwill: number;
  fans: number;
  reply: string;
  callback: string;
}

interface PromiseDefinition {
  title: string;
  character: string;
  characterId: string;
  prompt: string;
  deadline: number;
  keep: PromiseOutcome;
  postpone: PromiseOutcome;
}

export interface SocialPromise extends PromiseDefinition {
  kind: PromiseKind;
  originDay: number;
}

const PROMISES: Record<PromiseKind, PromiseDefinition> = {
  'friend-invite': {
    title: 'Lời hẹn với Lan', character: 'Lan', characterId: 'lan',
    prompt: 'Bạn từng hẹn Lan hôm khác đi chơi. Sáng nay Lan hỏi: “Mình đi chợ hoa một lát nhé?”',
    deadline: 660,
    keep: {
      label: '🌷 Giữ hẹn, ghé chợ hoa với Lan', minutes: 20, cost: 8000,
      energy: -3, goodwill: 3, fans: 1,
      reply: 'Bạn báo trước tiền nước là 8.000đ, Lan đồng ý. Hai người có một buổi sáng vui ở chợ hoa.',
      callback: 'Lan gửi ảnh chợ hoa: “Cảm ơn cậu đã giữ lời hẹn nhé!”',
    },
    postpone: {
      label: '💬 Nói rõ hôm nay vẫn bận', minutes: 0, cost: 0,
      energy: 0, goodwill: 0, fans: 0,
      reply: 'Bạn xin lỗi vì chưa thu xếp được, không hứa một giờ chưa chắc chắn. Lan thông cảm.',
      callback: 'Lan nhắn: “Đừng lo, lúc nào tiện mình đi cũng được.”',
    },
  },
  'family-call': {
    title: 'Lời hứa gọi mẹ', character: 'Mẹ Mai', characterId: 'family-mother-mai',
    prompt: 'Bạn từng hẹn sẽ gọi mẹ Mai khi rảnh. Mẹ nhắn hỏi hôm nay có tiện trò chuyện không.',
    deadline: 720,
    keep: {
      label: '☎️ Gọi mẹ, nghe chuyện ở nhà', minutes: 12, cost: 0,
      energy: 4, goodwill: 3, fans: 0,
      reply: 'Bạn chủ động gọi mẹ Mai. Mẹ kể chuyện bữa cơm nhà, rồi dặn bạn đừng bỏ bữa.',
      callback: 'Mẹ Mai gửi ảnh mâm cơm: “Hôm qua được nghe giọng con mẹ yên tâm rồi.”',
    },
    postpone: {
      label: '💌 Gửi mẹ một lời nhắn tử tế', minutes: 0, cost: 0,
      energy: 0, goodwill: 1, fans: 0,
      reply: 'Bạn nói rõ lịch làm và gửi mẹ lời hỏi thăm. Mẹ thả tim, không thúc giục.',
      callback: 'Mẹ Mai nhắn: “Cứ lo việc của con, rảnh thì gọi mẹ nhé.”',
    },
  },
};

const kinds: readonly PromiseKind[] = ['friend-invite', 'family-call'];
const choices: readonly PromiseChoice[] = ['keep', 'postpone'];
const originId = (day: number, kind: PromiseKind) =>
  `social-morning-${day}-${kind}-reply`;
const decisionId = (day: number, kind: PromiseKind, choice: PromiseChoice) =>
  `social-promise-${day}-${kind}-${choice}`;
const hasMemory = (game: GameState, id: string) =>
  game.relationshipRewardIds?.includes(id) === true ||
  game.storyLog?.some(entry => entry.id === id) === true;

/** Promises can be answered for three mornings and survive save/reload. */
export function getSocialPromise(game: GameState): SocialPromise | null {
  if (game.phase !== 'prep' || game.day < 2 || game.morning.day !== game.day) return null;
  for (let originDay = game.day - 1; originDay >= Math.max(1, game.day - 3); originDay--) {
    for (const kind of kinds) {
      if (!hasMemory(game, originId(originDay, kind))) continue;
      const decision = choices.find(choice => hasMemory(game, decisionId(originDay, kind, choice)));
      if (decision) {
        const id = decisionId(originDay, kind, decision);
        // Keep today's resolved card visible; don't resurrect it tomorrow.
        if (game.storyLog?.some(entry => entry.id === id && entry.day === game.day))
          return { ...PROMISES[kind], kind, originDay };
        continue;
      }
      return { ...PROMISES[kind], kind, originDay };
    }
  }
  return null;
}

export function getSocialPromiseChoice(game: GameState, promise: SocialPromise): PromiseChoice | null {
  return choices.find(choice => hasMemory(game, decisionId(promise.originDay, promise.kind, choice))) ?? null;
}

export function getSocialPromiseCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.day < 3) return null;
  for (const entry of game.storyLog ?? []) {
    if (entry.day !== game.day - 1) continue;
    for (let originDay = Math.max(1, game.day - 4); originDay <= game.day - 2; originDay++) {
      for (const kind of kinds) {
        for (const choice of choices) {
          if (entry.id === decisionId(originDay, kind, choice))
            return PROMISES[kind][choice].callback;
        }
      }
    }
  }
  return null;
}

export function canChooseSocialPromise(game: GameState, choice: PromiseChoice): boolean {
  const promise = getSocialPromise(game);
  if (!promise || game.morning.step !== 'finished' || !choices.includes(choice) ||
      getSocialPromiseChoice(game, promise)) return false;
  if (![game.cash, game.city.minutes, game.city.energy, game.city.goodwill, game.fans].every(Number.isFinite))
    return false;
  if (choice === 'postpone') return true; // Never softlock a late or broke player.
  const outcome = promise.keep;
  return game.cash >= outcome.cost && game.city.energy + outcome.energy >= 0 &&
    game.city.minutes + outcome.minutes <= Math.min(1260, promise.deadline);
}

export function chooseSocialPromise(game: GameState, choice: PromiseChoice): GameState {
  if (!canChooseSocialPromise(game, choice)) return game;
  const promise = getSocialPromise(game)!;
  const outcome = promise[choice];
  const id = decisionId(promise.originDay, promise.kind, choice);
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
      id, customerId: promise.characterId, customerName: promise.character,
      title: promise.title, text: outcome.reply, day: game.day, rewardFans: outcome.fans,
    }, ...(game.storyLog ?? [])].slice(0, 24),
    notice: outcome.reply,
  };
}
