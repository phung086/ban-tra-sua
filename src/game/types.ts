export type Phase = "prep" | "open" | "summary";
export type Screen = "shop" | "stock" | "reviews";
export type Size = "M" | "L";
export type BaseId = "classic-milk-tea" | "peach-tea" | "matcha-latte";
export type ToppingId = "none" | "black-pearl" | "pudding" | "rainbow-jelly";

export type InventoryKey =
  | "cupsM"
  | "cupsL"
  | "classicMilkTea"
  | "peachTea"
  | "matchaLatte"
  | "blackPearl"
  | "pudding"
  | "rainbowJelly"
  | "sugar"
  | "ice";

export interface Customer {
  id: string;
  name: string;
  hair: string;
  shirt: string;
  skin: string;
  greeting: string;
  good: string[];
  okay: string[];
  bad: string[];
}

export interface DrinkDefinition {
  id: BaseId;
  name: string;
  emoji: string;
  ingredient: InventoryKey;
  priceM: number;
  priceL: number;
}

export interface ToppingDefinition {
  id: ToppingId;
  name: string;
  emoji: string;
  ingredient?: InventoryKey;
}

export interface Order {
  id: string;
  customerId: string;
  size: Size;
  base: BaseId;
  sugar: number;
  ice: number;
  topping: ToppingId;
  price: number;
}

export interface DrinkDraft {
  size: Size;
  base: BaseId;
  sugar: number;
  ice: number;
  topping: ToppingId;
  sealed: boolean;
}

export type Inventory = Record<InventoryKey, number>;

export interface Review {
  id: string;
  customerName: string;
  stars: number;
  score: number;
  text: string;
  day: number;
}

export interface DaySummary {
  day: number;
  orders: number;
  revenue: number;
  ingredientCost: number;
  profit: number;
  averageScore: number;
}

export interface GameState {
  saveVersion: 1;
  day: number;
  phase: Phase;
  cash: number;
  reputation: number;
  xp: number;
  served: number;
  targetOrders: number;
  currentOrder: Order | null;
  draft: DrinkDraft;
  inventory: Inventory;
  reviews: Review[];
  dailyRevenue: number;
  dailyCost: number;
  dailyScoreTotal: number;
  lastScore: number | null;
  notice: string;
  summary: DaySummary | null;
}
