import { createInitialState, getLevelFromXp } from "./engine";
import type { GameState, Inventory, Review } from "./types";

const SAVE_KEY = "tiem-tra-chibi-save-v3";
const LEGACY_V2_KEY = "tiem-tra-chibi-save-v2";
const LEGACY_V1_KEY = "tiem-tra-chibi-save-v1";

interface StoredGame extends Omit<Partial<GameState>, "saveVersion"> {
  saveVersion?: number;
}

type LegacyReview = Omit<Review, "customerId"> & { customerId?: string };

interface LegacyV1 {
  saveVersion?: 1;
  day?: number;
  cash?: number;
  reputation?: number;
  xp?: number;
  inventory?: Partial<Inventory>;
  reviews?: LegacyReview[];
}

function hydrate(parsed: StoredGame): GameState {
  const initial = createInitialState();
  const xp = typeof parsed.xp === "number" ? parsed.xp : initial.xp;

  return {
    ...initial,
    ...parsed,
    saveVersion: 3,
    xp,
    level: getLevelFromXp(xp),
    inventory: { ...initial.inventory, ...(parsed.inventory ?? {}) },
    freshness: { ...initial.freshness, ...(parsed.freshness ?? {}) },
    upgrades: { ...initial.upgrades, ...(parsed.upgrades ?? {}) },
    stats: { ...initial.stats, ...(parsed.stats ?? {}) },
    hiredStaff: parsed.hiredStaff ?? initial.hiredStaff,
    ownedDecorations: parsed.ownedDecorations ?? initial.ownedDecorations,
    equippedDecorations: parsed.equippedDecorations ?? initial.equippedDecorations,
    researchedIds: parsed.researchedIds ?? initial.researchedIds,
    customerBond: { ...initial.customerBond, ...(parsed.customerBond ?? {}) },
    customerVisits: { ...initial.customerVisits, ...(parsed.customerVisits ?? {}) },
    relationshipRewardIds: parsed.relationshipRewardIds ?? initial.relationshipRewardIds,
    storyLog: parsed.storyLog ?? initial.storyLog,
    quests: parsed.quests ?? initial.quests,
    achievementIds: parsed.achievementIds ?? initial.achievementIds,
    unlockedBaseIds: parsed.unlockedBaseIds ?? initial.unlockedBaseIds,
    unlockedToppingIds: parsed.unlockedToppingIds ?? initial.unlockedToppingIds,
  };
}

function migrateV2(parsed: StoredGame): GameState {
  return {
    ...hydrate(parsed),
    notice: "Save v2 đã được nâng cấp lên v3: mở thêm decor, research, khách quen và mini-game timing ✨",
  };
}

function migrateV1(parsed: LegacyV1): GameState {
  const initial = createInitialState();
  const xp = parsed.xp ?? 0;
  return {
    ...initial,
    day: parsed.day ?? 1,
    cash: parsed.cash ?? initial.cash,
    reputation: parsed.reputation ?? initial.reputation,
    xp,
    level: getLevelFromXp(xp),
    inventory: { ...initial.inventory, ...(parsed.inventory ?? {}) },
    reviews: (parsed.reviews ?? []).map((review) => ({
      ...review,
      customerId: review.customerId ?? "miu",
    })),
    notice: "Save cũ đã được nâng cấp an toàn lên gameplay v3 ✨",
  };
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredGame;
      if (parsed.saveVersion === 3) return hydrate(parsed);
    }

    const legacyV2 = localStorage.getItem(LEGACY_V2_KEY);
    if (legacyV2) {
      const parsed = JSON.parse(legacyV2) as StoredGame;
      if (parsed.saveVersion === 2) return migrateV2(parsed);
    }

    const legacyV1 = localStorage.getItem(LEGACY_V1_KEY);
    if (legacyV1) {
      return migrateV1(JSON.parse(legacyV1) as LegacyV1);
    }

    return createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveGame(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked in private browsing. Gameplay should continue.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(LEGACY_V2_KEY);
    localStorage.removeItem(LEGACY_V1_KEY);
  } catch {
    // Ignore storage errors.
  }
}
