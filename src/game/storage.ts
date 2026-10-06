import { createInitialState } from "./engine";
import type { GameState } from "./types";

const SAVE_KEY = "tiem-tra-chibi-save-v1";

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (parsed.saveVersion !== 1) return createInitialState();
    return {
      ...createInitialState(),
      ...parsed,
      inventory: {
        ...createInitialState().inventory,
        ...(parsed.inventory ?? {}),
      },
    };
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
  } catch {
    // Ignore storage errors.
  }
}
