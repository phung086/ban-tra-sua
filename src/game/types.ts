import type { CityState } from './city';
export type Phase = "prep" | "open" | "summary";
export type Screen = "shop" | "stock" | "upgrades" | "reviews" | "goals";
export type Size = "M" | "L";
export type BaseId =
  | "classic-milk-tea"
  | "peach-tea"
  | "matcha-latte"
  | "oolong-milk-tea"
  | "taro-milk-tea"
  | "strawberry-milk"
  | "cocoa-milk"
  | "lemon-tea";
export type ToppingId =
  | "none"
  | "black-pearl"
  | "pudding"
  | "rainbow-jelly"
  | "cheese-foam"
  | "aloe-vera"
  | "mochi";
export type UpgradeId = "brewer" | "shaker" | "sealer" | "fridge" | "decor";
export type StaffId = "momo" | "kiki" | "lili";
export type ReplyStyle = "sweet" | "witty" | "spicy";
export type DecorationId =
  | "sakura-lantern"
  | "bunny-sign"
  | "flower-wall"
  | "neon-heart"
  | "lucky-cat"
  | "moon-window";
export type ResearchId =
  | "precision-tools"
  | "rush-flow"
  | "zero-waste"
  | "social-storytelling"
  | "signature-service"
  | "regulars-club";
export type QuestMetric = "serve" | "perfect" | "revenue" | "reply" | "combo";
export type AchievementMetric = "served" | "perfect" | "revenue" | "replies" | "days" | "fans";
export type CustomerMood = "delighted" | "happy" | "neutral" | "restless" | "upset";

export type InventoryKey =
  | "cupsM"
  | "cupsL"
  | "classicMilkTea"
  | "peachTea"
  | "matchaLatte"
  | "oolongMilkTea"
  | "taroMix"
  | "strawberryMilk"
  | "cocoaMilk"
  | "lemonTea"
  | "blackPearl"
  | "pudding"
  | "rainbowJelly"
  | "cheeseFoam"
  | "aloeVera"
  | "mochi"
  | "sugar"
  | "ice";

export interface Customer {
  id: string;
  name: string;
  hair: string;
  shirt: string;
  skin: string;
  greeting: string;
  archetype: string;
  patience: "chill" | "normal" | "impatient";
  favorite?: BaseId;
  good: string[];
  okay: string[];
  bad: string[];
}

export interface DrinkDefinition {
  id: BaseId;
  name: string;
  shortName: string;
  emoji: string;
  ingredient: InventoryKey;
  priceM: number;
  priceL: number;
  unlockLevel: number;
}

export interface ToppingDefinition {
  id: ToppingId;
  name: string;
  emoji: string;
  ingredient?: InventoryKey;
  price: number;
  unlockLevel: number;
}

export interface Order {
  id: string;
  customerId: string;
  size: Size;
  base: BaseId;
  sugar: number;
  ice: number;
  topping: ToppingId;
  targetFill: number;
  targetShake: number;
  price: number;
}

export interface DrinkDraft {
  size: Size;
  base: BaseId;
  sugar: number;
  ice: number;
  topping: ToppingId;
  fill: number;
  shake: number;
  sealed: boolean;
  /** Optional for backward-compatible v3 saves; quick mixing trades precision for speed. */
  rushed?: boolean;
}

export interface CustomerQueueEntry {
  order: Order;
  joinedAt: number;
}

export interface CustomerServiceFeedback {
  customerId: string;
  waitedSeconds: number;
  patienceSeconds: number;
  patienceRatio: number;
  remainingPercent: number;
  mood: CustomerMood;
  tipMultiplier: number;
}

export type Inventory = Record<InventoryKey, number>;
export type Freshness = Record<InventoryKey, number>;
export type UpgradeLevels = Record<UpgradeId, number>;

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  stars: number;
  score: number;
  text: string;
  day: number;
  replyStyle?: ReplyStyle;
  replyText?: string;
}

export interface DayEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  demandBonus: number;
  revenueMultiplier: number;
  tipMultiplier: number;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  emoji: string;
  description: string;
  baseCost: number;
  maxLevel: number;
}

export interface StaffDefinition {
  id: StaffId;
  name: string;
  emoji: string;
  role: string;
  description: string;
  hireCost: number;
}

export interface DecorationDefinition {
  id: DecorationId;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  unlockLevel: number;
  revenueBonus: number;
  tipBonus: number;
  fanBonus: number;
  viralBonus: number;
  researchBonus: number;
}

export interface ResearchDefinition {
  id: ResearchId;
  name: string;
  emoji: string;
  category: string;
  description: string;
  cost: number;
  prerequisiteIds: ResearchId[];
  scoreBonus?: number;
  comboThresholdReduction?: number;
  decayReduction?: number;
  replyFanBonus?: number;
  replyViralBonus?: number;
  perfectRevenueBonus?: number;
  bondBonus?: number;
}

export interface CustomerStoryDefinition {
  customerId: string;
  bond: number;
  title: string;
  text: string;
  rewardCash: number;
  rewardFans: number;
  rewardViral: number;
}

export interface StoryMoment {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  text: string;
  day: number;
  rewardFans: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  metric: QuestMetric;
  target: number;
  progress: number;
  rewardCash: number;
  rewardXp: number;
  rewardFans: number;
  claimed: boolean;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
  rewardCash: number;
  rewardFans: number;
}

export interface LifetimeStats {
  served: number;
  perfect: number;
  revenue: number;
  replies: number;
  days: number;
  waste: number;
  bestCombo: number;
}

export interface DaySummary {
  day: number;
  eventName: string;
  orders: number;
  perfectOrders: number;
  bestCombo: number;
  revenue: number;
  ingredientCost: number;
  wasteCost: number;
  profit: number;
  averageScore: number;
  fansGained: number;
  researchGained: number;
}

export interface GameState {
  saveVersion: 3;
  city: CityState;
  day: number;
  phase: Phase;
  cash: number;
  reputation: number;
  fans: number;
  viral: number;
  researchPoints: number;
  xp: number;
  level: number;
  served: number;
  targetOrders: number;
  combo: number;
  bestCombo: number;
  perfectToday: number;
  currentOrder: Order | null;
  customerQueue: CustomerQueueEntry[];
  currentOrderQueuedAt: number | null;
  lastService: CustomerServiceFeedback | null;
  draft: DrinkDraft;
  inventory: Inventory;
  freshness: Freshness;
  reviews: Review[];
  event: DayEvent;
  upgrades: UpgradeLevels;
  hiredStaff: StaffId[];
  activeStaff: StaffId | null;
  ownedDecorations: DecorationId[];
  equippedDecorations: DecorationId[];
  researchedIds: ResearchId[];
  customerBond: Record<string, number>;
  customerVisits: Record<string, number>;
  relationshipRewardIds: string[];
  storyLog: StoryMoment[];
  quests: Quest[];
  achievementIds: string[];
  stats: LifetimeStats;
  unlockedBaseIds: BaseId[];
  unlockedToppingIds: ToppingId[];
  dailyRevenue: number;
  dailyCost: number;
  dailyWaste: number;
  dailyScoreTotal: number;
  dailyFansGained: number;
  dailyResearchGained: number;
  lastScore: number | null;
  notice: string;
  summary: DaySummary | null;
}
