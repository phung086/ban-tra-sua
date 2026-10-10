import { describe, expect, it } from "vitest";
import { createInitialState, scoreDrink, serveCurrentDrink, startDay, updateDraft } from "./engine";
import { missingDraftStock, planStockRescue } from "./stockRescue";
import type { GameState } from "./types";

function ready(): GameState {
  const started = startDay(createInitialState(), 1_000_000);
  const order = { ...started.currentOrder!, id: "stock-rescue", size: "M" as const,
    base: "classic-milk-tea" as const, topping: "black-pearl" as const,
    sugar: 50, ice: 50, targetFill: 80, targetShake: 60 };
  return updateDraft({ ...started, currentOrder: order }, {
    size: order.size, base: order.base, topping: order.topping,
    sugar: order.sugar, ice: order.ice, fill: order.targetFill, shake: order.targetShake,
  });
}

describe("real stock substitution choice", () => {
  it("refuses to seal depleted cups at the engine boundary without charging or resetting time", () => {
    const game = ready();
    const depleted = { ...game, inventory: { ...game.inventory, cupsM: 0 } };
    const attempted = updateDraft(depleted, { sealed: true });
    expect(attempted.draft.sealed).toBe(false);
    expect(attempted.notice).toContain("Thiếu nguyên liệu");
    expect(attempted.inventory).toEqual(depleted.inventory);
    expect(attempted.currentOrderQueuedAt).toBe(depleted.currentOrderQueuedAt);
    const rescued = planStockRescue({ ...depleted, inventory: { ...depleted.inventory, cupsL: 1 } });
    expect(rescued?.patch.size).toBe("L");
    const sealed = updateDraft(updateDraft(depleted, rescued!.patch), { sealed: true });
    expect(sealed.draft.sealed).toBe(true);
  });

  it("replaces an unavailable topping without free inventory or resetting patience", () => {
    const base = ready();
    const game = { ...base, inventory: { ...base.inventory, blackPearl: 0 } };
    expect(missingDraftStock(game)).toContain("blackPearl");
    const rescue = planStockRescue(game)!;
    expect(rescue.patch.topping).toBe("none");
    expect(rescue.changes).toContain("bỏ topping");
    expect(rescue.predictedScore).toBeLessThan(scoreDrink(game.currentOrder!, game.draft));
    const changed = updateDraft(game, rescue.patch);
    expect(changed.inventory).toEqual(game.inventory);
    expect(changed.currentOrderQueuedAt).toBe(game.currentOrderQueuedAt);
    expect(missingDraftStock(changed)).toEqual([]);
    expect(planStockRescue(changed)).toBeNull();
    const sealed = updateDraft(changed, { sealed: true });
    const served = serveCurrentDrink(sealed, 1_001_000);
    expect(served.served).toBe(1);
    expect(served.lastScore).toBeLessThan(95);
  });

  it("offers a smaller available cup when the chosen size is depleted", () => {
    const base = ready();
    const game = { ...base, inventory: { ...base.inventory, cupsM: 0, cupsL: 2 } };
    const rescue = planStockRescue(game)!;
    expect(rescue.patch.size).toBe("L");
    expect(rescue.changes).toContain("đổi cỡ ly");
    expect(missingDraftStock(updateDraft(game, rescue.patch))).toEqual([]);
  });

  it("removes sugar and ice if neither ingredient is in stock", () => {
    const base = ready();
    const game = { ...base, inventory: { ...base.inventory, sugar: 0, ice: 0 } };
    const rescue = planStockRescue(game)!;
    expect(rescue.patch.sugar).toBe(0);
    expect(rescue.patch.ice).toBe(0);
    expect(rescue.changes).toContain("không đường");
    expect(rescue.changes).toContain("không đá");
    expect(missingDraftStock(updateDraft(game, rescue.patch))).toEqual([]);
  });

  it("does not fabricate stock or alter a sealed drink", () => {
    const base = ready();
    const game = { ...base, inventory: { ...base.inventory, cupsM: 0, cupsL: 0 } };
    expect(planStockRescue(game)).toBeNull();
    expect(missingDraftStock(game)).toContain("cupsM");
    const sealed = { ...game, draft: { ...game.draft, sealed: true } };
    expect(planStockRescue(sealed)).toBeNull();
  });

  it("offers another unlocked tea when the selected base is depleted", () => {
    const base = ready();
    const game = {
      ...base,
      unlockedBaseIds: [...base.unlockedBaseIds, "peach-tea" as const],
      inventory: { ...base.inventory, classicMilkTea: 0, peachTea: 2 },
    };
    const rescue = planStockRescue(game)!;
    expect(rescue.patch.base).toBe("peach-tea");
    expect(rescue.changes).toContain("đổi nền trà");
    expect(missingDraftStock(updateDraft(game, rescue.patch))).toEqual([]);
  });
});
