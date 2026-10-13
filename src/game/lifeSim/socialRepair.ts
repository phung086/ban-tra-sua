import type { GameState } from '../types';

export type RepairChoice = 'talk' | 'honest';
type RepairKind = 'friend-invite' | 'family-call';

interface RepairOutcome {
  label: string;
  minutes: number;
  energy: number;
  goodwill: number;
  reply: string;
  callback: string;
}

interface RepairDefinition {
  character: string;
  characterId: string;
  title: string;
  prompt: string;
  deadline: number;
  talk: RepairOutcome;
  honest: RepairOutcome;
}

export interface SocialRepair extends RepairDefinition {
  kind: RepairKind;
  originDay: number;
  daysLate: number;
}

const REPAIRS: Record<RepairKind, RepairDefinition> = {
  'friend-invite': {
    character: 'Lan', characterId: 'lan',
    title: 'Lan vẫn đợi một lời hẹn',
    prompt: 'Lan nhắn: “Tớ biết cậu bận mở tiệm, nhưng lần trước mình chưa chốt được ngày nào. Cậu còn muốn đi cùng tớ không?”',
    deadline: 720,
    talk: {
      label: '🌷 Dành ít phút gọi Lan', minutes: 10, energy: -2, goodwill: 3,
      reply: 'Bạn gọi Lan, nói thật vì sao mình chưa thu xếp được. Hai người cười về những buổi sáng bận rộn và thống nhất sẽ hỏi nhau trước khi hẹn.',
      callback: 'Lan nhắn: “Cảm ơn cậu đã gọi. Mình cứ báo nhau trước, không cần vội nhé.”',
    },
    honest: {
      label: '💬 Nói rõ chưa thể hẹn ngày', minutes: 0, energy: 0, goodwill: 1,
      reply: 'Bạn nói mình chưa thể sắp xếp một cuộc hẹn mới. Lan hơi tiếc nhưng trân trọng câu trả lời rõ ràng.',
      callback: 'Lan gửi sticker: “Khi nào cậu rảnh thì nói tớ, đừng ngại.”',
    },
  },
  'family-call': {
    character: 'Mẹ Mai', characterId: 'family-mother-mai',
    title: 'Cuộc gọi còn dang dở',
    prompt: 'Mẹ Mai nhắn: “Mẹ không muốn giục, chỉ muốn biết dạo này con thế nào. Hôm nay mình nói chuyện được không?”',
    deadline: 780,
    talk: {
      label: '☎️ Gọi mẹ một lát', minutes: 12, energy: 3, goodwill: 3,
      reply: 'Bạn gọi mẹ Mai và kể chuyện tiệm. Mẹ nghe chăm chú, rồi cả hai cùng hẹn sẽ nói chuyện khi thật sự có thời gian.',
      callback: 'Mẹ Mai nhắn: “Nghe con kể chuyện tiệm hôm qua, mẹ thấy vui lắm.”',
    },
    honest: {
      label: '💌 Nhắn mẹ biết mình vẫn ổn', minutes: 0, energy: 0, goodwill: 1,
      reply: 'Bạn nhắn mẹ rằng mình vẫn ổn, chỉ đang bận. Mẹ cảm ơn vì bạn đã nói rõ, không cần xin lỗi quá nhiều.',
      callback: 'Mẹ Mai gửi lời chúc: “Con cứ chăm mình cho tốt nhé.”',
    },
  },
};

const kinds: readonly RepairKind[] = ['friend-invite', 'family-call'];
const choices: readonly RepairChoice[] = ['talk', 'honest'];
const originalId = (day: number, kind: RepairKind) =>
  `social-morning-${day}-${kind}-reply`;
const promiseId = (day: number, kind: RepairKind, choice: 'keep' | 'postpone') =>
  `social-promise-${day}-${kind}-${choice}`;
const repairId = (day: number, kind: RepairKind, choice: RepairChoice) =>
  `social-repair-${day}-${kind}-${choice}`;
const remembered = (game: GameState, id: string): boolean =>
  game.relationshipRewardIds?.includes(id) === true ||
  game.storyLog?.some(entry => entry.id === id) === true;

function hasResolution(game: GameState, day: number, kind: RepairKind): boolean {
  return ['keep', 'postpone'].some(choice =>
    remembered(game, promiseId(day, kind, choice as 'keep' | 'postpone'))) ||
    choices.some(choice => remembered(game, repairId(day, kind, choice)));
}

/**
 * If a promise was left unanswered for three mornings, offer a gentle
 * reconciliation on the fourth or fifth morning. The NPC remembers either
 * answer; no hidden fee or relationship penalty is imposed.
 */
export function getSocialRepair(game: GameState): SocialRepair | null {
  if (game.phase !== 'prep' || game.day < 5 || game.morning.day !== game.day) return null;
  for (let originDay = game.day - 4; originDay >= Math.max(1, game.day - 5); originDay--) {
    for (const kind of kinds) {
      if (!remembered(game, originalId(originDay, kind))) continue;
      const done = choices.find(choice => remembered(game, repairId(originDay, kind, choice)));
      if (hasResolution(game, originDay, kind)) {
        const completedToday = done && game.storyLog?.some(entry =>
          entry.id === repairId(originDay, kind, done) && entry.day === game.day);
        if (completedToday) return { ...REPAIRS[kind], kind, originDay, daysLate: game.day - originDay };
        continue;
      }
      return { ...REPAIRS[kind], kind, originDay, daysLate: game.day - originDay };
    }
  }
  return null;
}

export function getSocialRepairChoice(game: GameState, repair: SocialRepair): RepairChoice | null {
  return choices.find(choice => remembered(game, repairId(repair.originDay, repair.kind, choice))) ?? null;
}

export function getSocialRepairCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.day < 6) return null;
  for (const entry of game.storyLog ?? []) {
    if (entry.day !== game.day - 1) continue;
    for (let originDay = Math.max(1, game.day - 6); originDay <= game.day - 5; originDay++)
      for (const kind of kinds)
        for (const choice of choices)
          if (entry.id === repairId(originDay, kind, choice))
            return REPAIRS[kind][choice].callback;
  }
  return null;
}

export function canChooseSocialRepair(game: GameState, choice: RepairChoice): boolean {
  const repair = getSocialRepair(game);
  if (!repair || game.morning.step !== 'finished' || !choices.includes(choice) ||
      getSocialRepairChoice(game, repair)) return false;
  if (![game.city.minutes, game.city.energy, game.city.goodwill].every(Number.isFinite)) return false;
  if (choice === 'honest') return true;
  const outcome = repair.talk;
  return game.city.minutes + outcome.minutes <= Math.min(1260, repair.deadline) &&
    game.city.energy + outcome.energy >= 0;
}

export function chooseSocialRepair(game: GameState, choice: RepairChoice): GameState {
  if (!canChooseSocialRepair(game, choice)) return game;
  const repair = getSocialRepair(game)!;
  const outcome = repair[choice];
  const id = repairId(repair.originDay, repair.kind, choice);
  return {
    ...game,
    city: {
      ...game.city,
      minutes: Math.min(1260, game.city.minutes + outcome.minutes),
      energy: Math.max(0, Math.min(100, game.city.energy + outcome.energy)),
      goodwill: game.city.goodwill + outcome.goodwill,
      journal: [`Ngày ${game.day}: ${outcome.reply}`, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...(game.relationshipRewardIds ?? []), id],
    storyLog: [{
      id, customerId: repair.characterId, customerName: repair.character,
      title: repair.title, text: outcome.reply, day: game.day, rewardFans: 0,
    }, ...(game.storyLog ?? [])].slice(0, 24),
    notice: outcome.reply,
  };
}
