import { describe, expect, it } from 'vitest';
import { createInitialState, startDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { deliverDrink, deliveryFor, PLACES } from '../service';

function ready(breakfast: 'cook' | 'skip' = 'skip') {
  return startDay(chooseBreakfast(wakeMorning(createInitialState()), breakfast));
}
function deliver(game: ReturnType<typeof ready>) {
  const order = game.currentOrder!;
  return deliverDrink({ ...game, draft: { ...game.draft, sealed: true } },
    true, PLACES[deliveryFor(order)], order.id);
}

describe('fatigue after physical tea delivery', () => {
  it('uses breakfast satiety and charges only after a completed order', () => {
    const full = ready('cook'), hungry = ready('skip');
    const fed = deliver(full), unfed = deliver(hungry);
    expect(fed.served).toBe(full.served + 1);
    expect(unfed.served).toBe(hungry.served + 1);
    expect(fed.morning.satiety).toBe(full.morning.satiety - 8);
    expect(unfed.morning.satiety).toBe(hungry.morning.satiety - 8);
    expect(fed.city.energy).toBe(full.city.energy - 1);
    expect(unfed.city.energy).toBe(hungry.city.energy - 4);
  });

  it('never drains stamina for an unsealed, wrong or repeated delivery', () => {
    const game = ready();
    const order = game.currentOrder!;
    const destination = PLACES[deliveryFor(order)];
    const unsealed = deliverDrink(game, true, destination, order.id);
    expect(unsealed.city.energy).toBe(game.city.energy);
    expect(unsealed.served).toBe(game.served);
    expect(deliverDrink(game, true, destination, 'invalid-id')).toBe(game);
    const delivered = deliver(game);
    const loaded = JSON.parse(JSON.stringify(delivered)) as typeof delivered;
    expect(deliverDrink(loaded, true, destination, order.id)).toBe(loaded);
    expect(loaded.morning.satiety).toBe(delivered.morning.satiety);
  });

  it('retains the final-order summary and the energy cost', () => {
    const game = { ...ready(), targetOrders: 1 };
    const delivered = deliver(game);
    expect(delivered.phase).toBe('summary');
    expect(delivered.summary?.orders).toBe(1);
    expect(delivered.city.energy).toBe(game.city.energy - 4);
    expect(delivered.dailyRevenue).toBeGreaterThan(0);
  });
});
