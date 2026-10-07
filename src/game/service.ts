import { serveCurrentDrink } from "./engine";
import type { GameState, Order } from "./types";

export type Position = { x: number; z: number };
export type Place = "counter" | "table-1" | "table-2" | "door";
export const PLACES: Record<Place, Position & { label: string }> = {
  counter: { x: 0, z: 2.15, label: "Quầy pha chế" },
  "table-1": { x: -2.8, z: -1.65, label: "Bàn 01" },
  "table-2": { x: 2.8, z: -1.65, label: "Bàn 02" },
  door: { x: 0, z: -3.8, label: "Cửa tiệm" },
};

export function deliveryFor(order: Order): Exclude<Place, "door"> {
  const hash = [...order.id].reduce(
    (sum, letter) => sum + letter.charCodeAt(0),
    0,
  );
  return hash % 3 === 0 ? "counter" : hash % 3 === 1 ? "table-1" : "table-2";
}

export function canWalk(position: Position) {
  if (Math.abs(position.x) > 4.3 || position.z < -4.3 || position.z > 3.8)
    return false;
  // Solid counter; its two side aisles connect the workspace and dining room.
  if (Math.abs(position.x) < 2.9 && position.z > 0.35 && position.z < 1.65)
    return false;
  return ![-2.8, 2.8].some(
    (x) => Math.hypot(position.x - x, position.z + 2.55) < 0.8,
  );
}

function clearSegment(a: Position, b: Position) {
  const steps = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / 0.05));
  for (let i = 0; i <= steps; i++)
    if (
      !canWalk({
        x: a.x + ((b.x - a.x) * i) / steps,
        z: a.z + ((b.z - a.z) * i) / steps,
      })
    )
      return false;
  return true;
}

export function routeAcross(from: Position, destination: Position): Position[] {
  if (!canWalk(from) || !canWalk(destination)) return [];
  if (clearSegment(from, destination)) return [{ ...destination }];
  // A small navigation grid finds paths around BOTH counter and circular tables.
  const width = 35,
    height = 33,
    spacing = 0.25;
  const point = (index: number): Position => ({
    x: (index % width) * spacing - 4.25,
    z: Math.floor(index / width) * spacing - 4.25,
  });
  const cells = Array.from(
    { length: width * height },
    (_, index) => index,
  ).filter((index) => canWalk(point(index)));
  const closest = (p: Position) =>
    cells.reduce(
      (best, index) => {
        const candidate = point(index),
          previous = point(best);
        return Math.hypot(candidate.x - p.x, candidate.z - p.z) <
          Math.hypot(previous.x - p.x, previous.z - p.z) &&
          clearSegment(p, candidate)
          ? index
          : best;
      },
      cells.find((index) => clearSegment(p, point(index)))!,
    );
  const start = closest(from),
    end = closest(destination);
  const available = new Set(cells),
    parents = new Map<number, number>([[start, -1]]),
    queue = [start];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor];
    if (current === end) break;
    for (const next of [
      current - 1,
      current + 1,
      current - width,
      current + width,
    ]) {
      if (
        !available.has(next) ||
        parents.has(next) ||
        Math.abs(point(current).x - point(next).x) > spacing ||
        !clearSegment(point(current), point(next))
      )
        continue;
      parents.set(next, current);
      queue.push(next);
    }
  }
  if (!parents.has(end)) return [];
  const path: Position[] = [{ ...destination }];
  for (let index = end; index !== -1; index = parents.get(index)!)
    path.unshift(point(index));
  // Visibility smoothing keeps the walk continuous instead of snapping each grid cell.
  const smooth: Position[] = [];
  let anchor = from,
    cursor = 0;
  while (cursor < path.length) {
    let next = cursor;
    while (next + 1 < path.length && clearSegment(anchor, path[next + 1]))
      next++;
    smooth.push(path[next]);
    anchor = path[next];
    cursor = next + 1;
  }
  return smooth;
}
export function routeTo(from: Position, to: Place): Position[] {
  return routeAcross(from, PLACES[to]);
}

export function deliverDrink(
  state: GameState,
  carrying: boolean,
  position: Position,
  orderId: string,
): GameState {
  if (!state.currentOrder || state.currentOrder.id !== orderId) return state;
  if (!state.draft.sealed || !carrying)
    return { ...state, notice: "Dập nắp rồi bê ly trước khi giao cho khách." };
  const destination = PLACES[deliveryFor(state.currentOrder)];
  if (
    Math.hypot(position.x - destination.x, position.z - destination.z) > 1.15
  ) {
    return {
      ...state,
      notice: `Mang ly đến ${destination.label.toLowerCase()} để giao đúng khách.`,
    };
  }
  return serveCurrentDrink(state);
}
