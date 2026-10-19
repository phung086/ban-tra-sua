import type { GameState } from '../types';
export type EveningTeaChoice = 'brew' | 'talk' | 'rest';
export const EVENING_TEA = {
  brew: { label: '🍵 Pha trà ấm cho bác Bình', minutes: 8, energy: 2, goodwill: 2, fans: 1, callback: 'Bác Bình cảm ơn ly trà ấm tối qua.' },
  talk: { label: '💬 Hỏi thăm bác Bình', minutes: 3, energy: 1, goodwill: 1, fans: 0, callback: 'Bác Bình cảm ơn vì bạn đã hỏi thăm.' },
  rest: { label: '🌙 Về nghỉ', minutes: 0, energy: 0, goodwill: 0, fans: 0, callback: 'Bác Bình chúc bạn một ngày tốt lành.' },
} as const;
const choices: readonly EveningTeaChoice[] = ['brew','talk','rest'];
const key = (day: number, choice: EveningTeaChoice) => 'evening-warm-tea-' + day + '-' + choice;
export function getEveningTeaChoice(game: GameState, day = game.day): EveningTeaChoice | null {
  return choices.find(choice => game.relationshipRewardIds.includes(key(day,choice))) ?? null;
}
export function canChooseEveningTea(game: GameState, choice: EveningTeaChoice): boolean {
  if (!choices.includes(choice) || game.day < 2 || (game.day-2)%5 !== 0 ||
      game.phase !== 'summary' || game.summary?.day !== game.day || game.summary.orders < 1 ||
      getEveningTeaChoice(game)) return false;
  const city = game.city, action = EVENING_TEA[choice];
  if (![game.cash,city.minutes,city.energy,city.goodwill].every(Number.isFinite) ||
      city.minutes < 0 || city.minutes > 1260 || city.energy < 0 || city.energy > 100 || game.cash < 0) return false;
  if (choice === 'rest') return true;
  if (city.minutes + action.minutes > 1260 || city.energy < action.energy) return false;
  return choice === 'talk' || (['cupsM','classicMilkTea','sugar'] as const).every(k =>
    Number.isFinite(game.inventory[k]) && game.inventory[k] > 0 &&
    Number.isFinite(game.freshness[k]) && game.freshness[k] >= 20);
}
export function chooseEveningTea(game: GameState, choice: EveningTeaChoice): GameState {
  if (!canChooseEveningTea(game,choice)) return game;
  const action = EVENING_TEA[choice], id = key(game.day,choice);
  const inventory = choice === 'brew' ? {...game.inventory, cupsM: game.inventory.cupsM-1,
    classicMilkTea: game.inventory.classicMilkTea-1, sugar: game.inventory.sugar-1} : game.inventory;
  const message = choice === 'brew' ? 'Bạn mang trà ấm không đá cho bác Bình đang dọn phố.' :
    choice === 'talk' ? 'Bạn hỏi thăm bác Bình dưới hàng sấu.' : 'Bạn đóng cửa và về nghỉ.';
  return {...game, inventory, fans: game.fans + action.fans,
    city: {...game.city, minutes: game.city.minutes + action.minutes,
      energy: game.city.energy - action.energy, goodwill: game.city.goodwill + action.goodwill,
      journal: [message,...game.city.journal].slice(0,24)},
    relationshipRewardIds: [...game.relationshipRewardIds,id],
    storyLog: [{id,customerId:'binh',customerName:'Bác Bình',title:'Trà ấm cuối ca',
      text:message,day:game.day,rewardFans:action.fans},...game.storyLog].slice(0,24), notice:message};
}
export function getEveningTeaCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.step === 'asleep' ||
      game.morning.day !== game.day) return null;
  const choice = getEveningTeaChoice(game,game.day-1);
  return choice ? EVENING_TEA[choice].callback : null;
}
