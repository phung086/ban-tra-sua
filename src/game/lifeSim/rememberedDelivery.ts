import type { GameState, Order } from '../types';
import { getRememberedGreetingChoice, hasRememberedLowSugar } from './rememberedCustomer';

function feedback(order: Order, draft: GameState['draft'], score: number): string {
  if (draft.base !== order.base) return 'Bạn pha nhầm nền trà rồi.';
  if (draft.size !== order.size) return 'Kích cỡ ly chưa đúng đơn.';
  if (draft.topping !== order.topping) return 'Topping chưa đúng đơn.';
  if (draft.sugar !== order.sugar) return 'Độ ngọt chưa đúng đơn.';
  if (draft.ice !== order.ice) return 'Mức đá chưa đúng đơn.';
  if (Math.abs(draft.fill - order.targetFill) >= 15) return 'Lượng trà trong ly chưa đúng yêu cầu.';
  if (Math.abs(draft.shake - order.targetShake) >= 15) return 'Độ lắc chưa đúng yêu cầu.';
  if (score < 80) return 'Lần sau bạn pha kỹ hơn nhé.';
  return '';
}

/** One saved NPC callback per actual delivery; no additional rewards. */
export function withRememberedDeliveryReaction(before: GameState, after: GameState): GameState {
  const order = before.currentOrder;
  if (!order || before.phase !== 'open' || after.served !== before.served + 1 ||
      after.lastScore === null || after.lastService?.customerId !== order.customerId ||
      !hasRememberedLowSugar(before, order.customerId)) return after;
  const choice = getRememberedGreetingChoice(before);
  const id = 'remembered-service:' + encodeURIComponent(order.id);
  if (!choice || after.relationshipRewardIds.includes(id)) return after;
  const name = before.reviews.find(r => r.customerId === order.customerId)?.customerName ?? 'Khách quen';
  const correction = feedback(order, before.draft, after.lastScore);
  // A previous real delivery matters on the next visit, not just a generic
  // customer preference. Never change the customer's current recipe.
  // Only the most recent earlier delivery determines whether feedback remains
  // unresolved. A later satisfied delivery closes an older complaint across reloads.
  const lastDelivery = before.storyLog.find(moment =>
    moment.customerId === order.customerId && moment.day < before.day &&
    moment.id.startsWith('remembered-service:') &&
    (moment.title === 'Khách quen góp ý thêm' || moment.title === 'Khách quen hài lòng'));
  const previousComplaint = lastDelivery?.title === 'Khách quen góp ý thêm';
  const message = correction
    ? name + ': “' + (previousComplaint ? 'Mình từng góp ý rồi: ' : '') + correction + '”'
    : previousComplaint
      ? name + ': “Lần trước mình có góp ý, hôm nay ly đã đúng rồi. Cảm ơn tiệm!”'
      : choice === 'greet' ? name + ': “Tiệm còn nhớ mình! Ly này vừa miệng.”' :
        name + ': “Ly hôm nay vừa miệng mình rồi.”';
  return {
    ...after,
    relationshipRewardIds: [...after.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: order.customerId, customerName: name,
      title: correction ? 'Khách quen góp ý thêm' : 'Khách quen hài lòng',
      text: message, day: before.day, rewardFans: 0,
    }, ...after.storyLog].slice(0, 24),
    city: {
      ...after.city,
      journal: ['Ngày ' + before.day + ' · ' + message, ...after.city.journal].slice(0, 24),
    },
    notice: after.notice + ' 💬 ' + message,
  };
}
