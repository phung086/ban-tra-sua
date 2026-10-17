import type { GameState } from '../types';
import { getPreviousRememberedServiceFeedback, getRememberedGreetingChoice } from './rememberedCustomer';

/** The saved delivery ledger, not dialogue text, proves a promise was kept. */
export function keptPromiseOnReturn(game: GameState): GameState['storyLog'][number] | null {
  const prior = getPreviousRememberedServiceFeedback(game);
  if (prior?.title !== 'Khách quen hài lòng') return null;
  const orderId = prior.id.slice('remembered-service:'.length);
  const ids = game.relationshipRewardIds;
  return ids.includes('remembered-promise:' + orderId) &&
    (ids.includes('remembered-cup-check:' + orderId + ':ready') ||
      ids.includes('remembered-cup-check:' + orderId + ':fix')) ? prior : null;
}

const thankId = (priorId: string) => 'remembered-thanks:' + priorId.slice('remembered-service:'.length);

export function hasThankedAfterPromise(game: GameState): boolean {
  const prior = keptPromiseOnReturn(game);
  return !!prior && game.relationshipRewardIds.includes(thankId(prior.id));
}

export function canThankAfterPromise(game: GameState): boolean {
  return Boolean(game.phase === 'open' && game.currentOrder &&
    getRememberedGreetingChoice(game) === 'greet' &&
    keptPromiseOnReturn(game) && !hasThankedAfterPromise(game) &&
    game.city.energy >= 1 && game.city.minutes + 2 <= 1260);
}

/** Optional two-minute check-in, once per previous delivery across later visits. */
export function thankAfterPromise(game: GameState): GameState {
  if (!canThankAfterPromise(game)) return game;
  const prior = keptPromiseOnReturn(game)!;
  const id = thankId(prior.id);
  const customerId = game.currentOrder!.customerId;
  const text = 'Bạn hỏi ly hôm trước có ổn không. ' + prior.customerName +
    ': “Ổn hơn nhiều rồi. Cảm ơn tiệm đã giữ lời nhé!”';
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    customerBond: { ...game.customerBond, [customerId]: (game.customerBond[customerId] ?? 0) + 1 },
    storyLog: [{ id, customerId, customerName: prior.customerName,
      title: 'Hỏi thăm sau khi giữ lời', text, day: game.day, rewardFans: 0 },
      ...game.storyLog].slice(0, 24),
    city: { ...game.city, minutes: game.city.minutes + 2, energy: game.city.energy - 1,
      goodwill: game.city.goodwill + 1,
      journal: ['Ngày ' + game.day + ' · Hỏi thăm khách sau khi giữ lời soát ly.',
        ...game.city.journal].slice(0, 24) },
    notice: text,
  };
}
