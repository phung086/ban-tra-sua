import { describe, expect, it } from "vitest";
import { createInitialState, startDay, updateDraft, remakeSealedDrink } from "./engine";
import {
  canWalk,
  deliverDrink,
  deliveryFor,
  PLACES,
  routeTo,
  type Place,
} from "./service";
import { CUSTOMERS } from "./content";
import { LOOKS, makePerson, Workshop } from "../scene/models";

function ready(id: string) {
  let game = startDay(createInitialState(), Date.now());
  game = { ...game, currentOrder: { ...game.currentOrder!, id } };
  const order = game.currentOrder!;
  return updateDraft(game, {
    size: order.size,
    base: order.base,
    topping: order.topping,
    sugar: order.sugar,
    ice: order.ice,
    fill: order.targetFill,
    shake: order.targetShake,
    sealed: true,
  });
}
describe("physical service", () => {
  it("charges wasted ingredients when a sealed cup is remade", () => {
    const game = ready("remake-case");
    const after = remakeSealedDrink(game);
    expect(after.served).toBe(game.served);
    expect(after.currentOrder).toEqual(game.currentOrder);
    expect(after.dailyCost).toBeGreaterThan(game.dailyCost);
    expect(after.stats.waste).toBeGreaterThan(game.stats.waste);
    expect(after.draft.sealed).toBe(false);
    expect(updateDraft(game, { sealed: false }).draft.sealed).toBe(true);
  });

  it.each(["c", "a", "b"])(
    "only completes %s at its assigned destination and charges once",
    (id) => {
      const game = ready(id),
        order = game.currentOrder!;
      const destination = PLACES[deliveryFor(order)];
      const away = deliverDrink(game, true, { x: 4.1, z: 3.1 }, order.id);
      expect(away.served).toBe(game.served);
      expect(away.inventory).toEqual(game.inventory);
      expect(away.cash).toBe(game.cash);
      const served = deliverDrink(game, true, destination, order.id);
      expect(served.served).toBe(game.served + 1);
      expect(served.lastScore).toBeGreaterThanOrEqual(95);
      expect(
        served.inventory[game.draft.size === "M" ? "cupsM" : "cupsL"],
      ).toBe(game.inventory[game.draft.size === "M" ? "cupsM" : "cupsL"] - 1);
      expect(deliverDrink(served, true, destination, order.id)).toBe(served);
    },
  );
  it("requires both sealing and picking up", () => {
    const game = ready("a"),
      order = game.currentOrder!,
      position = PLACES[deliveryFor(order)];
    expect(deliverDrink(game, false, position, order.id).served).toBe(0);
    expect(
      deliverDrink(
        { ...game, draft: { ...game.draft, sealed: false } },
        true,
        position,
        order.id,
      ).served,
    ).toBe(0);
  });
  it("retains the carried drink if ingredients are short", () => {
    const game = ready("b"),
      order = game.currentOrder!;
    game.inventory.cupsM = game.inventory.cupsL = 0;
    const result = deliverDrink(
      game,
      true,
      PLACES[deliveryFor(order)],
      order.id,
    );
    expect(result.served).toBe(0);
    expect(result.currentOrder).toEqual(order);
    expect(result.draft.sealed).toBe(true);
  });
  it("routes every destination pair through a traversable side aisle", () => {
    for (const from of Object.values(PLACES))
      for (const place of Object.keys(PLACES) as Place[]) {
        let previous = from;
        for (const point of routeTo(from, place)) {
          for (let i = 0; i <= 100; i++)
            expect(
              canWalk({
                x: previous.x + ((point.x - previous.x) * i) / 100,
                z: previous.z + ((point.z - previous.z) * i) / 100,
              }),
            ).toBe(true);
          previous = { ...point, label: "" };
        }
      }
    expect(canWalk({ x: 0, z: 1 })).toBe(false);
    expect(canWalk({ x: 0, z: -6 })).toBe(false);
  });
  it("models every saved and new customer with finite geometry and independent articulated limbs", () => {
    const workshop = new Workshop();
    expect(CUSTOMERS).toHaveLength(16);
    expect(new Set(CUSTOMERS.map((c) => c.id)).size).toBe(16);
    for (const customer of CUSTOMERS) {
      expect(LOOKS[customer.id]).toBeDefined();
      const person = makePerson(workshop, customer);
      expect(person.leftLeg).not.toBe(person.rightLeg);
      expect(person.hand.parent).toBe(person.elbows[1]);
      expect(person.root.scale.y).toBeGreaterThan(0.7);
    }
    workshop.geometries.forEach((geometry) => {
      geometry.computeBoundingBox();
      expect(Number.isFinite(geometry.boundingBox!.max.length())).toBe(true);
    });
    workshop.dispose();
  });
});
