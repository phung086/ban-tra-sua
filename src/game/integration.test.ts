import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState, nextDay, serveCurrentDrink, startDay, updateDraft } from "./engine";
import { loadGame, saveGame } from "./storage";

describe("integrated day and save compatibility", () => {
  let saved: Map<string, string>;
  beforeEach(() => {
    saved = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
      removeItem: (key: string) => saved.delete(key),
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it("serves a full shift, clears the queue, summarizes earnings and prepares the next day", () => {
    let game = startDay(createInitialState(), 1000);
    const count = game.targetOrders;
    for (let index = 0; index < count; index++) {
      const order = game.currentOrder!;
      expect(order).toBeTruthy();
      game = updateDraft(game, {
        base: order.base, size: order.size, topping: order.topping,
        sugar: order.sugar, ice: order.ice, fill: order.targetFill, shake: order.targetShake, sealed: true,
      });
      game = serveCurrentDrink(game, 1000 + (index + 1) * 10000);
      expect(game.served).toBe(index + 1);
      expect(game.lastScore).toBeGreaterThanOrEqual(95);
    }
    expect(game.phase).toBe("summary");
    expect(game.currentOrder).toBeNull();
    expect(game.customerQueue).toHaveLength(0);
    expect(game.summary?.orders).toBe(count);
    expect(game.summary?.revenue).toBeGreaterThan(0);
    const tomorrow = nextDay(game);
    expect(tomorrow.phase).toBe("prep");
    expect(tomorrow.day).toBe(2);
    expect(tomorrow.saveVersion).toBe(3);
  });

  it("keeps older v3 progress when new customer fields are absent", () => {
    const legacy = { ...createInitialState(), cash: 345000, day: 8 } as Record<string, unknown>;
    delete legacy.customerQueue;
    delete legacy.currentOrderQueuedAt;
    delete legacy.lastService;
    saved.set("tiem-tra-chibi-save-v3", JSON.stringify(legacy));
    const loaded = loadGame();
    expect(loaded.cash).toBe(345000);
    expect(loaded.day).toBe(8);
    expect(loaded.customerQueue).toEqual([]);
    expect(loaded.currentOrderQueuedAt).toBeNull();
    expect(loaded.saveVersion).toBe(3);
  });

  it("restores an unfinished cup and rebases customer timers after an offline break", () => {
    const game = updateDraft(startDay(createInitialState(), 1000), { sugar: 27, ice: 63 });
    saveGame(game);
    vi.useFakeTimers();
    vi.setSystemTime(86400000);
    const restored = loadGame();
    expect(restored.draft).toEqual(game.draft);
    expect(restored.currentOrder?.id).toBe(game.currentOrder?.id);
    expect(restored.currentOrderQueuedAt).toBe(86400000);
    expect(restored.customerQueue[0].joinedAt).toBeGreaterThan(86400000);
    expect(restored.cash).toBe(game.cash);
  });
});
