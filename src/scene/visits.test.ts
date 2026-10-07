import { describe, expect, it } from "vitest";
import {
  createInitialState,
  serveCurrentDrink,
  startDay,
  updateDraft,
} from "../game/engine";
import { Visits, visitPose, type Visit } from "./visits";

function visit(location: Visit["location"]): Visit {
  const game = startDay(createInitialState(), 1000);
  return { order: game.currentOrder!, started: 0, location, drink: game.draft };
}
describe("customer choreography", () => {
  it("walks in, gestures an order, then sits at the assigned table", () => {
    const customer = visit("table-1");
    expect(visitPose(customer, 100).walking).toBe(true);
    expect(visitPose(customer, 2100).gesture).toBeGreaterThan(0);
    expect(visitPose(customer, 3500).walking).toBe(true);
    expect(visitPose(customer, 5000)).toMatchObject({
      x: -2.8,
      sitting: true,
      walking: false,
      cup: false,
    });
  });
  it("keeps takeaway guests at the counter", () => {
    expect(visitPose(visit("counter"), 6000)).toMatchObject({
      x: 0,
      z: -0.3,
      sitting: false,
    });
  });
  it("receives a cup, stands up, carries it outside and finishes", () => {
    const customer = { ...visit("table-2"), receivedAt: 7000 };
    expect(visitPose(customer, 7400)).toMatchObject({
      cup: true,
      sitting: true,
      walking: false,
    });
    expect(visitPose(customer, 8800)).toMatchObject({
      cup: true,
      sitting: false,
      walking: true,
      finished: false,
    });
    expect(visitPose(customer, 11000).finished).toBe(true);
  });
  it("retains the actual served customer's cup while the next order starts", () => {
    let game = startDay(createInitialState(), Date.now());
    const order = game.currentOrder!;
    game = updateDraft(game, {
      base: order.base,
      size: order.size,
      sugar: order.sugar,
      ice: order.ice,
      topping: order.topping,
      fill: order.targetFill,
      shake: order.targetShake,
      sealed: true,
    });
    const sequence = new Visits();
    sequence.update(game, 0);
    sequence.update(serveCurrentDrink(game), 1000);
    expect(sequence.leaving).toHaveLength(1);
    expect(sequence.leaving[0].order.id).toBe(order.id);
    expect(sequence.leaving[0].drink).toEqual(game.draft);
    expect(sequence.active?.order.id).not.toBe(order.id);
    sequence.update(serveCurrentDrink(game), 6000);
    expect(sequence.leaving).toHaveLength(0);
  });
  it("does not fake a handoff after a failed service or save initialization", () => {
    const game = startDay(createInitialState(), 1000),
      sequence = new Visits();
    sequence.update(game, 0);
    sequence.update(
      { ...game, inventory: { ...game.inventory, cupsM: 0, cupsL: 0 } },
      1000,
    );
    expect(sequence.leaving).toEqual([]);
    const loaded = new Visits();
    loaded.update({ ...game, served: 3 }, 1000);
    expect(loaded.leaving).toEqual([]);
  });
  it("preserves handoff feedback with reduced motion and removes the departing guest", () => {
    const customer = { ...visit("table-1"), receivedAt: 7000 };
    expect(visitPose(customer, 7100, false)).toMatchObject({
      cup: true,
      walking: false,
      finished: false,
    });
    expect(visitPose(customer, 8000, false).finished).toBe(true);
    expect(visitPose(visit("table-2"), 100, false)).toMatchObject({
      sitting: true,
      walking: false,
    });
  });
});
