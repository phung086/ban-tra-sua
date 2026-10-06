import { describe, expect, it } from "vitest";
import { CUSTOMERS } from "./content";
import { getCustomerServiceFeedback } from "./customerAi";
import { createInitialState, serveCurrentDrink, startDay } from "./engine";

describe("customer AI patience", () => {
  it("makes impatient customers react to long waits", () => {
    const state = createInitialState();
    const customer = { ...CUSTOMERS[0], id: "test-impatient", patience: "impatient" as const };

    const quick = getCustomerServiceFeedback(state, customer, 0, 10000);
    const late = getCustomerServiceFeedback(state, customer, 0, 90000);

    expect(quick.mood).toBe("delighted");
    expect(quick.tipMultiplier).toBeGreaterThan(1);
    expect(["restless", "upset"]).toContain(late.mood);
    expect(late.tipMultiplier).toBeLessThan(1);
  });

  it("rewards regular-customer bond and rush-flow research with more tolerance", () => {
    const customer = { ...CUSTOMERS[0], id: "test-regular", patience: "normal" as const };
    const base = createInitialState();
    const regular = {
      ...base,
      customerBond: { ...base.customerBond, [customer.id]: 30 },
      researchedIds: [...base.researchedIds, "rush-flow" as const],
    };

    const normalWindow = getCustomerServiceFeedback(base, customer, 0, 0).patienceSeconds;
    const regularWindow = getCustomerServiceFeedback(regular, customer, 0, 0).patienceSeconds;

    expect(regularWindow).toBeGreaterThan(normalWindow);
  });

  it("starts with a two-customer queue and advances it after a served drink", () => {
    const opened = startDay(createInitialState(), 1000);
    expect(opened.customerQueue).toHaveLength(2);
    expect(opened.currentOrderQueuedAt).toBe(1000);

    const order = opened.currentOrder;
    expect(order).not.toBeNull();
    if (!order) return;

    const ready = {
      ...opened,
      draft: {
        size: order.size,
        base: order.base,
        sugar: order.sugar,
        ice: order.ice,
        topping: order.topping,
        fill: order.targetFill,
        shake: order.targetShake,
        sealed: true,
      },
    };

    const served = serveCurrentDrink(ready, 61000);

    expect(served.served).toBe(1);
    expect(served.lastService?.waitedSeconds).toBe(60);
    expect(served.currentOrder).not.toBeNull();
    expect(served.customerQueue.length).toBeLessThanOrEqual(2);
    expect(served.currentOrderQueuedAt).not.toBeNull();
  });
});
