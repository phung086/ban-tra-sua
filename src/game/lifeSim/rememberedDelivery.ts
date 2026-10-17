import type { GameState, Order } from '../types';
import { getRememberedCupMismatch } from './rememberedCupCheck';
import { getRememberedGreetingChoice, hasRememberedLowSugar, hasAskedRememberedCustomerAboutComplaint, hasPromisedRememberedCorrection, getPreviousRememberedServiceFeedback, hasApologizedForBrokenPromise, getRememberedPromiseCupCheck } from './rememberedCustomer';

function feedback(order: Order, draft: GameState['draft'], score: number): string {
  return getRememberedCupMismatch(order, draft) ??
    (score < 80 ? 'Lần sau bạn pha kỹ hơn nhé.' : '');
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
  const lastDelivery = getPreviousRememberedServiceFeedback(before);
  const previousComplaint = lastDelivery?.title === 'Khách quen góp ý thêm';
  const asked = hasAskedRememberedCustomerAboutComplaint(before);
  const promised = hasPromisedRememberedCorrection(before);
  const checked = promised && getRememberedPromiseCupCheck(before) !== null;
  const apologized = hasApologizedForBrokenPromise(before);
  const message = correction
    ? name + ': “' + (previousComplaint ? 'Mình từng góp ý rồi: ' : '') + correction + '”'
    : previousComplaint
      ? name + (apologized
        ? ': “Cảm ơn tiệm đã xin lỗi. Hôm nay ly đúng đơn rồi, mình yên tâm hơn.”'
        : asked
        ? ': “Cảm ơn tiệm đã hỏi kỹ. Hôm nay ly đúng ý mình rồi!”'
        : ': “Lần trước mình có góp ý, hôm nay ly đã đúng rồi. Cảm ơn tiệm!”')
      : asked ? name + ': “Cảm ơn tiệm đã hỏi kỹ góp ý cũ. Ly hôm nay vừa miệng mình!”'
      : choice === 'greet' ? name + ': “Tiệm còn nhớ mình! Ly này vừa miệng.”' :
        name + ': “Ly hôm nay vừa miệng mình rồi.”';
  // A correct cup is not proof that the promised quality check happened.
  const skippedCheck = promised && !checked && !correction;
  const promiseDelta = promised ? (correction ? -1 : checked ? 1 : 0) : 0;
  const response = message + (apologized && correction
    ? ' Mình đã nghe lời xin lỗi, nhưng ly vẫn chưa đúng.'
    : '') + (promised
    ? (correction
      ? ' Tiệm đã hứa kiểm tra kỹ nhưng vẫn làm sai; mình thất vọng.'
      : checked ? ' Tiệm đã giữ lời kiểm tra kỹ. Lần sau mình sẽ yên tâm hơn.' : '')
    : '') + (skippedCheck
      ? ' Bạn giao đúng ly nhưng đã bỏ qua bước soát ly đã hứa; không nhận thưởng uy tín giữ lời.'
      : '');
  return {
    ...after,
    relationshipRewardIds: [...after.relationshipRewardIds, id],
    customerBond: promiseDelta !== 0 ? {
      ...after.customerBond,
      [order.customerId]: Math.max(0, (after.customerBond[order.customerId] ?? 0) + promiseDelta),
    } : after.customerBond,
    storyLog: [{
      id, customerId: order.customerId, customerName: name,
      title: correction ? 'Khách quen góp ý thêm' : 'Khách quen hài lòng',
      text: response, day: before.day, rewardFans: 0,
    }, ...after.storyLog].slice(0, 24),
    city: {
      ...after.city,
      goodwill: promiseDelta !== 0 ? Math.max(0, after.city.goodwill + promiseDelta) : after.city.goodwill,
      journal: ['Ngày ' + before.day + ' · ' + response, ...after.city.journal].slice(0, 24),
    },
    notice: after.notice + ' 💬 ' + response,
  };
}
