import { serveCurrentDrink } from "./engine";
import type { GameState, Order } from "./types";
import { CITY_BOUNDS, outdoorsWalkable } from './cityMap';
import {overlapsFootprint,SHOP_FURNITURE,PLAYER_RADIUS,type Footprint} from './collision';

export type Position = { x: number; z: number };
export type Place = "counter" | "table-1" | "table-2" | "door";
export const PLACES: Record<Place, Position & { label: string }> = {
  counter: { x: 0, z: 2.15, label: "Quầy pha chế" },
  "table-1": { x: -2.8, z: -1.35, label: "Bàn 01" },
  "table-2": { x: 2.8, z: -1.35, label: "Bàn 02" },
  door: { x: 0, z: -3.8, label: "Cửa tiệm" },
};

export function deliveryFor(order: Order): Exclude<Place, "door"> {
  const hash = [...order.id].reduce(
    (sum, letter) => sum + letter.charCodeAt(0),
    0,
  );
  return hash % 3 === 0 ? "counter" : hash % 3 === 1 ? "table-1" : "table-2";
}

export function canWalk(position: Position, city = false) {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return false;
  if (city && position.z < -4.3) return outdoorsWalkable(position);
  if (Math.abs(position.x) > 4.3 || position.z < -4.3 || position.z > 3.8)
    return false;
  // Solid counter; its two side aisles connect the workspace and dining room.
  if(SHOP_FURNITURE.some(b=>overlapsFootprint(position,b)))return false;
  return ![-2.8, 2.8].some(
    (x) => Math.hypot(position.x - x, position.z + 2.55) < .65+PLAYER_RADIUS,
  );
}

function avoidsBodies(a:Position,b:Position,dynamic:readonly Footprint[]){
  const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.05));
  for(let i=0;i<=steps;i++)if(dynamic.some(body=>overlapsFootprint({x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps},body)))return false;
  return true;
}
function clearSegment(a: Position, b: Position, city = false,dynamic:readonly Footprint[]=[]) {
  const steps = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / 0.05));
  for (let i = 0; i <= steps; i++)
    if (
      !canWalk({
        x: a.x + ((b.x - a.x) * i) / steps,
        z: a.z + ((b.z - a.z) * i) / steps,
      }, city)||dynamic.some(body=>overlapsFootprint({x:a.x+((b.x-a.x)*i)/steps,z:a.z+((b.z-a.z)*i)/steps},body))
    )
      return false;
  return true;
}

type RouteGrid={points:Position[];available:Set<number>;edges:Map<number,boolean>};
// Buildings and furniture are immutable; reuse their grid and swept edge checks.
// Moving vehicles are filtered afresh for every request and never enter this cache.
const routeGrids=new Map<boolean,RouteGrid>();
export function routeAcross(from: Position, destination: Position, city = false,dynamic:readonly Footprint[]=[]): Position[] {
  const walkable=(p:Position)=>canWalk(p,city)&&!dynamic.some(body=>overlapsFootprint(p,body));
  if (!walkable(from) || !walkable(destination)) return [];
  if (clearSegment(from, destination, city,dynamic)) return [{ ...destination }];
  // A small navigation grid finds paths around BOTH counter and circular tables.
  const width = city ? Math.round((CITY_BOUNDS.maxX-CITY_BOUNDS.minX)/1)+1 : 35,
    height = city ? Math.round((CITY_BOUNDS.maxZ-CITY_BOUNDS.minZ)/1)+1 : 33,
    spacing = city ? 1 : 0.25;
  const createPoint = (index: number): Position => ({
    x: (index % width) * spacing - (city ? -CITY_BOUNDS.minX : 4.25),
    z: Math.floor(index / width) * spacing - (city ? -CITY_BOUNDS.minZ : 4.25),
  });
  let grid=routeGrids.get(city);
  if(!grid){
    const points=Array.from({length:width*height},(_,index)=>createPoint(index));
    grid={points,available:new Set(points.map((_,index)=>index).filter(index=>canWalk(points[index],city))),edges:new Map()};
    routeGrids.set(city,grid);
  }
  const point=(index:number)=>grid!.points[index];
  const available=dynamic.length?new Set([...grid.available].filter(index=>!dynamic.some(body=>overlapsFootprint(point(index),body)))):grid.available;
  const edgeClear=(a:number,b:number)=>{
    const key=Math.min(a,b)*width*height+Math.max(a,b);
    let clear=grid!.edges.get(key);
    if(clear===undefined){clear=clearSegment(point(a),point(b),city);grid!.edges.set(key,clear);}
    return clear&&(!dynamic.length||avoidsBodies(point(a),point(b),dynamic));
  };
  const closest = (p:Position) => {
    const col=Math.round((p.x+(city?-CITY_BOUNDS.minX:4.25))/spacing),row=Math.round((p.z+(city?-CITY_BOUNDS.minZ:4.25))/spacing);
    const candidates:number[]=[];
    for(let radius=0;radius<=4;radius++){
      for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
        const x=col+dx,z=row+dz;if(x<0||x>=width||z<0||z>=height)continue;
        const index=z*width+x;if(available.has(index))candidates.push(index);
      }
      candidates.sort((a,b)=>Math.hypot(point(a).x-p.x,point(a).z-p.z)-Math.hypot(point(b).x-p.x,point(b).z-p.z));
      const nearest=candidates.find(index=>clearSegment(p,point(index),city,dynamic));if(nearest!==undefined)return nearest;
      candidates.length=0;
    }
    return undefined;
  };
  const start = closest(from),
    end = closest(destination);
  if (start === undefined || end === undefined) return [];
  const parents = new Map<number, number>([[start, -1]]),
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
        !edgeClear(current,next)
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
    while (next + 1 < path.length && clearSegment(anchor, path[next + 1], city,dynamic))
      next++;
    smooth.push(path[next]);
    anchor = path[next];
    cursor = next + 1;
  }
  return smooth;
}
export function routeTo(from: Position, to: Place, city = false): Position[] {
  return routeAcross(from, PLACES[to], city);
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
