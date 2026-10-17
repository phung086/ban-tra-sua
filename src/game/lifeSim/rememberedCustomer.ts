import type { GameState } from '../types';
import { getReviewCareDecision, getReviewFollowupChoice, isLowSugarFeedback } from './reviewCare';
import { getRememberedCupMismatch } from './rememberedCupCheck';

/** Latest consented review wins even if imported save arrays are unordered. */
export function getLatestRememberedReview(game: GameState, customerId: string): GameState['reviews'][number] | null {
  if (!customerId) return null;
  return game.reviews.reduce<GameState['reviews'][number] | null>((latest, review) => {
    if (review.customerId !== customerId || review.day >= game.day) return latest;
    const decision = getReviewCareDecision(game, review.id);
    if (!decision || (decision.choice !== 'refund' && decision.choice !== 'message') ||
        getReviewFollowupChoice(game, review.id) !== 'remember') return latest;
    return !latest || review.day > latest.day ? review : latest;
  }, null);
}

/** Compatibility name: any consented feedback makes this a remembered customer. */
export function hasRememberedLowSugar(game: GameState, customerId: string): boolean {
  return getLatestRememberedReview(game, customerId) !== null;
}

/** Do not turn a remembered topping/timing complaint into an invented sugar preference. */
export function shouldMentionLowSugar(game: GameState, customerId: string, sugar: number): boolean {
  if (!customerId || sugar > 50) return false;
  const latest = getLatestRememberedReview(game, customerId);
  return latest !== null && isLowSugarFeedback(latest);
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
  const sweetness = shouldMentionLowSugar(game, order.customerId, order.sugar);
  const notice = sweetness
    ? 'Bạn nhớ khách thích ít ngọt. Hãy pha đúng mức đường khách đặt hôm nay nhé!'
    : 'Bạn nhớ góp ý trước đây của khách. Hãy pha đúng đơn hôm nay nhé!';
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
      journal: [`Ngày ${game.day} · ${sweetness ? 'Chào khách quen và nhớ sở thích ít ngọt.' : 'Chào khách quen và ghi nhận góp ý cũ.'}`, ...game.city.journal].slice(0, 24),
    },
    notice,
  };
}

/** The most recent earlier delivery is the source of truth, not an old review. */
export function getPreviousRememberedServiceFeedback(game: GameState): GameState['storyLog'][number] | null {
  const order = game.currentOrder;
  if (!order || !hasRememberedLowSugar(game, order.customerId)) return null;
  // Save migrations and imported journals may not preserve newest-first order.
  // The latest earlier *day* wins; ties keep the first (newest in normal saves).
  return game.storyLog
    .filter(moment =>
      moment.customerId === order.customerId && moment.day < game.day &&
      moment.id.startsWith('remembered-service:') &&
      (moment.title === 'Khách quen góp ý thêm' || moment.title === 'Khách quen hài lòng'))
    .reduce<GameState['storyLog'][number] | null>(
      (latest, moment) => !latest || moment.day > latest.day ? moment : latest, null);
}

export function getUnresolvedRememberedComplaint(game: GameState): GameState['storyLog'][number] | null {
  const latest = getPreviousRememberedServiceFeedback(game);
  return latest?.title === 'Khách quen góp ý thêm' ? latest : null;
}

/** A broken promise is linked to the previous delivery, not a translated dialogue string. */
export function getBrokenRememberedPromise(game: GameState): GameState['storyLog'][number] | null {
  const complaint = getUnresolvedRememberedComplaint(game);
  if (!complaint) return null;
  const previousOrderId = complaint.id.slice('remembered-service:'.length);
  return game.relationshipRewardIds.includes('remembered-promise:' + previousOrderId) ? complaint : null;
}

function apologyId(game: GameState): string | null {
  const broken = getBrokenRememberedPromise(game);
  return broken ? 'remembered-apology:' + broken.id.slice('remembered-service:'.length) : null;
}

export function hasApologizedForBrokenPromise(game: GameState): boolean {
  const id = apologyId(game);
  return id !== null && game.relationshipRewardIds.includes(id);
}

export function canApologizeForBrokenPromise(game: GameState): boolean {
  return Boolean(game.phase === 'open' && game.currentOrder &&
    getRememberedGreetingChoice(game) === 'greet' &&
    getBrokenRememberedPromise(game) &&
    !hasApologizedForBrokenPromise(game) &&
    game.city.energy >= 1 && game.city.minutes + 2 <= 1260);
}

/** Voluntary, one-time trust repair; never changes money or today's recipe. */
export function apologizeForBrokenPromise(game: GameState): GameState {
  if (!canApologizeForBrokenPromise(game)) return game;
  const broken = getBrokenRememberedPromise(game)!;
  const id = apologyId(game)!;
  const customerId = game.currentOrder!.customerId;
  const text = 'Bạn xin lỗi vì đã hứa kiểm tra ly trà nhưng giao sai. ' +
    broken.customerName + ': “Mình ghi nhận lời xin lỗi. Mong ly hôm nay đúng đơn nhé.”';
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    customerBond: {
      ...game.customerBond,
      [customerId]: (game.customerBond[customerId] ?? 0) + 1,
    },
    storyLog: [{
      id, customerId, customerName: broken.customerName,
      title: 'Xin lỗi vì thất hứa', text, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    city: {
      ...game.city,
      minutes: game.city.minutes + 2,
      energy: game.city.energy - 1,
      goodwill: game.city.goodwill + 1,
      journal: ['Ngày ' + game.day + ' · Xin lỗi khách vì lời hứa chưa giữ được.', ...game.city.journal].slice(0, 24),
    },
    notice: text,
  };
}

/** First return: ask about a consented review; later visits: use the latest real delivery.
 * A satisfied delivery closes the issue, so an older review cannot reopen it.
 */
export function getRememberedClarificationSource(game: GameState): { text: string; customerName: string; day: number } | null {
  const order = game.currentOrder;
  if (!order) return null;
  const previous = getPreviousRememberedServiceFeedback(game);
  if (previous) return previous.title === 'Khách quen góp ý thêm' ? previous : null;
  return getLatestRememberedReview(game, order.customerId);
}

const clarificationId = (orderId: string) => 'remembered-clarify:' + encodeURIComponent(orderId);
const promiseId = (orderId: string) => 'remembered-promise:' + encodeURIComponent(orderId);

/** Promise is voluntary; actual delivery decides the outcome. */
export function hasPromisedRememberedCorrection(game: GameState): boolean {
  return Boolean(game.currentOrder &&
    game.relationshipRewardIds.includes(promiseId(game.currentOrder.id)));
}

export function canPromiseRememberedCorrection(game: GameState): boolean {
  return Boolean(game.phase === 'open' && game.currentOrder &&
    hasAskedRememberedCustomerAboutComplaint(game) &&
    getRememberedClarificationSource(game) &&
    !hasPromisedRememberedCorrection(game) &&
    !game.draft.sealed &&
    game.city.energy >= 1 &&
    // A promise must leave enough time and energy for the actual cup check.
    game.city.minutes + 3 <= 1260);
}

export function promiseRememberedCorrection(game: GameState): GameState {
  if (!canPromiseRememberedCorrection(game)) return game;
  const order = game.currentOrder!;
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, promiseId(order.id)],
    city: {
      ...game.city,
      minutes: game.city.minutes + 1,
      journal: [`Ngày ${game.day} · Hứa kiểm tra lại ly trà của khách quen.`, ...game.city.journal].slice(0, 24),
    },
    notice: 'Bạn hứa sẽ kiểm tra kỹ ly trà trước khi giao. Giữ lời sẽ tăng sự tin tưởng; làm sai sẽ khiến khách thất vọng.',
  };
}


const cupCheckId = (orderId: string) => 'remembered-cup-check:' + encodeURIComponent(orderId);

/** Persisted one-time quality check for a promise, without adding save fields. */
export function getRememberedPromiseCupCheck(game: GameState): 'ready' | 'fix' | null {
  if (!game.currentOrder) return null;
  const id = cupCheckId(game.currentOrder.id);
  if (game.relationshipRewardIds.includes(id + ':ready')) return 'ready';
  if (game.relationshipRewardIds.includes(id + ':fix')) return 'fix';
  return null;
}

export function canCheckRememberedPromiseCup(game: GameState): boolean {
  return Boolean(game.phase === 'open' && game.currentOrder &&
    hasPromisedRememberedCorrection(game) &&
    !getRememberedPromiseCupCheck(game) &&
    !game.draft.sealed && game.draft.fill >= 15 &&
    game.city.energy >= 1 && game.city.minutes + 2 <= 1260);
}

/** Optional, paid-in-time cup check before sealing. It never silently edits a drink. */
export function checkRememberedPromiseCup(game: GameState): GameState {
  if (!canCheckRememberedPromiseCup(game)) return game;
  const order = game.currentOrder!;
  const mismatch = getRememberedCupMismatch(order, game.draft);
  const result = mismatch ? 'fix' : 'ready';
  const notice = mismatch
    ? 'Soát ly trước khi giao: ' + mismatch + ' Hãy sửa trước khi dập nắp.'
    : 'Soát ly trước khi giao: đúng công thức. Dập nắp rồi giao để giữ lời.';
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, cupCheckId(order.id) + ':' + result],
    city: {
      ...game.city,
      minutes: game.city.minutes + 2,
      energy: game.city.energy - 1,
      journal: [`Ngày ${game.day} · ${notice}`, ...game.city.journal].slice(0, 24),
    },
    notice,
  };
}

export function hasAskedRememberedCustomerAboutComplaint(game: GameState): boolean {
  return Boolean(game.currentOrder &&
    game.relationshipRewardIds.includes(clarificationId(game.currentOrder.id)));
}

/** A voluntary counter conversation: costs time/energy, earns trust, never changes the order. */
export function canAskRememberedCustomerAboutComplaint(game: GameState): boolean {
  return Boolean(game.phase === 'open' && game.currentOrder &&
    getRememberedGreetingChoice(game) === 'greet' &&
    getRememberedClarificationSource(game) &&
    !hasAskedRememberedCustomerAboutComplaint(game) &&
    game.city.energy >= 1 && game.city.minutes + 3 <= 1260);
}

export function askRememberedCustomerAboutComplaint(game: GameState): GameState {
  if (!canAskRememberedCustomerAboutComplaint(game)) return game;
  const order = game.currentOrder!;
  const complaint = getRememberedClarificationSource(game)!;
  const notice = 'Bạn hỏi lại để hiểu rõ góp ý: ' + complaint.text;
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, clarificationId(order.id)],
    storyLog: [{
      id: clarificationId(order.id),
      customerId: order.customerId,
      customerName: complaint.customerName || 'Khách quen',
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
