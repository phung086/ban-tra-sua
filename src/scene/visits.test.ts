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
  it("eases the customer greeting before the guest heads to a table", () => {
    const customer = visit("table-1");
    expect(visitPose(customer, 1600).gesture).toBe(0);
    expect(visitPose(customer, 1610).gesture).toBeLessThan(0.05);
    expect(visitPose(customer, 1900).gesture).toBeGreaterThan(0.65);
    expect(visitPose(customer, 2690).gesture).toBeLessThan(0.02);
    expect(visitPose(customer, 2700)).toMatchObject({ gesture: 0, walking: true });
    expect(visitPose(customer, 1900, false).gesture).toBe(0);
  });
  it("paces the trip to a table by meters instead of equal time per waypoint", () => {
    const customer = visit("table-1");
    const pose = visitPose(customer, 3080); // 20% of the 2.7s–4.6s route
    // The first leg is only ~1.43m of a ~5.68m path, not 1/3 of the time.
    expect(pose.x).toBeCloseTo(-1.11, 1);
    expect(pose.z).toBeCloseTo(-0.54, 1);
    expect(pose.walking).toBe(true);
    const mirrored = visitPose(visit("table-2"), 3080);
    expect(mirrored.x).toBeCloseTo(-pose.x, 4);
    expect(mirrored.z).toBeCloseTo(pose.z, 4);
    expect(visitPose(customer, 3080, false).walking).toBe(false);
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
