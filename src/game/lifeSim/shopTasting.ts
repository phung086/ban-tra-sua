import type { GameState } from '../types';

export type ShopTastingChoice = 'serve' | 'listen' | 'later';

const choices: readonly ShopTastingChoice[] = ['serve', 'listen', 'later'];
const idFor = (day: number, choice: ShopTastingChoice) => `shop-tasting-day-${day}-${choice}`;
const hasId = (game: GameState, id: string) =>
  game.relationshipRewardIds.includes(id) || game.storyLog.some(moment => moment.id === id);

export const SHOP_TASTING = {
  serve: {
    label: '🧋 Pha trà thử, mời thêm bánh quy',
    detail: '3.000 ₫ · 10 phút · -4 sức · 1 ly M, trà, đường, đá',
    cost: 3000, minutes: 10, energy: 4, goodwill: 2, fans: 1,
    reply: 'Bạn pha một ly trà sữa và mời cô Thu bánh quy. Cô nếm kỹ rồi gật đầu: “Ít ngọt hơn chút là vừa.”',
    callback: 'Cô Thu ghé ngang: “Hôm qua trà thơm đấy. Lần tới cho cô ít đường nhé!”',
  },
  listen: {
    label: '💬 Nhờ cô Thu góp ý bảng menu',
    detail: 'Miễn phí · 5 phút · -1 sức',
    cost: 0, minutes: 5, energy: 1, goodwill: 1, fans: 0,
    reply: 'Bạn hỏi cô Thu thích uống gì. Cô bảo: “Ghi rõ độ ngọt trên bảng thì khách dễ chọn hơn.”',
    callback: 'Cô Thu nhìn bảng menu: “Cháu chịu nghe góp ý, thế là quý rồi.”',
  },
  later: {
    label: '🌿 Hẹn cô khi tiệm đỡ bận',
    detail: 'Miễn phí · 0 phút · không mất sức',
    cost: 0, minutes: 0, energy: 0, goodwill: 0, fans: 0,
    reply: 'Bạn cảm ơn và nói rõ hôm nay chưa tiện. Cô Thu bảo: “Không sao, lo mở tiệm trước đi.”',
    callback: 'Cô Thu đi qua cửa tiệm: “Hôm nào rảnh cô lại ghé thử nhé.”',
  },
} as const;

const isEventDay = (day: number) => Number.isSafeInteger(day) && day >= 1 && (day - 1) % 7 === 0;

export function getShopTastingChoice(game: GameState): ShopTastingChoice | null {
  if (!isEventDay(game.day)) return null;
  return choices.find(choice => hasId(game, idFor(game.day, choice))) ?? null;
}

export function getShopTastingPrompt(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || !isEventDay(game.day)) return null;
  const remembered = game.relationshipRewardIds.some(id =>
    /^shop-tasting-day-\d+-serve$/.test(id) && id !== idFor(game.day, 'serve'));
  return remembered
    ? 'Cô Thu nhớ ly trà lần trước và ghé hỏi hôm nay có món gì mới. Bạn muốn đón cô thế nào?'
    : 'Cô Thu đi ngang tiệm, tò mò nhìn bảng menu. Bạn có muốn mời cô thử trà trước khi mở cửa?';
}

export function getShopTastingCallback(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished' || !isEventDay(game.day - 1)) return null;
  const choice = choices.find(option => hasId(game, idFor(game.day - 1, option)));
  return choice ? SHOP_TASTING[choice].callback : null;
}

export function canChooseShopTasting(game: GameState, choice: ShopTastingChoice): boolean {
  if (!getShopTastingPrompt(game) || !choices.includes(choice) || getShopTastingChoice(game)) return false;
  const { city } = game;
  if (![game.cash, city.minutes, city.energy, city.goodwill].every(Number.isFinite)) return false;
  if (choice === 'later') return true; // No money, stock, time or energy softlock.
  const action = SHOP_TASTING[choice];
  if (game.cash < action.cost || city.energy < action.energy ||
      city.minutes + action.minutes > 1260) return false;
  if (choice !== 'serve') return true;
  return (['cupsM', 'classicMilkTea', 'sugar', 'ice'] as const).every(key =>
    Number.isFinite(game.inventory[key]) && game.inventory[key] >= 1 &&
    Number.isFinite(game.freshness[key]) && game.freshness[key] >= 20);
}

/** Pure v3-compatible action: one choice per event day, no hidden repeat rewards. */
export function chooseShopTasting(game: GameState, choice: ShopTastingChoice): GameState {
  if (!canChooseShopTasting(game, choice)) return game;
  const action = SHOP_TASTING[choice];
  const id = idFor(game.day, choice);
  const inventory = choice === 'serve'
    ? { ...game.inventory,
        cupsM: game.inventory.cupsM - 1,
        classicMilkTea: game.inventory.classicMilkTea - 1,
        sugar: game.inventory.sugar - 1,
        ice: game.inventory.ice - 1 }
    : game.inventory;
  return {
    ...game,
    cash: game.cash - action.cost,
    fans: game.fans + action.fans,
    inventory,
    city: {
      ...game.city,
      minutes: game.city.minutes + action.minutes,
      energy: game.city.energy - action.energy,
      goodwill: game.city.goodwill + action.goodwill,
      journal: [`Ngày ${game.day}: ${action.reply}`, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: 'thu', customerName: 'Cô Thu', title: 'Góp ý ly trà đầu ngày',
      text: action.reply, day: game.day, rewardFans: action.fans,
    }, ...game.storyLog].slice(0, 24),
    notice: action.reply,
  };
}
