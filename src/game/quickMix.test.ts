import { describe, expect, it } from "vitest";
import { createInitialState, scoreDrink, serveCurrentDrink, startDay, updateDraft } from "./engine";
import { predictedQuickMixScore, quickMixDrink, restartCarefulMix, QUICK_MIX_PENALTY } from "./quickMix";

function ready() {
  const started = startDay(createInitialState(), 1_000_000);
  const order = started.currentOrder!;
  return updateDraft(started, {
    base: order.base, size: order.size, topping: order.topping,
    sugar: order.sugar, ice: order.ice,
    fill: order.targetFill, shake: order.targetShake,
  });
}

describe("player-facing fast versus careful brewing", () => {
  it("trades two timing interactions for exactly 12 points of technique quality", () => {
    const game = ready();
    const order = game.currentOrder!;
    const normal = scoreDrink(order, { ...game.draft, sealed: true });
    const rushed = quickMixDrink(game);
    expect(rushed.draft.rushed).toBe(true);
    expect(scoreDrink(order, { ...rushed.draft, sealed: true })).toBe(normal - QUICK_MIX_PENALTY);
    expect(predictedQuickMixScore(game)).toBe(normal - QUICK_MIX_PENALTY);
    expect(rushed.currentOrderQueuedAt).toBe(game.currentOrderQueuedAt);
    expect(rushed.inventory).toEqual(game.inventory);
    expect(rushed.cash).toBe(game.cash);
  });

  it.each([40, 60, 80, 100])("preserves the penalty at shake target %i", (targetShake) => {
    const game = ready();
    const withTarget = { ...game, currentOrder: { ...game.currentOrder!, targetShake } };
    const rushed = quickMixDrink(withTarget);
    const correct = { ...rushed.draft, fill: withTarget.currentOrder.targetFill, shake: targetShake, rushed: false };
    expect(scoreDrink(withTarget.currentOrder, { ...rushed.draft, sealed: true }))
      .toBe(scoreDrink(withTarget.currentOrder, { ...correct, sealed: true }) - QUICK_MIX_PENALTY);
  });

  it("makes a real revenue difference at settlement without resetting patience", () => {
    const game = ready();
    const careful = updateDraft(game, { sealed: true });
    const rushed = updateDraft(quickMixDrink(game), { sealed: true });
    const timestamp = (game.currentOrderQueuedAt ?? 1_000_000) + 10_000;
    const slowSale = serveCurrentDrink(careful, timestamp);
    const quickSale = serveCurrentDrink(rushed, timestamp);
    expect(quickSale.lastScore).toBeLessThan(slowSale.lastScore!);
    expect(quickSale.dailyRevenue).toBeLessThan(slowSale.dailyRevenue);
    expect(quickSale.served).toBe(slowSale.served);
  });

  it("requires deliberate reset before replaying both timing challenges", () => {
    const game = ready();
    const rushed = quickMixDrink(game);
    const reset = restartCarefulMix(rushed);
    expect(reset.draft.rushed).toBe(false);
    expect(reset.draft.fill).toBe(0);
    expect(reset.draft.shake).toBe(0);
    expect(reset.currentOrderQueuedAt).toBe(game.currentOrderQueuedAt);
    expect(reset.inventory).toEqual(game.inventory);
    const sealed = updateDraft(rushed, { sealed: true });
    expect(restartCarefulMix(sealed)).toBe(sealed);
    expect(quickMixDrink(sealed)).toBe(sealed);
  });
});
