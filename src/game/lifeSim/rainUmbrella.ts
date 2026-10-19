import type { GameState } from '../types';
import type { Position } from '../service';
import { cityWeather, walkCity } from '../city';

export type UmbrellaChoice = 'borrow' | 'message';
const choices: readonly UmbrellaChoice[] = ['borrow', 'message'];
const key = (day: number, choice: UmbrellaChoice) => `rain-umbrella:${day}:${choice}`;

export const UMBRELLA_OPTIONS = {
  borrow: {
    label: '☂️ Nhờ bác Minh cho mượn ô',
    minutes: 5, energy: 1, goodwill: 1,
    text: 'Bạn nhắn bác Minh xin mượn ô. Lan ghé mang ô qua tiệm; ngày mai đi bộ dưới mưa đỡ mất sức.',
    reply: 'Bác Minh: “Ô để ở cửa tiệm nhé. Hôm nay đi phố dưới mưa sẽ đỡ mệt hơn một nửa.”',
  },
  message: {
    label: '💬 Cảm ơn, tự chuẩn bị',
    minutes: 0, energy: 0, goodwill: 0,
    text: 'Bạn cảm ơn bác Minh và chọn tự lo. Không tốn thời gian hay sức, nhưng đi dưới mưa vẫn mệt như thường.',
    reply: 'Bác Minh: “Trời mưa đấy, đi chậm và nhớ giữ ấm nhé.”',
  },
} as const;

export function getUmbrellaChoice(game: GameState, day = game.day): UmbrellaChoice | null {
  if (!Number.isSafeInteger(day) || day < 1) return null;
  return choices.find(choice => game.relationshipRewardIds.includes(key(day, choice)) ||
    game.storyLog.some(item => item.id === key(day, choice))) ?? null;
}

export function canChooseUmbrella(game: GameState, choice: UmbrellaChoice): boolean {
  if (!choices.includes(choice) || game.phase !== 'summary' || game.summary?.day !== game.day ||
    !cityWeather(game.day + 1).rain || getUmbrellaChoice(game)) return false;
  const { minutes, energy, goodwill } = game.city;
  if (![minutes, energy, goodwill, game.cash].every(Number.isFinite) ||
    minutes < 0 || minutes > 1260 || energy < 0 || energy > 100 || game.cash < 0) return false;
  const option = UMBRELLA_OPTIONS[choice];
  return minutes + option.minutes <= 1260 && energy >= option.energy;
}

export function chooseUmbrella(game: GameState, choice: UmbrellaChoice): GameState {
  if (!canChooseUmbrella(game, choice)) return game;
  const option = UMBRELLA_OPTIONS[choice], id = key(game.day, choice);
  return {
    ...game,
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy - option.energy,
      goodwill: game.city.goodwill + option.goodwill,
      journal: [`Ngày ${game.day} · ${option.text}`, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: 'minh', customerName: 'Bác Minh',
      title: 'Mượn ô trước ngày mưa', text: option.text,
      day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    notice: option.text,
  };
}

export function hasUmbrellaToday(game: GameState): boolean {
  return game.day > 1 && cityWeather(game.day).rain &&
    getUmbrellaChoice(game, game.day - 1) === 'borrow';
}

export function getUmbrellaCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
    game.morning.step === 'asleep' || game.day <= 1 || !cityWeather(game.day).rain)
    return null;
  const choice = getUmbrellaChoice(game, game.day - 1);
  return choice ? UMBRELLA_OPTIONS[choice].reply : null;
}

/** Keep walk time, visited places and diary untouched; reduce only rainy stamina.
 * Umbrella lasts for the single following day and survives save v3 reload. */
export function walkCityWithUmbrella(game: GameState, distance: number, position: Position): GameState {
  const walked = walkCity(game, distance, position);
  if (walked === game || !hasUmbrellaToday(game)) return walked;
  return {
    ...walked,
    city: { ...walked.city, energy: Math.max(0, game.city.energy - distance * 0.06) },
  };
}
