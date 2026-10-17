import type { GameState } from '../types';
import { getRememberedGreetingChoice, getUnresolvedRememberedComplaint, hasRepeatedRememberedComplaint } from './rememberedCustomer';

export const REMEMBERED_SAMPLE_COST = 3000;
const sampleId = (orderId: string) => 'remembered-sample:' + encodeURIComponent(orderId);

export function hasOfferedRememberedSample(game: GameState): boolean {
  return Boolean(game.currentOrder &&
    game.relationshipRewardIds.includes(sampleId(game.currentOrder.id)));
}

/** A voluntary, clearly priced taste sample. It never changes the ordered drink. */
export function canOfferRememberedSample(game: GameState): boolean {
  return Boolean(game.phase === 'open' && game.currentOrder &&
    getRememberedGreetingChoice(game) === 'greet' &&
    getUnresolvedRememberedComplaint(game) &&
    !hasRepeatedRememberedComplaint(game) &&
    !hasOfferedRememberedSample(game) && !game.draft.sealed &&
    game.cash >= REMEMBERED_SAMPLE_COST &&
    game.city.energy >= 1 && game.city.minutes + 3 <= 1260);
}

/** Money/time/energy are charged once. Trust is earned only on real correct delivery. */
export function offerRememberedSample(game: GameState): GameState {
  if (!canOfferRememberedSample(game)) return game;
  const order = game.currentOrder!;
  const complaint = getUnresolvedRememberedComplaint(game)!;
  const id = sampleId(order.id);
  const text = 'Bạn mời ' + complaint.customerName +
    ' thử một ngụm trà mẫu trước khi pha đơn mới. Khách sẽ đánh giá ly được giao, không chỉ lời mời.';
  return {
    ...game,
    cash: game.cash - REMEMBERED_SAMPLE_COST,
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: order.customerId, customerName: complaint.customerName,
      title: 'Mời khách thử trà mẫu', text, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    city: {
      ...game.city, minutes: game.city.minutes + 3, energy: game.city.energy - 1,
      journal: ['Ngày ' + game.day + ' · Mời trà mẫu, tốn 3.000đ nguyên liệu; chưa phục hồi lòng tin.',
        ...game.city.journal].slice(0, 24),
    },
    notice: text,
  };
}
