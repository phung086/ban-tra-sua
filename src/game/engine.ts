import {
  ACHIEVEMENTS,
  BASE_IDS,
  CUSTOMERS,
  DAY_EVENTS,
  DEFAULT_INVENTORY,
  DEFAULT_UPGRADES,
  DRINKS,
  FILL_OPTIONS,
  PERCENT_OPTIONS,
  RESTOCK_ITEMS,
  SHAKE_OPTIONS,
  STAFF,
  TOPPING_IDS,
  TOPPINGS,
  UPGRADES,
} from "./content";
import type {
  AchievementMetric,
  BaseId,
  DrinkDraft,
  Freshness,
  GameState,
  Inventory,
  InventoryKey,
  Order,
  Quest,
  QuestMetric,
  ReplyStyle,
  Review,
  Size,
  StaffId,
  ToppingId,
  UpgradeId,
} from "./types";

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getLevelFromXp = (xp: number) => 1 + Math.floor(Math.max(0, xp) / 160);

const getUnlockedBases = (level: number) =>
  BASE_IDS.filter((id) => DRINKS[id].unlockLevel <= level);

const getUnlockedToppings = (level: number) =>
  TOPPING_IDS.filter((id) => TOPPINGS[id].unlockLevel <= level);

const makeFreshness = (): Freshness =>
  Object.fromEntries(Object.keys(DEFAULT_INVENTORY).map((key) => [key, 100])) as Freshness;

export const emptyDraft = (base: BaseId = "classic-milk-tea"): DrinkDraft => ({
  size: "M",
  base,
  sugar: 50,
  ice: 50,
  topping: "none",
  fill: 80,
  shake: 60,
  sealed: false,
});

export function getEventForDay(day: number) {
  if (day > 1 && day % 7 === 0) return DAY_EVENTS.find((event) => event.id === "festival") ?? DAY_EVENTS[0];
  if (day > 1 && day % 5 === 0) return DAY_EVENTS.find((event) => event.id === "weekend") ?? DAY_EVENTS[0];
  if (day > 1 && day % 4 === 0) return DAY_EVENTS.find((event) => event.id === "rain") ?? DAY_EVENTS[0];
  if (day > 1 && day % 3 === 0) return DAY_EVENTS.find((event) => event.id === "student") ?? DAY_EVENTS[0];
  return DAY_EVENTS[0];
}

function makeDailyQuests(day: number): Quest[] {
  const scale = Math.min(4, Math.floor((day - 1) / 3));
  return [
    {
      id: `d${day}-serve`,
      title: "Ca bán hàng năng suất",
      description: `Phục vụ ${5 + scale} ly trong ngày.`,
      metric: "serve",
      target: 5 + scale,
      progress: 0,
      rewardCash: 25000 + scale * 5000,
      rewardXp: 25,
      rewardFans: 2,
      claimed: false,
    },
    {
      id: `d${day}-perfect`,
      title: "Pha ly để đời",
      description: "Đạt ít nhất 95 điểm ở 2 ly.",
      metric: "perfect",
      target: 2,
      progress: 0,
      rewardCash: 30000,
      rewardXp: 35,
      rewardFans: 4,
      claimed: false,
    },
    {
      id: `d${day}-social`,
      title: "Chủ tiệm có tâm",
      description: "Rep 2 đánh giá của khách.",
      metric: "reply",
      target: 2,
      progress: 0,
      rewardCash: 18000,
      rewardXp: 20,
      rewardFans: 6,
      claimed: false,
    },
  ];
}

function targetOrdersFor(day: number, demandBonus: number) {
  return Math.max(4, 5 + Math.min(5, Math.floor((day - 1) / 2)) + demandBonus);
}

export function createInitialState(): GameState {
  const event = getEventForDay(1);
  return {
    saveVersion: 2,
    day: 1,
    phase: "prep",
    cash: 220000,
    reputation: 12,
    fans: 0,
    viral: 0,
    xp: 0,
    level: 1,
    served: 0,
    targetOrders: targetOrdersFor(1, event.demandBonus),
    combo: 0,
    bestCombo: 0,
    perfectToday: 0,
    currentOrder: null,
    draft: emptyDraft(),
    inventory: { ...DEFAULT_INVENTORY },
    freshness: makeFreshness(),
    reviews: [],
    event,
    upgrades: { ...DEFAULT_UPGRADES },
    hiredStaff: [],
    activeStaff: null,
    quests: makeDailyQuests(1),
    achievementIds: [],
    stats: {
      served: 0,
      perfect: 0,
      revenue: 0,
      replies: 0,
      days: 0,
      waste: 0,
      bestCombo: 0,
    },
    unlockedBaseIds: getUnlockedBases(1),
    unlockedToppingIds: getUnlockedToppings(1),
    dailyRevenue: 0,
    dailyCost: 0,
    dailyWaste: 0,
    dailyScoreTotal: 0,
    dailyFansGained: 0,
    lastScore: null,
    notice: "Sẵn sàng mở một ngày thật ngọt ngào!",
    summary: null,
  };
}

export function generateOrder(state: GameState, orderIndex: number): Order {
  const customer = pick(CUSTOMERS);
  const basePool = state.unlockedBaseIds.length ? state.unlockedBaseIds : getUnlockedBases(state.level);
  const toppingPool = state.unlockedToppingIds.length ? state.unlockedToppingIds : getUnlockedToppings(state.level);
  const favoriteAvailable = customer.favorite && basePool.includes(customer.favorite);
  const base = favoriteAvailable && Math.random() < 0.28 ? customer.favorite! : pick(basePool);
  const size = pick<Size>(["M", "L"]);
  const topping = pick(toppingPool);
  const sugar = pick(PERCENT_OPTIONS);
  const ice = pick(PERCENT_OPTIONS);
  const targetFill = pick(FILL_OPTIONS);
  const targetShake = pick(SHAKE_OPTIONS);
  const drink = DRINKS[base];

  return {
    id: `d${state.day}-o${orderIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    customerId: customer.id,
    size,
    base,
    sugar,
    ice,
    topping,
    targetFill,
    targetShake,
    price: (size === "M" ? drink.priceM : drink.priceL) + TOPPINGS[topping].price,
  };
}

export function startDay(state: GameState): GameState {
  const prepared = syncProgression(state);
  return {
    ...prepared,
    phase: "open",
    served: 0,
    combo: 0,
    bestCombo: 0,
    perfectToday: 0,
    currentOrder: generateOrder(prepared, 0),
    draft: emptyDraft(prepared.unlockedBaseIds[0] ?? "classic-milk-tea"),
    dailyRevenue: 0,
    dailyCost: prepared.dailyWaste,
    dailyScoreTotal: 0,
    dailyFansGained: 0,
    lastScore: null,
    notice: `${prepared.event.emoji} ${prepared.event.name}: khách đầu tiên tới rồi!`,
    summary: null,
  };
}

function closeness(actual: number, expected: number, maxPoints: number): number {
  const distance = Math.abs(actual - expected);
  return Math.max(0, maxPoints * (1 - distance / 100));
}

export function scoreDrink(order: Order, draft: DrinkDraft): number {
  let score = 0;
  if (draft.base === order.base) score += 25;
  if (draft.size === order.size) score += 10;
  if (draft.topping === order.topping) score += 15;
  score += closeness(draft.sugar, order.sugar, 10);
  score += closeness(draft.ice, order.ice, 10);
  score += closeness(draft.fill, order.targetFill, 15);
  score += closeness(draft.shake, order.targetShake, 10);
  if (draft.sealed) score += 5;
  return Math.round(clamp(score, 0, 100));
}

function getStars(score: number): number {
  if (score >= 93) return 5;
  if (score >= 80) return 4;
  if (score >= 65) return 3;
  if (score >= 48) return 2;
  return 1;
}

function inventoryRequirement(draft: DrinkDraft): Partial<Record<InventoryKey, number>> {
  const requirements: Partial<Record<InventoryKey, number>> = {
    [draft.size === "M" ? "cupsM" : "cupsL"]: 1,
    [DRINKS[draft.base].ingredient]: 1,
    sugar: draft.sugar > 0 ? 1 : 0,
    ice: draft.ice > 0 ? 1 : 0,
  };
  const toppingIngredient = TOPPINGS[draft.topping].ingredient;
  if (toppingIngredient) requirements[toppingIngredient] = 1;
  return requirements;
}

function findShortage(inventory: Inventory, requirements: Partial<Record<InventoryKey, number>>): InventoryKey | null {
  for (const [key, value] of Object.entries(requirements)) {
    if ((inventory[key as InventoryKey] ?? 0) < (value ?? 0)) return key as InventoryKey;
  }
  return null;
}

function consume(inventory: Inventory, requirements: Partial<Record<InventoryKey, number>>): Inventory {
  const next = { ...inventory };
  for (const [key, value] of Object.entries(requirements)) {
    next[key as InventoryKey] = Math.max(0, next[key as InventoryKey] - (value ?? 0));
  }
  return next;
}

function makeReview(state: GameState, order: Order, score: number): Review {
  const customer = CUSTOMERS.find((item) => item.id === order.customerId) ?? CUSTOMERS[0];
  const stars = getStars(score);
  const pool = stars >= 4 ? customer.good : stars === 3 ? customer.okay : customer.bad;
  return {
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    customerId: customer.id,
    customerName: customer.name,
    stars,
    score,
    text: pick(pool),
    day: state.day,
  };
}

function advanceQuests(quests: Quest[], metric: QuestMetric, amount: number): Quest[] {
  return quests.map((quest) =>
    quest.metric === metric && !quest.claimed
      ? { ...quest, progress: Math.min(quest.target, quest.progress + amount) }
      : quest,
  );
}

function getAchievementValue(state: GameState, metric: AchievementMetric) {
  if (metric === "fans") return state.fans;
  return state.stats[metric];
}

function syncProgression(state: GameState): GameState {
  const level = getLevelFromXp(state.xp);
  return {
    ...state,
    level,
    unlockedBaseIds: getUnlockedBases(level),
    unlockedToppingIds: getUnlockedToppings(level),
  };
}

function applyAchievements(state: GameState): GameState {
  let next = syncProgression(state);
  const newlyEarned = ACHIEVEMENTS.filter(
    (achievement) =>
      !next.achievementIds.includes(achievement.id) &&
      getAchievementValue(next, achievement.metric) >= achievement.threshold,
  );
  if (!newlyEarned.length) return next;

  next = {
    ...next,
    achievementIds: [...next.achievementIds, ...newlyEarned.map((item) => item.id)],
    cash: next.cash + newlyEarned.reduce((sum, item) => sum + item.rewardCash, 0),
    fans: next.fans + newlyEarned.reduce((sum, item) => sum + item.rewardFans, 0),
    notice: `${next.notice} 🏆 Mở thành tựu: ${newlyEarned.map((item) => item.name).join(", ")}!`,
  };
  return syncProgression(next);
}

function activeStaffBonus(state: GameState, staffId: StaffId) {
  return state.activeStaff === staffId && state.hiredStaff.includes(staffId);
}

export function serveCurrentDrink(state: GameState): GameState {
  const order = state.currentOrder;
  if (!order || state.phase !== "open") return state;

  const requirements = inventoryRequirement(state.draft);
  const shortage = findShortage(state.inventory, requirements);
  if (shortage) {
    return { ...state, notice: "Kho đang thiếu nguyên liệu cho ly này. Ghé tab Kho nhập thêm nhé!" };
  }

  const baseIngredient = DRINKS[state.draft.base].ingredient;
  const freshness = state.freshness[baseIngredient] ?? 100;
  const freshnessPenalty = freshness < 30 ? 5 : freshness < 55 ? 2 : 0;
  const machineBonus = Math.min(
    6,
    state.upgrades.brewer + state.upgrades.shaker + (state.draft.sealed ? state.upgrades.sealer : 0),
  );
  const score = clamp(scoreDrink(order, state.draft) + machineBonus - freshnessPenalty, 0, 100);
  const stars = getStars(score);
  const nextCombo = score >= 88 ? state.combo + 1 : 0;
  const bestCombo = Math.max(state.bestCombo, nextCombo);
  const comboMultiplier = 1 + Math.min(6, nextCombo) * 0.025;
  const decorMultiplier = 1 + state.upgrades.decor * 0.025;
  const staffMultiplier = activeStaffBonus(state, "momo") ? 1.05 : 1;
  const eventMultiplier = state.event.revenueMultiplier;
  const tipBase = score >= 95 ? 6500 : score >= 85 ? 3000 : 0;
  const tip = Math.round(tipBase * state.event.tipMultiplier * decorMultiplier);
  const earned = Math.round(
    order.price *
      (0.7 + (score / 100) * 0.3) *
      comboMultiplier *
      decorMultiplier *
      staffMultiplier *
      eventMultiplier,
  ) + tip;
  const ingredientCost = (state.draft.size === "L" ? 9500 : 7600) + (state.draft.topping === "none" ? 0 : 2500);
  const served = state.served + 1;
  const perfect = score >= 95;
  const perfectToday = state.perfectToday + (perfect ? 1 : 0);
  const review = makeReview(state, order, score);
  const dailyRevenue = state.dailyRevenue + earned;
  const dailyCost = state.dailyCost + ingredientCost;
  const scoreTotal = state.dailyScoreTotal + score;
  const reputationDelta = stars >= 5 ? 3 : stars >= 4 ? 2 : stars === 3 ? 0 : -1;
  const fanBase = stars >= 5 ? 3 : stars === 4 ? 1 : 0;
  const staffFans = activeStaffBonus(state, "lili") && stars >= 4 ? 2 : 0;
  const comboFans = nextCombo >= 3 ? 1 : 0;
  const fanGain = fanBase + staffFans + comboFans;
  const viralGain = score >= 97 ? 4 + state.upgrades.decor : stars >= 4 ? 1 : 0;
  const xpGain = 10 + stars * 4 + (perfect ? 8 : 0);
  const inventory = consume(state.inventory, requirements);

  let quests = advanceQuests(state.quests, "serve", 1);
  quests = advanceQuests(quests, "revenue", earned);
  if (perfect) quests = advanceQuests(quests, "perfect", 1);
  if (nextCombo > state.combo && nextCombo >= 3) quests = advanceQuests(quests, "combo", 1);

  const stats = {
    ...state.stats,
    served: state.stats.served + 1,
    perfect: state.stats.perfect + (perfect ? 1 : 0),
    revenue: state.stats.revenue + earned,
    bestCombo: Math.max(state.stats.bestCombo, bestCombo),
  };

  const baseNext: GameState = {
    ...state,
    inventory,
    cash: state.cash + earned,
    reputation: Math.max(0, state.reputation + reputationDelta),
    fans: state.fans + fanGain,
    viral: state.viral + viralGain,
    xp: state.xp + xpGain,
    combo: nextCombo,
    bestCombo,
    perfectToday,
    served,
    dailyRevenue,
    dailyCost,
    dailyScoreTotal: scoreTotal,
    dailyFansGained: state.dailyFansGained + fanGain,
    lastScore: score,
    reviews: [review, ...state.reviews].slice(0, 60),
    quests,
    stats,
    draft: emptyDraft(state.unlockedBaseIds[0] ?? "classic-milk-tea"),
    notice:
      score >= 95
        ? `Perfect ${score}/100! Combo x${nextCombo} ✨`
        : score >= 80
          ? `Khách hài lòng: ${score}/100. Giữ nhịp nào!`
          : `Ly vừa rồi ${score}/100 — xem lại order trước ly tiếp theo nha.`,
  };

  if (served >= state.targetOrders) {
    const completedStats = { ...stats, days: stats.days + 1 };
    return applyAchievements({
      ...baseNext,
      phase: "summary",
      currentOrder: null,
      stats: completedStats,
      summary: {
        day: state.day,
        eventName: state.event.name,
        orders: served,
        perfectOrders: perfectToday,
        bestCombo,
        revenue: dailyRevenue,
        ingredientCost: dailyCost,
        wasteCost: state.dailyWaste,
        profit: dailyRevenue - dailyCost,
        averageScore: Math.round(scoreTotal / served),
        fansGained: state.dailyFansGained + fanGain,
      },
      notice: "Hết ca rồi! Mở sổ tổng kết xem hôm nay tiệm tiến bộ tới đâu nhé.",
    });
  }

  const withNextOrder = {
    ...baseNext,
    currentOrder: generateOrder(baseNext, served),
  };
  return applyAchievements(withNextOrder);
}

export function getRestockPrice(state: GameState, key: InventoryKey) {
  const item = RESTOCK_ITEMS.find((entry) => entry.key === key);
  if (!item) return 0;
  return Math.round(item.price * (activeStaffBonus(state, "kiki") ? 0.9 : 1));
}

export function restock(state: GameState, key: InventoryKey): GameState {
  const item = RESTOCK_ITEMS.find((entry) => entry.key === key);
  if (!item) return state;
  if (item.unlockLevel > state.level) {
    return { ...state, notice: `Nguyên liệu này mở ở level ${item.unlockLevel}.` };
  }
  const price = getRestockPrice(state, key);
  if (state.cash < price) {
    return { ...state, notice: "Chưa đủ tiền nhập lô này rồi 🥺" };
  }

  return {
    ...state,
    cash: state.cash - price,
    inventory: { ...state.inventory, [key]: state.inventory[key] + item.amount },
    freshness: item.perishable ? { ...state.freshness, [key]: 100 } : state.freshness,
    notice: `Đã nhập +${item.amount} ${item.label}${activeStaffBonus(state, "kiki") ? " với giá nhân viên kho ưu đãi" : ""}.`,
  };
}

export function buyUpgrade(state: GameState, upgradeId: UpgradeId): GameState {
  const definition = UPGRADES.find((item) => item.id === upgradeId);
  if (!definition) return state;
  const current = state.upgrades[upgradeId];
  if (current >= definition.maxLevel) return { ...state, notice: `${definition.name} đã đạt cấp tối đa.` };
  const cost = Math.round(definition.baseCost * (1 + current * 0.65));
  if (state.cash < cost) return { ...state, notice: `Cần thêm vốn để nâng ${definition.name}.` };
  return {
    ...state,
    cash: state.cash - cost,
    upgrades: { ...state.upgrades, [upgradeId]: current + 1 },
    reputation: state.reputation + (upgradeId === "decor" ? 2 : 0),
    notice: `${definition.emoji} ${definition.name} đã lên cấp ${current + 1}!`,
  };
}

export function getUpgradeCost(state: GameState, upgradeId: UpgradeId) {
  const definition = UPGRADES.find((item) => item.id === upgradeId);
  if (!definition) return 0;
  return Math.round(definition.baseCost * (1 + state.upgrades[upgradeId] * 0.65));
}

export function hireStaff(state: GameState, staffId: StaffId): GameState {
  const member = STAFF.find((item) => item.id === staffId);
  if (!member || state.hiredStaff.includes(staffId)) return state;
  if (state.cash < member.hireCost) return { ...state, notice: `Chưa đủ tiền tuyển ${member.name}.` };
  return {
    ...state,
    cash: state.cash - member.hireCost,
    hiredStaff: [...state.hiredStaff, staffId],
    activeStaff: state.activeStaff ?? staffId,
    notice: `${member.emoji} ${member.name} đã gia nhập tiệm!`,
  };
}

export function setActiveStaff(state: GameState, staffId: StaffId | null): GameState {
  if (staffId && !state.hiredStaff.includes(staffId)) return state;
  const member = staffId ? STAFF.find((item) => item.id === staffId) : null;
  return {
    ...state,
    activeStaff: staffId,
    notice: member ? `${member.name} đang trực ca này.` : "Ca này chủ tiệm tự vận hành.",
  };
}

export function replyToReview(state: GameState, reviewId: string, style: ReplyStyle): GameState {
  const review = state.reviews.find((item) => item.id === reviewId);
  if (!review || review.replyStyle) return state;

  const replies: Record<ReplyStyle, string> = {
    sweet: "Cảm ơn bạn đã ghé tiệm 💗 Chủ tiệm ghi chú lại để ly sau còn ngon hơn nha!",
    witty: "Đã tiếp thu tín hiệu từ hội đồng trà sữa 😌 Hẹn bạn vòng tái đấu!",
    spicy: "Review đã được chủ tiệm đọc trong trạng thái rất tỉnh 😭 Lần sau ghé để mình phục thù nha!",
  };
  const effects: Record<ReplyStyle, { reputation: number; fans: number; viral: number }> = {
    sweet: { reputation: 2, fans: 1, viral: 0 },
    witty: { reputation: 1, fans: 4, viral: 3 },
    spicy: { reputation: -1, fans: 7, viral: 8 },
  };
  const effect = effects[style];
  const updatedReviews = state.reviews.map((item) =>
    item.id === reviewId ? { ...item, replyStyle: style, replyText: replies[style] } : item,
  );
  let quests = advanceQuests(state.quests, "reply", 1);
  const next = {
    ...state,
    reviews: updatedReviews,
    reputation: Math.max(0, state.reputation + effect.reputation),
    fans: state.fans + effect.fans,
    viral: state.viral + effect.viral,
    quests,
    stats: { ...state.stats, replies: state.stats.replies + 1 },
    notice:
      style === "spicy"
        ? "🔥 Rep hơi cháy: viral tăng mạnh nhưng uy tín giảm nhẹ."
        : style === "witty"
          ? "😌 Rep duyên: fan và viral cùng tăng."
          : "💗 Rep ngọt: khách cảm nhận được sự tử tế của tiệm.",
  };
  return applyAchievements(next);
}

export function claimQuest(state: GameState, questId: string): GameState {
  const quest = state.quests.find((item) => item.id === questId);
  if (!quest || quest.claimed || quest.progress < quest.target) return state;
  const quests = state.quests.map((item) => item.id === questId ? { ...item, claimed: true } : item);
  return applyAchievements({
    ...state,
    quests,
    cash: state.cash + quest.rewardCash,
    xp: state.xp + quest.rewardXp,
    fans: state.fans + quest.rewardFans,
    notice: `🎁 Nhận thưởng “${quest.title}”: +${formatMoney(quest.rewardCash)}, +${quest.rewardXp} XP.`,
  });
}

function decayInventory(state: GameState) {
  const inventory = { ...state.inventory };
  const freshness = { ...state.freshness };
  let wasteValue = 0;
  const loss = Math.max(7, 22 - state.upgrades.fridge * 3);

  for (const item of RESTOCK_ITEMS) {
    if (!item.perishable || inventory[item.key] <= 0) continue;
    const nextFreshness = (freshness[item.key] ?? 100) - loss;
    if (nextFreshness <= 0) {
      wasteValue += Math.round((item.price / item.amount) * inventory[item.key]);
      inventory[item.key] = 0;
      freshness[item.key] = 100;
    } else {
      freshness[item.key] = nextFreshness;
    }
  }

  return { inventory, freshness, wasteValue };
}

export function nextDay(state: GameState): GameState {
  const day = state.day + 1;
  const event = getEventForDay(day);
  const decayed = decayInventory(state);
  const base = syncProgression({
    ...state,
    day,
    phase: "prep",
    served: 0,
    combo: 0,
    bestCombo: 0,
    perfectToday: 0,
    currentOrder: null,
    draft: emptyDraft(state.unlockedBaseIds[0] ?? "classic-milk-tea"),
    inventory: decayed.inventory,
    freshness: decayed.freshness,
    event,
    targetOrders: targetOrdersFor(day, event.demandBonus),
    quests: makeDailyQuests(day),
    dailyRevenue: 0,
    dailyCost: decayed.wasteValue,
    dailyWaste: decayed.wasteValue,
    dailyScoreTotal: 0,
    dailyFansGained: 0,
    lastScore: null,
    summary: null,
    stats: { ...state.stats, waste: state.stats.waste + decayed.wasteValue },
    notice: decayed.wasteValue > 0
      ? `Ngày mới! Có ${formatMoney(decayed.wasteValue)} nguyên liệu quá hạn phải bỏ. Tủ mát tốt sẽ giảm hao hụt.`
      : `${event.emoji} ${event.name}: ${event.description}`,
  });
  return applyAchievements(base);
}

export function updateDraft(state: GameState, patch: Partial<DrinkDraft>): GameState {
  return { ...state, draft: { ...state.draft, ...patch } };
}

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);

export function getCustomer(customerId: string) {
  return CUSTOMERS.find((customer) => customer.id === customerId) ?? CUSTOMERS[0];
}

export function getDrink(base: BaseId) {
  return DRINKS[base];
}

export function getTopping(topping: ToppingId) {
  return TOPPINGS[topping];
}
