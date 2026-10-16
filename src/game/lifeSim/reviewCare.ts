import type { GameState, Review } from '../types';

export type ReviewCareChoice = 'refund' | 'message' | 'space';

const OPTIONS: Record<ReviewCareChoice, { cash: number; minutes: number; energy: number; bond: number; goodwill: number }> = {
  refund: { cash: 10000, minutes: 5, energy: 1, bond: 2, goodwill: 1 },
  message: { cash: 0, minutes: 5, energy: 0, bond: 1, goodwill: 1 },
  space: { cash: 0, minutes: 0, energy: 0, bond: 0, goodwill: 0 },
};

export const REVIEW_CARE_OPTIONS = OPTIONS;

/** A complaint about toppings or insufficient sweetness is not a low-sugar preference. */
export function isLowSugarFeedback(review: Review): boolean {
  if (review.stars > 3 || /không đủ ngọt|thiếu đường|nhạt quá|not sweet enough/i.test(review.text)) return false;
  return /quá ngọt|hơi ngọt|ngọt quá|trà ngọt|ít đường|ít ngọt|bớt đường|giảm đường|too sweet|less sugar|low sugar/i.test(review.text);
}

function keyPrefix(reviewId: string) {
  return 'review-care:' + encodeURIComponent(reviewId) + ':';
}

export function getReviewCareDecision(game: GameState, reviewId: string): { day: number; choice: ReviewCareChoice } | null {
  const prefix = keyPrefix(reviewId);
  const id = game.relationshipRewardIds.find((item) => typeof item === 'string' && item.startsWith(prefix));
  if (!id) return null;
  const [dayString, choice] = id.slice(prefix.length).split(':');
  const day = Number(dayString);
  if (!Number.isSafeInteger(day) || day < 1 || !Object.hasOwn(OPTIONS, choice)) return null;
  return { day, choice: choice as ReviewCareChoice };
}

export function canChooseReviewCare(game: GameState, reviewId: string, choice: ReviewCareChoice): boolean {
  const review = game.reviews.find((item) => item.id === reviewId);
  const option = OPTIONS[choice];
  return Boolean(
    option && review && review.stars <= 3 && review.replyText &&
    game.day >= review.day && game.phase !== 'open' &&
    !getReviewCareDecision(game, reviewId) &&
    game.cash >= option.cash && game.city.energy >= option.energy &&
    (choice === 'space' || game.city.minutes + option.minutes <= 1260),
  );
}

function decisionText(review: Review, choice: ReviewCareChoice) {
  if (choice === 'refund') return `Đã hoàn lại 10.000 ₫ cho ${review.customerName}, hẹn kiểm tra kỹ ${isLowSugarFeedback(review) ? 'độ ngọt' : 'đơn hàng'} lần tới.`;
  if (choice === 'message') return `Đã nhắn riêng cho ${review.customerName}, hỏi rõ món nào cần điều chỉnh.`;
  return `Đã ghi góp ý của ${review.customerName} vào sổ; tôn trọng việc khách chưa muốn trò chuyện.`;
}

/** Pure, idempotent reducer. Existing v3 fields persist the choice without a save schema change. */
export function chooseReviewCare(game: GameState, reviewId: string, choice: ReviewCareChoice): GameState {
  if (!canChooseReviewCare(game, reviewId, choice)) return game;
  const review = game.reviews.find((item) => item.id === reviewId)!;
  const option = OPTIONS[choice];
  const text = decisionText(review, choice);
  const id = `${keyPrefix(review.id)}${game.day}:${choice}`;
  return {
    ...game,
    cash: game.cash - option.cash,
    customerBond: {
      ...game.customerBond,
      [review.customerId]: (game.customerBond[review.customerId] ?? 0) + option.bond,
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: review.customerId, customerName: review.customerName,
      title: 'Chăm sóc khách sau đánh giá', text, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy - option.energy,
      goodwill: game.city.goodwill + option.goodwill,
      journal: [`Ngày ${game.day} · ${text}`, ...game.city.journal].slice(0, 24),
    },
    notice: text,
  };
}


export type ReviewFollowupChoice = 'remember' | 'thank';
const followupKey = (reviewId: string) => 'review-followup:' + encodeURIComponent(reviewId) + ':';

export function getReviewFollowupChoice(game: GameState, reviewId: string): ReviewFollowupChoice | null {
  const prefix = followupKey(reviewId);
  const recorded = game.relationshipRewardIds.find(id => typeof id === 'string' && id.startsWith(prefix));
  const choice = recorded?.slice(prefix.length);
  return choice === 'remember' || choice === 'thank' ? choice : null;
}

export function canRespondToReviewFollowup(game: GameState, reviewId: string, choice: ReviewFollowupChoice): boolean {
  const decision = getReviewCareDecision(game, reviewId);
  if (!decision || game.day !== decision.day + 1 || game.phase === 'open') return false;
  if (!game.reviews.some(review => review.id === reviewId) || getReviewFollowupChoice(game, reviewId)) return false;
  if (choice === 'thank') return true;
  // Only customers who discussed sweetness gave consent to record this preference.
  return choice === 'remember' && decision.choice !== 'space' &&
    game.city.energy >= 1 && game.city.minutes + 5 <= 1260;
}

/** Once-only customer response on the next day, stored in save-v3's reward ledger. */
export function respondToReviewFollowup(game: GameState, reviewId: string, choice: ReviewFollowupChoice): GameState {
  if (!canRespondToReviewFollowup(game, reviewId, choice)) return game;
  const review = game.reviews.find(item => item.id === reviewId)!;
  const remember = choice === 'remember';
  const text = remember
    ? (isLowSugarFeedback(review)
      ? 'Đã ghi lại sở thích ít ngọt của ' + review.customerName + ' cho lần ghé tới.'
      : 'Đã ghi lại góp ý về lần phục vụ của ' + review.customerName + ' cho lần ghé tới.')
    : 'Đã cảm ơn ' + review.customerName + ' vì góp ý chân thành.';
  const id = followupKey(reviewId) + choice;
  return {
    ...game,
    customerBond: {
      ...game.customerBond,
      [review.customerId]: (game.customerBond[review.customerId] ?? 0) + (remember ? 1 : 0),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id],
    storyLog: [{
      id, customerId: review.customerId, customerName: review.customerName,
      title: 'Hồi âm khách ngày mới', text, day: game.day, rewardFans: 0,
    }, ...game.storyLog].slice(0, 24),
    city: {
      ...game.city,
      minutes: game.city.minutes + (remember ? 5 : 0),
      energy: game.city.energy - (remember ? 1 : 0),
      journal: ['Ngày ' + game.day + ' · ' + text, ...game.city.journal].slice(0, 24),
    },
    notice: text,
  };
}

export function getReviewCareCallbacks(game: GameState): Array<{ id: string; name: string; text: string }> {
  return game.reviews.flatMap((review) => {
    const decision = getReviewCareDecision(game, review.id);
    if (!decision || decision.day + 1 !== game.day) return [];
    const text = decision.choice === 'refund'
      ? (isLowSugarFeedback(review)
        ? 'Mình nhận được tiền hoàn rồi. Cảm ơn tiệm đã xử lý rõ ràng; lần sau mình sẽ thử ít đường hơn.'
        : 'Mình nhận được tiền hoàn rồi. Cảm ơn tiệm đã xử lý rõ ràng; lần tới mình mong đúng đơn hơn.')
      : decision.choice === 'message'
        ? (isLowSugarFeedback(review)
          ? 'Cảm ơn đã hỏi lại. Mình thích trà nhạt hơn một chút, lần tới mình sẽ nói rõ khi đặt.'
          : 'Cảm ơn đã hỏi lại. Lần tới mình mong tiệm làm đúng những gì mình đặt.')
        : 'Mình thấy tiệm đã ghi nhận góp ý. Khi nào tiện mình sẽ ghé lại.';
    return [{ id: review.id, name: review.customerName, text }];
  });
}
