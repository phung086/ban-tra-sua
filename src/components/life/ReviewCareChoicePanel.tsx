import type { Dispatch, SetStateAction } from 'react';
import type { GameState, Review } from '../../game/types';
import { canChooseReviewCare, chooseReviewCare, getReviewCareDecision, type ReviewCareChoice } from '../../game/lifeSim/reviewCare';

const choices: [ReviewCareChoice, string][] = [
  ['refund', 'Hoàn lại 10.000 ₫ · 5 phút · +2 thân thiết'],
  ['message', 'Hỏi lại khách · miễn phí · 5 phút · +1 thân thiết'],
  ['space', 'Ghi nhận và để khách yên · miễn phí'],
];

export function ReviewCareChoicePanel({ game, review, onGame }: {
  game: GameState; review: Review; onGame: Dispatch<SetStateAction<GameState>>;
}) {
  if (review.stars > 3 || !review.replyText) return null;
  const done = getReviewCareDecision(game, review.id);
  if (done) return <p className="life-review-care-complete">✓ Đã xử lý góp ý ngày {done.day}.</p>;
  return <section className="life-review-care" aria-label={`Chăm sóc khách ${review.customerName}`}>
    <strong>Khách chưa hài lòng — mình xử lý thế nào?</strong>
    <div className="life-review-care-actions">
      {choices.map(([choice, label]) => <button key={choice} type="button"
        disabled={!canChooseReviewCare(game, review.id, choice)}
        onClick={() => onGame(current => chooseReviewCare(current, review.id, choice))}>{label}</button>)}
    </div>
  </section>;
}
