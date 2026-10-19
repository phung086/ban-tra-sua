import type { GameState } from '../types';
import { motherCallMemory } from './morning';

export type EveningMotherChoice = 'call' | 'text' | 'rest';
export const EVENING_MOTHER_OPTIONS = {
  call: { label: '📞 Gọi mẹ kể chuyện bán trà', minutes: 8, energy: -1, bond: 2 },
  text: { label: '💌 Nhắn mẹ đã về an toàn', minutes: 2, energy: 0, bond: 1 },
  rest: { label: '🌙 Cất điện thoại và nghỉ', minutes: 0, energy: 0, bond: 0 },
} as const;
const CHOICES: readonly EveningMotherChoice[] = ['call', 'text', 'rest'];
const eventId = (day: number, choice: EveningMotherChoice) =>
  `evening-mother-mai-${day}-${choice}`;

export function getEveningMotherChoice(
  game: Pick<GameState, 'day' | 'relationshipRewardIds'>,
  day = game.day,
): EveningMotherChoice | null {
  if (!Number.isSafeInteger(day) || day < 1 || !Array.isArray(game.relationshipRewardIds)) return null;
  return CHOICES.find(choice => game.relationshipRewardIds.includes(eventId(day, choice))) ?? null;
}

export function canChooseEveningMother(game: GameState, choice: EveningMotherChoice): boolean {
  if (!CHOICES.includes(choice) || !Number.isSafeInteger(game.day) || game.day < 1 ||
    game.phase !== 'summary' || game.summary?.day !== game.day ||
    getEveningMotherChoice(game)) return false;
  if (![game.cash, game.city.minutes, game.city.energy].every(Number.isFinite) ||
    game.cash < 0 || game.city.minutes < 0 || game.city.minutes > 1260 ||
    game.city.energy < 0 || game.city.energy > 100) return false;
  const option = EVENING_MOTHER_OPTIONS[choice];
  return game.city.minutes + option.minutes <= 1260 &&
    game.city.energy + option.energy >= 0;
}

export function chooseEveningMother(game: GameState, choice: EveningMotherChoice): GameState {
  if (!canChooseEveningMother(game, choice)) return game;
  const option = EVENING_MOTHER_OPTIONS[choice];
  const id = eventId(game.day, choice);
  const priorBond = motherCallMemory(game).bond;
  const reply = choice === 'call'
    ? game.morning.breakfast === 'skip'
      ? 'Mẹ Mai: “Bận bán trà cũng nhớ ăn uống nhé con. Hôm nào mệt thì nghỉ một chút.”'
      : priorBond >= 4
        ? 'Mẹ Mai: “Nghe con kể chuyện tiệm mỗi ngày, mẹ thấy gần con hơn nhiều.”'
        : 'Mẹ Mai: “Hôm nay bán có vui không? Nghe con kể là mẹ yên tâm rồi.”'
    : choice === 'text'
      ? 'Mẹ Mai nhắn: “Mẹ biết con đã về an toàn. Ngủ ngon, mai kể tiếp nhé!”'
      : 'Bạn đặt điện thoại xuống, dành chút yên tĩnh trước khi ngủ. Mai vẫn có thể gọi mẹ.';
  const memoryChoice = choice === 'call' ? 'listen' : choice === 'text' ? 'photo' : 'later';
  return {
    ...game,
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy + option.energy,
      stories: {
        ...game.city.stories,
        choices: [...game.city.stories.choices,
          `family-mother-mai:evening:${game.day}:${memoryChoice}`].slice(-100),
      },
      journal: [`Ngày ${game.day} · ${option.label}. ${reply}`, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: 'family-mother-mai', customerName: 'Mẹ Mai',
      title: 'Cuộc trò chuyện cuối ngày', text: reply, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: reply,
  };
}

export function getEveningMotherCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step === 'asleep' || game.day < 2) return null;
  const choice = getEveningMotherChoice(game, game.day - 1);
  if (choice === 'call')
    return 'Mẹ Mai: “Tối qua nghe con kể chuyện tiệm, sáng nay mẹ chúc con một ngày nhẹ nhàng nhé!”';
  if (choice === 'text')
    return 'Mẹ Mai: “Mẹ đã đọc tin nhắn tối qua rồi. Nhớ giữ sức và ăn sáng nhé!”';
  return null;
}
