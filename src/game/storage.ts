import { createInitialState, getLevelFromXp } from "./engine";
import type { GameState, Inventory, Review } from "./types";

const SAVE_KEY = "tiem-tra-chibi-save-v2";
const LEGACY_SAVE_KEY = "tiem-tra-chibi-save-v1";

type LegacyReview = Omit<Review, "customerId"> & { customerId?: string };

interface LegacySave {
  saveVersion?: 1;
  day?: number;
  cash?: number;
  reputation?: number;
  xp?: number;
  inventory?: Partial<Inventory>;
  reviews?: LegacyReview[];
}

function hydrateV2(parsed: Partial<GameState>): GameState {
  const initial = createInitialState();
  const xp = typeof parsed.xp === "number" ? parsed.xp : initial.xp;
  return {
    ...initial,
    ...parsed,
    saveVersion: 2,
    xp,
    level: getLevelFromXp(xp),
    inventory: { ...initial.inventory, ...(parsed.inventory ?? {}) },
    freshness: { ...initial.freshness, ...(parsed.freshness ?? {}) },
    upgrades: { ...initial.upgrades, ...(parsed.upgrades ?? {}) },
    stats: { ...initial.stats, ...(parsed.stats ?? {}) },
    hiredStaff: parsed.hiredStaff ?? initial.hiredStaff,
    quests: parsed.quests ?? initial.quests,
    achievementIds: parsed.achievementIds ?? initial.achievementIds,
    unlockedBaseIds: parsed.unlockedBaseIds ?? initial.unlockedBaseIds,
    unlockedToppingIds: parsed.unlockedToppingIds ?? initial.unlockedToppingIds,
  };
}

function migrateLegacy(parsed: LegacySave): GameState {
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
    notice: "Save cũ đã được nâng cấp an toàn lên hệ thống progression v2 ✨",
  };
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameState>;
      if (parsed.saveVersion === 2) return hydrateV2(parsed);
    }

    const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as LegacySave;
      return migrateLegacy(legacy);
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
    localStorage.removeItem(LEGACY_SAVE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
