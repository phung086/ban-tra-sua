import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CUSTOMERS } from "../game/content";
import { createInitialState } from "../game/engine";
import { ChibiPortrait, ChibiCustomer } from "./ChibiCustomer";
import { CustomerScene } from "./CustomerScene";
import type { Order } from "../game/types";

const order: Order = {
  id: "waiting-test", customerId: CUSTOMERS[0].id, size: "M",
  base: "classic-milk-tea", sugar: 50, ice: 50, topping: "none",
  targetFill: 80, targetShake: 60, price: 25000,
};

afterEach(() => vi.restoreAllMocks());

describe("counter customer facial acting", () => {
  it("passes authored mood into the lightweight portrait", () => {
    const html = renderToStaticMarkup(<ChibiPortrait customer={CUSTOMERS[0]} mood="restless" />);
    expect(html).toContain('data-mood="restless"');
    expect(html).toContain("chibi-fallback-face");
  });

  it("renders complete chibi silhouette with expressive eyebrows and two arms", () => {
    const html = renderToStaticMarkup(<ChibiPortrait customer={CUSTOMERS[0]} mood="delighted" />);
    expect(html).toContain("chibi-fallback-brows");
    expect(html.match(/chibi-fallback-arm is-/g)).toHaveLength(2);
    expect(html.match(/chibi-fallback-shoe is-/g)).toHaveLength(2);
    expect(html).toContain('data-mood="delighted"');
  });

  it("preserves each customer's outfit colors in the fallback silhouette", () => {
    const html = renderToStaticMarkup(<ChibiPortrait customer={CUSTOMERS[1]} mood="upset" />);
    expect(html).toContain(CUSTOMERS[1].shirt);
    expect(html).toContain(CUSTOMERS[1].skin);
    expect(html).toContain('data-mood="upset"');
  });

  it("forwards delivery mood through the customer card", () => {
    const html = renderToStaticMarkup(<ChibiCustomer customer={CUSTOMERS[0]} mood="upset" />);
    expect(html).toContain('data-mood="upset"');
  });

  it("shows impatience as the customer waits instead of a static smile", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const state = { ...createInitialState(), phase: "open" as const, currentOrder: order, currentOrderQueuedAt: 850_000 };
    const html = renderToStaticMarkup(<CustomerScene game={state} />);
    expect(html).toContain('data-mood="upset"');
    expect(html).toContain("mood-upset");
  });

  it("starts the order with a relaxed expression", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const state = { ...createInitialState(), phase: "open" as const, currentOrder: order, currentOrderQueuedAt: 1_000_000 };
    const html = renderToStaticMarkup(<CustomerScene game={state} />);
    expect(html).toContain('data-mood="delighted"');
    expect(html).toContain("mood-delighted");
  });
});
