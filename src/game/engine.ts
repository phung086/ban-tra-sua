import {
  BASE_IDS,
  CUSTOMERS,
  DEFAULT_INVENTORY,
  DRINKS,
  PERCENT_OPTIONS,
  RESTOCK_ITEMS,
  TOPPING_IDS,
  TOPPINGS,
} from "./content";
import type {
  BaseId,
  DrinkDraft,
  GameState,
  Inventory,
  InventoryKey,
  Order,
  Review,
  Size,
  ToppingId,
} from "./types";

export const emptyDraft = (): DrinkDraft => ({
  size: "M",
  base: "classic-milk-tea",
  sugar: 50,
  ice: 50,
  topping: "none",
  sealed: false,
});

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export function createInitialState(): GameState {
  return {
    saveVersion: 1,
    day: 1,
    phase: "prep",
    cash: 180000,
    reputation: 12,
    xp: 0,
    served: 0,
    targetOrders: 5,
    currentOrder: null,
    draft: emptyDraft(),
    inventory: { ...DEFAULT_INVENTORY },
    reviews: [],
    dailyRevenue: 0,
    dailyCost: 0,
    dailyScoreTotal: 0,
    lastScore: null,
    notice: "Sẵn sàng mở một ngày thật ngọt ngào!",
    summary: null,
  };
}

export function generateOrder(day: number, orderIndex: number): Order {
  const customer = pick(CUSTOMERS);
  const base = pick(BASE_IDS);
  const size = pick<Size>(["M", "L"]);
  const topping = pick(TOPPING_IDS);
  const sugar = pick(PERCENT_OPTIONS);
  const ice = pick(PERCENT_OPTIONS);
  const drink = DRINKS[base];
  const toppingPrice = topping === "none" ? 0 : 5000;

  return {
    id: `d${day}-o${orderIndex}-${Date.now()}`,
    customerId: customer.id,
    size,
    base,
    sugar,
    ice,
    topping,
    price: (size === "M" ? drink.priceM : drink.priceL) + toppingPrice,
  };
}

export function startDay(state: GameState): GameState {
  return {
    ...state,
    phase: "open",
    served: 0,
    currentOrder: generateOrder(state.day, 0),
    draft: emptyDraft(),
    dailyRevenue: 0,
    dailyCost: 0,
    dailyScoreTotal: 0,
    lastScore: null,
    notice: "Khách đầu tiên tới rồi! Đọc order thật kỹ nha.",
    summary: null,
  };
}

function closeness(actual: number, expected: number, maxPoints: number): number {
  const distance = Math.abs(actual - expected);
  return Math.max(0, maxPoints * (1 - distance / 100));
}

export function scoreDrink(order: Order, draft: DrinkDraft): number {
  let score = 0;
  if (draft.base === order.base) score += 30;
  if (draft.size === order.size) score += 15;
  if (draft.topping === order.topping) score += 20;
  score += closeness(draft.sugar, order.sugar, 15);
  score += closeness(draft.ice, order.ice, 15);
  if (draft.sealed) score += 5;
  return Math.round(Math.min(100, score));
}

function getStars(score: number): number {
  if (score >= 92) return 5;
  if (score >= 78) return 4;
  if (score >= 62) return 3;
  if (score >= 45) return 2;
  return 1;
}

function inventoryRequirement(order: Order, draft: DrinkDraft): Partial<Record<InventoryKey, number>> {
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
    id: `review-${Date.now()}-${Math.random()}`,
    customerName: customer.name,
    stars,
    score,
    text: pick(pool),
    day: state.day,
  };
}

export function serveCurrentDrink(state: GameState): GameState {
  const order = state.currentOrder;
  if (!order || state.phase !== "open") return state;

  const requirements = inventoryRequirement(order, state.draft);
  const shortage = findShortage(state.inventory, requirements);
  if (shortage) {
    return { ...state, notice: "Kho đang thiếu nguyên liệu. Ghé tab Kho để nhập thêm nhé!" };
  }

  const score = scoreDrink(order, state.draft);
  const stars = getStars(score);
  const tip = score >= 92 ? 5000 : score >= 80 ? 2000 : 0;
  const earned = Math.round(order.price * (0.72 + (score / 100) * 0.28)) + tip;
  const ingredientCost = state.draft.size === "L" ? 9000 : 7000;
  const served = state.served + 1;
  const review = makeReview(state, order, score);
  const dailyRevenue = state.dailyRevenue + earned;
  const dailyCost = state.dailyCost + ingredientCost;
  const scoreTotal = state.dailyScoreTotal + score;
  const reputationDelta = stars >= 4 ? 2 : stars === 3 ? 0 : -1;
  const xpGain = 8 + stars * 3;
  const inventory = consume(state.inventory, requirements);

  if (served >= state.targetOrders) {
    const profit = dailyRevenue - dailyCost;
    return {
      ...state,
      phase: "summary",
      currentOrder: null,
      draft: emptyDraft(),
      inventory,
      cash: state.cash + earned,
      reputation: Math.max(0, state.reputation + reputationDelta),
      xp: state.xp + xpGain,
      served,
      dailyRevenue,
      dailyCost,
      dailyScoreTotal: scoreTotal,
      lastScore: score,
      reviews: [review, ...state.reviews].slice(0, 30),
      notice: "Hết ca rồi! Cùng xem hôm nay tiệm làm ăn thế nào nha.",
      summary: {
        day: state.day,
        orders: served,
        revenue: dailyRevenue,
        ingredientCost: dailyCost,
        profit,
        averageScore: Math.round(scoreTotal / served),
      },
    };
  }

  return {
    ...state,
    currentOrder: generateOrder(state.day, served),
    draft: emptyDraft(),
    inventory,
    cash: state.cash + earned,
    reputation: Math.max(0, state.reputation + reputationDelta),
    xp: state.xp + xpGain,
    served,
    dailyRevenue,
    dailyCost,
    dailyScoreTotal: scoreTotal,
    lastScore: score,
    reviews: [review, ...state.reviews].slice(0, 30),
    notice:
      score >= 90
        ? `Xuất sắc! Ly vừa rồi đạt ${score}/100 ✨`
        : score >= 70
          ? `Ổn áp! Ly vừa rồi đạt ${score}/100.`
          : `Khách hơi bối rối... ly vừa rồi đạt ${score}/100.`,
  };
}

export function restock(state: GameState, key: InventoryKey): GameState {
  const item = RESTOCK_ITEMS.find((entry) => entry.key === key);
  if (!item) return state;
  if (state.cash < item.price) {
    return { ...state, notice: "Chưa đủ tiền nhập lô này rồi 🥺" };
  }

  return {
    ...state,
    cash: state.cash - item.price,
    inventory: {
      ...state.inventory,
      [key]: state.inventory[key] + item.amount,
    },
    notice: `Đã nhập thêm ${item.amount} ${item.label}.`,
  };
}

export function nextDay(state: GameState): GameState {
  return {
    ...state,
    day: state.day + 1,
    phase: "prep",
    served: 0,
    currentOrder: null,
    draft: emptyDraft(),
    lastScore: null,
    notice: "Ngày mới tới rồi. Kiểm tra kho trước khi mở cửa nha!",
    summary: null,
  };
}

export function updateDraft(state: GameState, patch: Partial<DrinkDraft>): GameState {
  return {
    ...state,
    draft: { ...state.draft, ...patch },
  };
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
