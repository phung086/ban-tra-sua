import { DRINKS, TOPPINGS } from "./content";
import { scoreDrink } from "./engine";
import type { BaseId, DrinkDraft, GameState, InventoryKey } from "./types";

/** Inventory is debited on delivery. Check before sealing to avoid a dead-end cup. */
export function missingDraftStock(state: GameState): InventoryKey[] {
  const { draft, inventory } = state;
  const keys: InventoryKey[] = [
    draft.size === "M" ? "cupsM" : "cupsL",
    DRINKS[draft.base].ingredient,
  ];
  if (draft.sugar > 0) keys.push("sugar");
  if (draft.ice > 0) keys.push("ice");
  const topping = TOPPINGS[draft.topping].ingredient;
  if (topping) keys.push(topping);
  return keys.filter(key => (inventory[key] ?? 0) < 1);
}

export interface StockRescue {
  patch: Partial<DrinkDraft>;
  changes: string[];
  predictedScore: number;
}

/**
 * An honest alternative to abandoning an order when stock is low.
 * Never grants ingredients, resets the customer timer, or silently changes a
 * sealed cup. A player can instead visit Stock to fulfil the original recipe.
 */
export function planStockRescue(state: GameState, preferredBase?: BaseId): StockRescue | null {
  if (state.phase !== "open" || !state.currentOrder || state.draft.sealed ||
      missingDraftStock(state).length === 0) return null;
  const { inventory } = state;
  const draft = { ...state.draft };
  const changes: string[] = [];
  if (!inventory[draft.size === "M" ? "cupsM" : "cupsL"]) {
    const other = draft.size === "M" ? "L" : "M";
    if (!inventory[other === "M" ? "cupsM" : "cupsL"]) return null;
    draft.size = other;
    changes.push("đổi cỡ ly");
  }
  if (!inventory[DRINKS[draft.base].ingredient]) {
    const replacement = preferredBase && state.unlockedBaseIds.includes(preferredBase) &&
      inventory[DRINKS[preferredBase].ingredient] > 0
      ? preferredBase
      : state.unlockedBaseIds.find(
        (id: BaseId) => inventory[DRINKS[id].ingredient] > 0,
      );
    if (!replacement) return null;
    draft.base = replacement;
    changes.push("đổi nền trà");
  }
  if (draft.sugar > 0 && !inventory.sugar) {
    draft.sugar = 0;
    changes.push("không đường");
  }
  if (draft.ice > 0 && !inventory.ice) {
    draft.ice = 0;
    changes.push("không đá");
  }
  const toppingKey = TOPPINGS[draft.topping].ingredient;
  if (toppingKey && !inventory[toppingKey]) {
    draft.topping = "none";
    changes.push("bỏ topping");
  }
  const patchedState = { ...state, draft };
  if (missingDraftStock(patchedState).length) return null;
  return {
    patch: {
      size: draft.size,
      base: draft.base,
      sugar: draft.sugar,
      ice: draft.ice,
      topping: draft.topping,
    },
    changes,
    predictedScore: scoreDrink(state.currentOrder, draft),
  };
}

/** Show genuinely different stocked alternatives, not a forced first-match swap.
 * Options are ordered by recipe quality; no inventory/time is changed until a player selects one.
 */
export function listStockRescueOptions(state: GameState): StockRescue[] {
  const fallback = planStockRescue(state);
  if (!fallback) return [];
  const baseUnavailable = (state.inventory[DRINKS[state.draft.base].ingredient] ?? 0) < 1;
  if (!baseUnavailable) return [fallback];
  const options = state.unlockedBaseIds
    .filter(id => (state.inventory[DRINKS[id].ingredient] ?? 0) > 0)
    .map(id => planStockRescue(state, id))
    .filter((option): option is StockRescue => option !== null);
  // Stable sorting keeps choice order deterministic across reloads.
  return options.sort((a, b) => b.predictedScore - a.predictedScore).slice(0, 3);
}
