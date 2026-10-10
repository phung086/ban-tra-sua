import { initialCity, newCityDay } from './city';
import {
  ACHIEVEMENTS,
  BASE_IDS,
  CUSTOMERS,
  DAY_EVENTS,
  DECORATIONS,
  DEFAULT_INVENTORY,
  DEFAULT_UPGRADES,
  DRINKS,
  FILL_OPTIONS,
  PERCENT_OPTIONS,
  RELATIONSHIP_STORIES,
  RESEARCH,
  RESTOCK_ITEMS,
  SHAKE_OPTIONS,
  STAFF,
  TOPPING_IDS,
  TOPPINGS,
  UPGRADES,
} from "./content";
import {
  CUSTOMER_QUEUE_SIZE,
  QUEUE_ARRIVAL_SPACING_MS,
  getCustomerMoodMeta,
  getCustomerServiceFeedback,
} from "./customerAi";
import type {
  AchievementMetric,
  BaseId,
  CustomerQueueEntry,
  DecorationId,
  DrinkDraft,
  Freshness,
  GameState,
  Inventory,
  InventoryKey,
  Order,
  Quest,
  QuestMetric,
  ReplyStyle,
  ResearchId,
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

export function hasResearch(state: GameState, researchId: ResearchId) {
  return state.researchedIds.includes(researchId);
}

function researchNumber(
  state: GameState,
  field:
    | "scoreBonus"
    | "comboThresholdReduction"
    | "decayReduction"
    | "replyFanBonus"
    | "replyViralBonus"
    | "perfectRevenueBonus"
    | "bondBonus",
) {
  return RESEARCH.filter((item) => state.researchedIds.includes(item.id)).reduce(
    (sum, item) => sum + (item[field] ?? 0),
    0,
  );
}

export function getDecorationBonuses(state: GameState) {
  return state.equippedDecorations
    .map((id) => DECORATIONS.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .reduce(
      (bonus, item) => ({
        revenueMultiplier: bonus.revenueMultiplier + item.revenueBonus,
        tipMultiplier: bonus.tipMultiplier + item.tipBonus,
        fanBonus: bonus.fanBonus + item.fanBonus,
        viralBonus: bonus.viralBonus + item.viralBonus,
        researchBonus: bonus.researchBonus + item.researchBonus,
      }),
      {
        revenueMultiplier: 1,
        tipMultiplier: 1,
        fanBonus: 0,
        viralBonus: 0,
        researchBonus: 0,
      },
    );
}

export function getRelationshipTier(bond: number) {
  if (bond >= 25) return { label: "Bạn của tiệm", emoji: "💞", level: 4 };
  if (bond >= 12) return { label: "Khách quen", emoji: "💗", level: 3 };
  if (bond >= 5) return { label: "Đã nhớ mặt", emoji: "🌷", level: 2 };
  return { label: "Khách mới", emoji: "✨", level: 1 };
}

function pickCustomerForOrder(state: GameState) {
  const bonded = CUSTOMERS.filter((customer) => (state.customerBond[customer.id] ?? 0) > 0);
  const regularChance = hasResearch(state, "regulars-club") ? 0.56 : 0.38;

  if (bonded.length && Math.random() < regularChance) {
    const weighted = bonded.flatMap((customer) => {
      const bond = state.customerBond[customer.id] ?? 0;
      const weight = Math.min(6, 1 + Math.floor(bond / 5));
      return Array.from({ length: weight }, () => customer);
    });
    return pick(weighted);
  }

  return pick(CUSTOMERS);
}

export function createInitialState(): GameState {
  const event = getEventForDay(1);
  return {
    saveVersion: 3,
    city: initialCity(),
    day: 1,
    phase: "prep",
    cash: 220000,
    reputation: 12,
    fans: 0,
    viral: 0,
    researchPoints: 0,
    xp: 0,
    level: 1,
    served: 0,
    targetOrders: targetOrdersFor(1, event.demandBonus),
    combo: 0,
    bestCombo: 0,
    perfectToday: 0,
    currentOrder: null,
    customerQueue: [],
    currentOrderQueuedAt: null,
    lastService: null,
    draft: emptyDraft(),
    inventory: { ...DEFAULT_INVENTORY },
    freshness: makeFreshness(),
    reviews: [],
    event,
    upgrades: { ...DEFAULT_UPGRADES },
    hiredStaff: [],
    activeStaff: null,
    ownedDecorations: [],
    equippedDecorations: [],
    researchedIds: [],
    customerBond: Object.fromEntries(CUSTOMERS.map((customer) => [customer.id, 0])),
    customerVisits: Object.fromEntries(CUSTOMERS.map((customer) => [customer.id, 0])),
    relationshipRewardIds: [],
    storyLog: [],
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
    dailyResearchGained: 0,
    lastScore: null,
    notice: "Sẵn sàng mở một ngày thật ngọt ngào!",
    summary: null,
  };
}

export function generateOrder(state: GameState, orderIndex: number): Order {
  const customer = pickCustomerForOrder(state);
  const basePool = state.unlockedBaseIds.length ? state.unlockedBaseIds : getUnlockedBases(state.level);
  const toppingPool = state.unlockedToppingIds.length ? state.unlockedToppingIds : getUnlockedToppings(state.level);
  const favoriteChance = hasResearch(state, "regulars-club") ? 0.42 : 0.28;
  const favoriteAvailable = customer.favorite && basePool.includes(customer.favorite);
  const base = favoriteAvailable && Math.random() < favoriteChance ? customer.favorite! : pick(basePool);
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

function buildCustomerQueue(
  state: GameState,
  firstOrderIndex: number,
  now: number,
): CustomerQueueEntry[] {
  const remaining = Math.max(0, state.targetOrders - firstOrderIndex);
  const count = Math.min(CUSTOMER_QUEUE_SIZE, remaining);
  return Array.from({ length: count }, (_, index) => ({
    order: generateOrder(state, firstOrderIndex + index),
    joinedAt: now + (index + 1) * QUEUE_ARRIVAL_SPACING_MS,
  }));
}

function refillCustomerQueue(
  state: GameState,
  queue: CustomerQueueEntry[],
  served: number,
  now: number,
): CustomerQueueEntry[] {
  const next = [...queue];
  while (
    next.length < CUSTOMER_QUEUE_SIZE &&
    served + 1 + next.length < state.targetOrders
  ) {
    const orderIndex = served + 1 + next.length;
    const lastArrival = next[next.length - 1]?.joinedAt ?? now;
    next.push({
      order: generateOrder(state, orderIndex),
      joinedAt: Math.max(now, lastArrival) + QUEUE_ARRIVAL_SPACING_MS,
    });
  }
  return next;
}

export function startDay(state: GameState, now = Date.now()): GameState {
  if (state.city.contract) return { ...state, notice: 'Hoàn tất hoặc hủy đơn giao trà trong khu phố trước khi mở tiệm.' };
  const prepared = syncProgression(state);
  const currentOrder = generateOrder(prepared, 0);
  return {
    ...prepared,
    phase: "open",
    served: 0,
    combo: 0,
    bestCombo: 0,
    perfectToday: 0,
    currentOrder,
    customerQueue: buildCustomerQueue(prepared, 1, now),
    currentOrderQueuedAt: now,
    lastService: null,
    draft: emptyDraft(prepared.unlockedBaseIds[0] ?? "classic-milk-tea"),
    dailyRevenue: 0,
    dailyCost: prepared.dailyWaste,
    dailyScoreTotal: 0,
    dailyFansGained: 0,
    dailyResearchGained: 0,
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

/**
 * One actionable, deterministic coaching note for the drink just served.
 * Prioritises the biggest lost scoring component; does not touch the save or RNG.
 */
export function getDrinkCoachingTip(order: Order, draft: DrinkDraft): string {
  const misses: { loss: number; tip: string }[] = [
    { loss: draft.base === order.base ? 0 : 25, tip: "Chọn đúng nền trà khách gọi." },
    { loss: draft.topping === order.topping ? 0 : 15, tip: "Kiểm tra topping theo phiếu đặt." },
    { loss: draft.size === order.size ? 0 : 10, tip: "Đổi đúng cỡ ly khách muốn." },
    { loss: Math.abs(draft.sugar - order.sugar) / 10, tip: draft.sugar > order.sugar ? "Giảm đường một chút." : "Thêm đường đúng mức khách thích." },
    { loss: Math.abs(draft.ice - order.ice) / 10, tip: draft.ice > order.ice ? "Bớt đá để đúng khẩu vị." : "Thêm đá đúng mức khách yêu cầu." },
    { loss: Math.abs(draft.fill - order.targetFill) * 0.15, tip: draft.fill > order.targetFill ? "Rót ít hơn để tránh tràn ly." : "Rót đầy hơn tới vạch yêu cầu." },
    { loss: Math.abs(draft.shake - order.targetShake) / 10, tip: draft.shake > order.targetShake ? "Lắc nhẹ tay hơn một chút." : "Lắc kỹ hơn để vị trà hòa đều." },
    { loss: draft.sealed ? 0 : 5, tip: "Đậy kín nắp trước khi giao." },
  ];
  const worst = misses.reduce((best, item) => item.loss > best.loss ? item : best);
  return worst.loss <= 0 ? "Công thức chuẩn rồi! Giữ nhịp phục vụ nhé." : worst.tip;
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

export function serveCurrentDrink(state: GameState, now = Date.now()): GameState {
  const order = state.currentOrder;
  if (!order || state.phase !== "open") return state;

  const requirements = inventoryRequirement(state.draft);
  const shortage = findShortage(state.inventory, requirements);
  if (shortage) {
    return { ...state, notice: "Kho đang thiếu nguyên liệu cho ly này. Ghé tab Kho nhập thêm nhé!" };
  }

  const customer = getCustomer(order.customerId);
  const service = getCustomerServiceFeedback(
    state,
    customer,
    state.currentOrderQueuedAt ?? now,
    now,
  );
  const baseIngredient = DRINKS[state.draft.base].ingredient;
  const freshness = state.freshness[baseIngredient] ?? 100;
  const freshnessPenalty = freshness < 30 ? 5 : freshness < 55 ? 2 : 0;
  const machineBonus = Math.min(
    6,
    state.upgrades.brewer + state.upgrades.shaker + (state.draft.sealed ? state.upgrades.sealer : 0),
  );
  const researchScoreBonus = researchNumber(state, "scoreBonus");
  const score = clamp(
    scoreDrink(order, state.draft) + machineBonus + researchScoreBonus - freshnessPenalty,
    0,
    100,
  );
  const stars = getStars(score);
  const comboThreshold = 88 - researchNumber(state, "comboThresholdReduction");
  const nextCombo = score >= comboThreshold ? state.combo + 1 : 0;
  const bestCombo = Math.max(state.bestCombo, nextCombo);
  const comboMultiplier = 1 + Math.min(6, nextCombo) * 0.025;
  const decor = getDecorationBonuses(state);
  const decorUpgradeMultiplier = 1 + state.upgrades.decor * 0.025;
  const staffMultiplier = activeStaffBonus(state, "momo") ? 1.05 : 1;
  const eventMultiplier = state.event.revenueMultiplier;
  const perfect = score >= 95;
  const signatureMultiplier = perfect ? 1 + researchNumber(state, "perfectRevenueBonus") : 1;
  const favoriteMatch = customer.favorite === order.base;
  const favoriteTip = favoriteMatch && score >= 85 ? 1500 : 0;
  const tipBase = score >= 95 ? 6500 : score >= 85 ? 3000 : 0;
  const tip = Math.round(
    (tipBase + favoriteTip) *
      state.event.tipMultiplier *
      decorUpgradeMultiplier *
      decor.tipMultiplier *
      service.tipMultiplier,
  );
  const earned = Math.round(
    order.price *
      (0.7 + (score / 100) * 0.3) *
      comboMultiplier *
      decorUpgradeMultiplier *
      decor.revenueMultiplier *
      staffMultiplier *
      eventMultiplier *
      signatureMultiplier,
  ) + tip;
  const ingredientCost = getDraftIngredientCost(state.draft);
  const served = state.served + 1;
  const perfectToday = state.perfectToday + (perfect ? 1 : 0);
  const review = makeReview(state, order, score);
  const dailyRevenue = state.dailyRevenue + earned;
  const dailyCost = state.dailyCost + ingredientCost;
  const scoreTotal = state.dailyScoreTotal + score;
  const serviceReputationDelta =
    service.mood === "delighted" && stars >= 4 ? 1 : service.mood === "upset" ? -1 : 0;
  const reputationDelta =
    (stars >= 5 ? 3 : stars >= 4 ? 2 : stars === 3 ? 0 : -1) + serviceReputationDelta;
  const fanBase = stars >= 5 ? 3 : stars === 4 ? 1 : 0;
  const staffFans = activeStaffBonus(state, "lili") && stars >= 4 ? 2 : 0;
  const comboFans = nextCombo >= 3 ? 1 : 0;
  const favoriteFans = favoriteMatch && stars >= 4 ? 1 : 0;
  const speedyServiceFans = service.mood === "delighted" && stars >= 4 ? 1 : 0;
  const fanGain =
    fanBase +
    staffFans +
    comboFans +
    favoriteFans +
    speedyServiceFans +
    (stars >= 4 ? decor.fanBonus : 0);
  const viralGain =
    (score >= 97 ? 4 + state.upgrades.decor : stars >= 4 ? 1 : 0) +
    (score >= 90 ? decor.viralBonus : 0);
  const xpGain = 10 + stars * 4 + (perfect ? 8 : 0);
  const researchGain = 1 + (perfect ? 1 + decor.researchBonus : 0);
  const inventory = consume(state.inventory, requirements);

  const rawBondGain =
    (stars >= 5 ? 3 : stars >= 4 ? 2 : stars === 3 ? 1 : 0) +
    (stars >= 3 ? researchNumber(state, "bondBonus") : 0);
  const patienceBondPenalty = service.mood === "upset" ? 2 : service.mood === "restless" ? 1 : 0;
  const bondGain = Math.max(0, rawBondGain - patienceBondPenalty);
  const previousBond = state.customerBond[customer.id] ?? 0;
  const nextBond = previousBond + bondGain;
  const customerBond = { ...state.customerBond, [customer.id]: nextBond };
  const customerVisits = {
    ...state.customerVisits,
    [customer.id]: (state.customerVisits[customer.id] ?? 0) + 1,
  };

  const story = RELATIONSHIP_STORIES.find((item) => {
    const rewardId = `${item.customerId}:${item.bond}`;
    return (
      item.customerId === customer.id &&
      previousBond < item.bond &&
      nextBond >= item.bond &&
      !state.relationshipRewardIds.includes(rewardId)
    );
  });
  const storyRewardId = story ? `${story.customerId}:${story.bond}` : null;
  const storyMoment = story
    ? {
        id: `story-${story.customerId}-${story.bond}-d${state.day}`,
        customerId: customer.id,
        customerName: customer.name,
        title: story.title,
        text: story.text,
        day: state.day,
        rewardFans: story.rewardFans,
      }
    : null;

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

  const storyNotice = story ? ` 💌 Story mở khóa: “${story.title}”!` : "";
  const mood = getCustomerMoodMeta(service.mood);
  const serviceNotice = ` ⏱️ ${service.waitedSeconds}s · ${mood.emoji} ${mood.label} · tip x${service.tipMultiplier.toFixed(2)}.`;
  const baseNext: GameState = {
    ...state,
    inventory,
    cash: state.cash + earned + (story?.rewardCash ?? 0),
    reputation: Math.max(0, state.reputation + reputationDelta),
    fans: state.fans + fanGain + (story?.rewardFans ?? 0),
    viral: state.viral + viralGain + (story?.rewardViral ?? 0),
    researchPoints: state.researchPoints + researchGain,
    xp: state.xp + xpGain,
    combo: nextCombo,
    bestCombo,
    perfectToday,
    served,
    dailyRevenue,
    dailyCost,
    dailyScoreTotal: scoreTotal,
    dailyFansGained: state.dailyFansGained + fanGain + (story?.rewardFans ?? 0),
    dailyResearchGained: state.dailyResearchGained + researchGain,
    lastScore: score,
    lastService: service,
    reviews: [review, ...state.reviews].slice(0, 60),
    quests,
    stats,
    customerBond,
    customerVisits,
    relationshipRewardIds: storyRewardId
      ? [...state.relationshipRewardIds, storyRewardId]
      : state.relationshipRewardIds,
    storyLog: storyMoment ? [storyMoment, ...state.storyLog].slice(0, 24) : state.storyLog,
    draft: emptyDraft(state.unlockedBaseIds[0] ?? "classic-milk-tea"),
    notice:
      (score >= 95
        ? `Perfect ${score}/100! Combo x${nextCombo} ✨`
        : score >= 80
          ? `Khách hài lòng: ${score}/100. Giữ nhịp nào!`
          : `Ly vừa rồi ${score}/100 — xem lại order trước ly tiếp theo nha.`) + ` 💡 ${getDrinkCoachingTip(order, state.draft)}` + serviceNotice + storyNotice,
  };

  if (served >= state.targetOrders) {
    const completedStats = { ...stats, days: stats.days + 1 };
    return applyAchievements({
      ...baseNext,
      phase: "summary",
      currentOrder: null,
      customerQueue: [],
      currentOrderQueuedAt: null,
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
        fansGained: state.dailyFansGained + fanGain + (story?.rewardFans ?? 0),
        researchGained: state.dailyResearchGained + researchGain,
      },
      notice: "Hết ca rồi! Mở sổ tổng kết xem hôm nay tiệm tiến bộ tới đâu nhé." + storyNotice,
    });
  }

  const [queuedNext, ...remainingQueue] = state.customerQueue;
  const nextEntry =
    queuedNext ?? { order: generateOrder(baseNext, served), joinedAt: now };
  const withNextOrder = {
    ...baseNext,
    currentOrder: nextEntry.order,
    currentOrderQueuedAt: Math.min(nextEntry.joinedAt, now),
    customerQueue: refillCustomerQueue(baseNext, remainingQueue, served, now),
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

export function buyDecoration(state: GameState, decorationId: DecorationId): GameState {
  const decoration = DECORATIONS.find((item) => item.id === decorationId);
  if (!decoration || state.ownedDecorations.includes(decorationId)) return state;
  if (decoration.unlockLevel > state.level) {
    return { ...state, notice: `${decoration.name} mở ở level ${decoration.unlockLevel}.` };
  }
  if (state.cash < decoration.cost) {
    return { ...state, notice: `Chưa đủ tiền mua ${decoration.name}.` };
  }

  const autoEquip = state.equippedDecorations.length < 3;
  return {
    ...state,
    cash: state.cash - decoration.cost,
    ownedDecorations: [...state.ownedDecorations, decorationId],
    equippedDecorations: autoEquip
      ? [...state.equippedDecorations, decorationId]
      : state.equippedDecorations,
    notice: `${decoration.emoji} Đã mua ${decoration.name}${autoEquip ? " và đặt ngay vào tiệm" : ""}.`,
  };
}

export function toggleDecoration(state: GameState, decorationId: DecorationId): GameState {
  if (!state.ownedDecorations.includes(decorationId)) return state;
  const equipped = state.equippedDecorations.includes(decorationId);
  if (equipped) {
    return {
      ...state,
      equippedDecorations: state.equippedDecorations.filter((id) => id !== decorationId),
      notice: "Đã cất món decor khỏi quầy.",
    };
  }
  if (state.equippedDecorations.length >= 3) {
    return { ...state, notice: "Tiệm chỉ trưng tối đa 3 món decor cùng lúc. Hãy cất bớt một món." };
  }
  const decoration = DECORATIONS.find((item) => item.id === decorationId);
  return {
    ...state,
    equippedDecorations: [...state.equippedDecorations, decorationId],
    notice: `${decoration?.emoji ?? "🌷"} Đã đặt ${decoration?.name ?? "decor"} vào tiệm.`,
  };
}

export function reorderDecorations(state: GameState, ids: DecorationId[]): GameState {
  const valid = ids.filter(
    (id, index) =>
      state.equippedDecorations.includes(id) &&
      ids.indexOf(id) === index,
  );

  if (
    valid.length !== state.equippedDecorations.length ||
    valid.some((id) => !state.ownedDecorations.includes(id))
  ) {
    return { ...state, notice: "Bố cục decor không hợp lệ nên chưa được áp dụng." };
  }

  return {
    ...state,
    equippedDecorations: valid,
    notice: "🌷 Đã cập nhật vị trí decor trong tiệm.",
  };
}

export function buyResearch(state: GameState, researchId: ResearchId): GameState {
  const research = RESEARCH.find((item) => item.id === researchId);
  if (!research || state.researchedIds.includes(researchId)) return state;
  const missingPrerequisite = research.prerequisiteIds.find((id) => !state.researchedIds.includes(id));
  if (missingPrerequisite) {
    const prerequisite = RESEARCH.find((item) => item.id === missingPrerequisite);
    return { ...state, notice: `Cần nghiên cứu “${prerequisite?.name ?? missingPrerequisite}” trước.` };
  }
  if (state.researchPoints < research.cost) {
    return { ...state, notice: `Cần ${research.cost} RP để nghiên cứu ${research.name}.` };
  }

  return {
    ...state,
    researchPoints: state.researchPoints - research.cost,
    researchedIds: [...state.researchedIds, researchId],
    notice: `${research.emoji} Hoàn tất nghiên cứu “${research.name}”!`,
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
  const socialFanBonus = researchNumber(state, "replyFanBonus");
  const socialViralBonus = researchNumber(state, "replyViralBonus");
  const updatedReviews = state.reviews.map((item) =>
    item.id === reviewId ? { ...item, replyStyle: style, replyText: replies[style] } : item,
  );
  const quests = advanceQuests(state.quests, "reply", 1);
  const next = {
    ...state,
    reviews: updatedReviews,
    reputation: Math.max(0, state.reputation + effect.reputation),
    fans: state.fans + effect.fans + socialFanBonus,
    viral: state.viral + effect.viral + socialViralBonus,
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
  const researchReduction = researchNumber(state, "decayReduction");
  const loss = Math.max(4, 22 - state.upgrades.fridge * 3 - researchReduction);

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
    city: newCityDay(state.city, day),
    fans: state.fans + (state.city.projects.includes('club') ? 3 : 0),
    served: 0,
    combo: 0,
    bestCombo: 0,
    perfectToday: 0,
    currentOrder: null,
    customerQueue: [],
    currentOrderQueuedAt: null,
    lastService: null,
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

/** Same ingredient valuation used for a served drink and a discarded remake. */
export function getDraftIngredientCost(draft: DrinkDraft): number {
  return (draft.size === "L" ? 9500 : 7600) + (draft.topping === "none" ? 0 : 2500);
}

/**
 * A sealed cup cannot be edited for free. The player may discard it and start
 * again, sacrificing stock and profit while the real customer clock continues.
 * This is a deliberate, observable service-vs-quality decision, not a new RNG.
 */
export function remakeSealedDrink(state: GameState): GameState {
  if (state.phase !== "open" || !state.currentOrder || !state.draft.sealed) return state;
  const requirements = inventoryRequirement(state.draft);
  if (findShortage(state.inventory, requirements)) {
    return { ...state, notice: "Kho thiếu nguyên liệu để ghi nhận ly đã pha. Nhập thêm trước khi làm lại." };
  }
  const cost = getDraftIngredientCost(state.draft);
  return {
    ...state,
    inventory: consume(state.inventory, requirements),
    dailyCost: state.dailyCost + cost,
    dailyWaste: state.dailyWaste + cost,
    stats: { ...state.stats, waste: state.stats.waste + cost },
    draft: emptyDraft(state.unlockedBaseIds[0] ?? "classic-milk-tea"),
    notice: `Đã bỏ ly cũ (hao ${formatMoney(cost)} nguyên liệu). Khách vẫn đang chờ — pha lại thật chuẩn nhé!`,
  };
}

export function updateDraft(state: GameState, patch: Partial<DrinkDraft>): GameState {
  if (patch.sealed === true && findShortage(state.inventory, inventoryRequirement({ ...state.draft, ...patch }))) {
    return { ...state, notice: "Thiếu nguyên liệu: chọn Cứu đơn hoặc nhập thêm tại Kho trước khi dập nắp." };
  }
  if (state.draft.sealed) {
    return { ...state, notice: "Ly đã dập nắp. Muốn đổi công thức, chọn “Bỏ ly và pha lại” để ghi nhận nguyên liệu hao." };
  }
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
