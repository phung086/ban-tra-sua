import type { GameState } from '../types';
import { getReviewCareDecision, getReviewFollowupChoice } from './reviewCare';

/** A preference is learned only from a customer's explicit next-day response. */
export function hasRememberedLowSugar(game: GameState, customerId: string): boolean {
  if (!customerId) return false;
  return game.reviews.some(review => {
    if (review.customerId !== customerId || review.day >= game.day) return false;
    const decision = getReviewCareDecision(game, review.id);
    return (decision?.choice === 'refund' || decision?.choice === 'message') &&
      getReviewFollowupChoice(game, review.id) === 'remember';
  });
}

const greetingId = (orderId: string) => 'remembered-greeting:' + encodeURIComponent(orderId);

export function hasGreetedRememberedCustomer(game: GameState): boolean {
  return Boolean(game.currentOrder && game.relationshipRewardIds.includes(greetingId(game.currentOrder.id)));
}

/** Greeting is optional and never alters the customer's requested recipe. */
export function canGreetRememberedCustomer(game: GameState): boolean {
  const order = game.currentOrder;
  return Boolean(order && game.phase === 'open' &&
    hasRememberedLowSugar(game, order.customerId) &&
    !hasGreetedRememberedCustomer(game) &&
    game.city.energy >= 1 && game.city.minutes + 2 <= 1260);
}

/** Pure and idempotent; save-v3 already persists the relationship ledger. */
export function greetRememberedCustomer(game: GameState): GameState {
  if (!canGreetRememberedCustomer(game)) return game;
  const order = game.currentOrder!;
  const id = greetingId(order.id);
  const notice = 'Bạn nhớ khách thích ít ngọt. Hãy pha đúng mức đường khách đặt hôm nay nhé!';
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    customerBond: {
      ...game.customerBond,
      [order.customerId]: (game.customerBond[order.customerId] ?? 0) + 1,
    },
    city: {
      ...game.city,
      minutes: game.city.minutes + 2,
      energy: game.city.energy - 1,
      goodwill: game.city.goodwill + 1,
      journal: [`Ngày ${game.day} · Chào khách quen và nhớ sở thích ít ngọt.`, ...game.city.journal].slice(0, 24),
    },
    notice,
  };
}
