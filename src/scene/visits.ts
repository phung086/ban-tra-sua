import { deliveryFor, type Place } from "../game/service";
import type { DrinkDraft, GameState, Order } from "../game/types";

export type Visit = {
  order: Order;
  started: number;
  location: Exclude<Place, "door">;
  drink: DrinkDraft;
  receivedAt?: number;
};
export type VisitPose = {
  x: number;
  z: number;
  y: number;
  rotation: number;
  walking: boolean;
  sitting: boolean;
  gesture: number;
  cup: boolean;
  finished: boolean;
};
const seat = (place: Place): [number, number] =>
  place === "counter" ? [0, -0.3] : [place === "table-1" ? -2.8 : 2.8, -3.45];
function along(points: number[][], amount: number) {
  const segment = Math.min(
    points.length - 2,
    Math.floor(amount * (points.length - 1)),
  );
  const local = Math.min(1, amount * (points.length - 1) - segment);
  const a = points[segment],
    b = points[segment + 1];
  return {
    x: a[0] + (b[0] - a[0]) * local,
    z: a[1] + (b[1] - a[1]) * local,
    rotation: Math.atan2(b[0] - a[0], b[1] - a[1]),
  };
}
export function visitPose(visit: Visit, now: number, motion = true): VisitPose {
  const [x, z] = seat(visit.location);
  const dineIn = visit.location !== "counter";
  const base = {
    x,
    z,
    y: dineIn ? -0.27 : 0,
    rotation: 0,
    walking: false,
    sitting: dineIn,
    gesture: 0,
    cup: false,
    finished: false,
  };
  if (visit.receivedAt !== undefined) {
    const elapsed = (now - visit.receivedAt) / 1000;
    if (!motion) return { ...base, cup: true, finished: elapsed > 0.8 };
    if (elapsed < 1.15) return { ...base, gesture: 1.05, cup: true };
    const path = dineIn
      ? [
          [x, z],
          [x * 0.5, z],
          [x * 0.5, -4.7],
          [0, -5.8],
        ]
      : [
          [x, z],
          [0, -5.8],
        ];
    const progress = Math.min(1, (elapsed - 1.15) / 2.5);
    return {
      ...base,
      ...along(path, progress),
      y: 0,
      sitting: false,
      walking: true,
      gesture: 0.6,
      cup: true,
      finished: progress >= 1,
    };
  }
  const elapsed = (now - visit.started) / 1000;
  if (!motion) return base;
  if (elapsed < 1.6)
    return {
      ...base,
      ...along(
        [
          [0, -5.3],
          [0, -0.3],
        ],
        Math.max(0, elapsed / 1.6),
      ),
      y: 0,
      sitting: false,
      walking: true,
    };
  if (elapsed < 2.7)
    return {
      ...base,
      x: 0,
      z: -0.3,
      y: 0,
      sitting: false,
      gesture: 0.8 + Math.sin(elapsed * 6) * 0.15,
    };
  if (dineIn && elapsed < 4.6)
    return {
      ...base,
      ...along(
        [
          [0, -0.3],
          [x * 0.5, -0.6],
          [x * 0.5, z],
          [x, z],
        ],
        (elapsed - 2.7) / 1.9,
      ),
      y: 0,
      sitting: false,
      walking: true,
    };
  return base;
}

export class Visits {
  active: Visit | null = null;
  leaving: Visit[] = [];
  served: number | undefined;
  update(game: GameState, now: number, motion = true) {
    if (this.active?.order.id !== game.currentOrder?.id) {
      if (
        this.active &&
        this.served !== undefined &&
        game.served > this.served &&
        game.lastService?.customerId === this.active.order.customerId
      ) {
        this.leaving.push({ ...this.active, receivedAt: now });
      }
      this.active = game.currentOrder
        ? {
            order: game.currentOrder,
            started: now,
            location: deliveryFor(game.currentOrder),
            drink: { ...game.draft },
          }
        : null;
    } else if (this.active) this.active.drink = { ...game.draft };
    this.served = game.served;
    this.leaving = this.leaving.filter(
      (visit) => !visitPose(visit, now, motion).finished,
    );
  }
}
