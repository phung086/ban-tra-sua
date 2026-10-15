import type { GameState, Review } from '../types';

export type ReviewCareChoice = 'refund' | 'message' | 'space';

const OPTIONS: Record<ReviewCareChoice, { cash: number; minutes: number; energy: number; bond: number; goodwill: number }> = {
  refund: { cash: 10000, minutes: 5, energy: 1, bond: 2, goodwill: 1 },
  message: { cash: 0, minutes: 5, energy: 0, bond: 1, goodwill: 1 },
  space: { cash: 0, minutes: 0, energy: 0, bond: 0, goodwill: 0 },
};

export const REVIEW_CARE_OPTIONS = OPTIONS;

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
    game.city.minutes + option.minutes <= 1260,
  );
}

function decisionText(review: Review, choice: ReviewCareChoice) {
  if (choice === 'refund') return `Đã hoàn lại 10.000 ₫ cho ${review.customerName}, hẹn kiểm tra kỹ độ ngọt lần tới.`;
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

export function getReviewCareCallbacks(game: GameState): Array<{ id: string; name: string; text: string }> {
  return game.reviews.flatMap((review) => {
    const decision = getReviewCareDecision(game, review.id);
    if (!decision || decision.day + 1 !== game.day) return [];
    const text = decision.choice === 'refund'
      ? 'Mình nhận được tiền hoàn rồi. Cảm ơn tiệm đã xử lý rõ ràng; lần sau mình sẽ thử ít đường hơn.'
      : decision.choice === 'message'
        ? 'Cảm ơn đã hỏi lại. Mình thích trà nhạt hơn một chút, lần tới mình sẽ nói rõ khi đặt.'
        : 'Mình thấy tiệm đã ghi nhận góp ý. Khi nào tiện mình sẽ ghé lại.';
    return [{ id: review.id, name: review.customerName, text }];
  });
}
