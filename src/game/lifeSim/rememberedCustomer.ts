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
const quietId = (orderId: string) => 'remembered-quiet:' + encodeURIComponent(orderId);

/** The player can acknowledge a regular without mentioning their preference aloud. */
export function getRememberedGreetingChoice(game: GameState): 'greet' | 'quiet' | null {
  const order = game.currentOrder;
  if (!order) return null;
  if (game.relationshipRewardIds.includes(greetingId(order.id))) return 'greet';
  if (game.relationshipRewardIds.includes(quietId(order.id))) return 'quiet';
  return null;
}

export function hasGreetedRememberedCustomer(game: GameState): boolean {
  return getRememberedGreetingChoice(game) === 'greet';
}

/** A free, no-energy fallback for tired players or customers who value discretion. */
export function canKeepRememberedPreferencePrivate(game: GameState): boolean {
  return Boolean(game.currentOrder && game.phase === 'open' &&
    hasRememberedLowSugar(game, game.currentOrder.customerId) &&
    !getRememberedGreetingChoice(game));
}

export function keepRememberedPreferencePrivate(game: GameState): GameState {
  if (!canKeepRememberedPreferencePrivate(game)) return game;
  const id = quietId(game.currentOrder!.id);
  const notice = 'Bạn ghi nhớ góp ý nhưng không nhắc chuyện cũ trước mặt khách. Cứ pha đúng đơn hôm nay.';
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    city: {
      ...game.city,
      journal: [`Ngày ${game.day} · Tôn trọng sự riêng tư của khách quen.`, ...game.city.journal].slice(0, 24),
    },
    notice,
  };
}

/** Greeting is optional and never alters the customer's requested recipe. */
export function canGreetRememberedCustomer(game: GameState): boolean {
  const order = game.currentOrder;
  return Boolean(order && game.phase === 'open' &&
    hasRememberedLowSugar(game, order.customerId) &&
    !getRememberedGreetingChoice(game) &&
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

/** The most recent earlier delivery is the source of truth, not an old review. */
export function getPreviousRememberedServiceFeedback(game: GameState): GameState['storyLog'][number] | null {
  const order = game.currentOrder;
  if (!order || !hasRememberedLowSugar(game, order.customerId)) return null;
  return game.storyLog.find(moment =>
    moment.customerId === order.customerId && moment.day < game.day &&
    moment.id.startsWith('remembered-service:') &&
    (moment.title === 'Khách quen góp ý thêm' || moment.title === 'Khách quen hài lòng')) ?? null;
}

export function getUnresolvedRememberedComplaint(game: GameState): GameState['storyLog'][number] | null {
  const latest = getPreviousRememberedServiceFeedback(game);
  return latest?.title === 'Khách quen góp ý thêm' ? latest : null;
}

const clarificationId = (orderId: string) => 'remembered-clarify:' + encodeURIComponent(orderId);

export function hasAskedRememberedCustomerAboutComplaint(game: GameState): boolean {
  return Boolean(game.currentOrder &&
    game.relationshipRewardIds.includes(clarificationId(game.currentOrder.id)));
}

/** A voluntary counter conversation: costs time/energy, earns trust, never changes the order. */
export function canAskRememberedCustomerAboutComplaint(game: GameState): boolean {
  return Boolean(game.phase === 'open' && game.currentOrder &&
    getRememberedGreetingChoice(game) === 'greet' &&
    getUnresolvedRememberedComplaint(game) &&
    !hasAskedRememberedCustomerAboutComplaint(game) &&
    game.city.energy >= 1 && game.city.minutes + 3 <= 1260);
}

export function askRememberedCustomerAboutComplaint(game: GameState): GameState {
  if (!canAskRememberedCustomerAboutComplaint(game)) return game;
  const order = game.currentOrder!;
  const complaint = getUnresolvedRememberedComplaint(game)!;
  const notice = 'Bạn hỏi lại để hiểu rõ góp ý: ' + complaint.text;
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, clarificationId(order.id)],
    storyLog: [{
      id: clarificationId(order.id),
      customerId: order.customerId,
      customerName: game.reviews.find(review => review.customerId === order.customerId)?.customerName ?? 'Khách quen',
      title: 'Khách quen kể kỹ góp ý',
      text: notice,
      day: game.day,
      rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    customerBond: {
      ...game.customerBond,
      [order.customerId]: (game.customerBond[order.customerId] ?? 0) + 1,
    },
    city: {
      ...game.city,
      minutes: game.city.minutes + 3,
      energy: game.city.energy - 1,
      goodwill: game.city.goodwill + 1,
      journal: ['Ngày ' + game.day + ' · Đã hỏi thêm về góp ý cũ trước khi pha trà.', ...game.city.journal].slice(0, 24),
    },
    notice,
  };
}
