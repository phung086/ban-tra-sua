import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CUSTOMERS } from "../game/content";
import { getNextPatienceDrop, getCustomerServiceFeedback } from "../game/customerAi";
import { createInitialState } from "../game/engine";
import type { Order } from "../game/types";
import { CustomerQueueStatus } from "./CustomerQueueStatus";

const order: Order = {
  id: "service-stakes-test", customerId: "bo", size: "M",
  base: "classic-milk-tea", sugar: 50, ice: 50, topping: "none",
  targetFill: 80, targetShake: 60, price: 25000,
};

describe("live tip and patience stakes", () => {
  const game = { ...createInitialState(), phase: "open" as const,
    currentOrder: order, currentOrderQueuedAt: 1_000_000 };
  const customer = CUSTOMERS.find(entry => entry.id === "bo")!;

  it("forecasts the next real tip tier rather than inventing a deadline", () => {
    const forecast = getNextPatienceDrop(game, customer, 1_000_000, 1_000_000)!;
    expect(forecast.seconds).toBeGreaterThan(0);
    expect(forecast.tipAfter).toBeLessThan(forecast.tipBefore);
    const before = getCustomerServiceFeedback(game, customer, 1_000_000, 1_000_000 + (forecast.seconds - 1) * 1000);
    const after = getCustomerServiceFeedback(game, customer, 1_000_000, 1_000_000 + forecast.seconds * 1000);
    expect(before.mood).toBe("delighted");
    expect(after.mood).toBe(forecast.nextMood);
  });

  it("reflects extra patience for a regular customer", () => {
    const regular = { ...game, customerBond: { ...game.customerBond, bo: 30 } };
    const regularDrop = getNextPatienceDrop(regular, customer, 1_000_000, 1_000_000)!;
    const ordinaryDrop = getNextPatienceDrop(game, customer, 1_000_000, 1_000_000)!;
    expect(regularDrop.seconds).toBeGreaterThan(ordinaryDrop.seconds);
  });

  it("shows real trade-off on the customer queue without a new timer", () => {
    const html = renderToStaticMarkup(<CustomerQueueStatus game={game} now={1_000_000} />);
    expect(html).toContain("Pha kỹ hay giao sớm?");
    expect(html).toContain("trước khi tip giảm");
    expect(html).toContain("+15%");
    expect(html).toContain("+5%");
  });

  it("does not invent a further tip drop once the customer is upset", () => {
    expect(getNextPatienceDrop(game, customer, 1_000_000, 1_500_000)).toBeNull();
    const html = renderToStaticMarkup(<CustomerQueueStatus game={game} now={1_500_000} />);
    expect(html).toContain("ưu tiên giao ly");
  });

  it("renders nothing without an active order", () => {
    expect(renderToStaticMarkup(<CustomerQueueStatus game={createInitialState()} now={1_000_000} />)).toBe("");
  });
});
