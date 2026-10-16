import type { Dispatch, SetStateAction } from 'react';
import type { GameState, Review } from '../../game/types';
import { REVIEW_CARE_OPTIONS, canChooseReviewCare, chooseReviewCare, getReviewCareDecision, type ReviewCareChoice } from '../../game/lifeSim/reviewCare';

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
  if (done) return <p className="life-review-care-complete" role="status">✓ Đã xử lý góp ý ngày {done.day}.</p>;
  return <section className="life-review-care" aria-label={`Chăm sóc khách ${review.customerName}`}>
    <strong>Khách chưa hài lòng — mình xử lý thế nào?</strong>
    <div className="life-review-care-actions">
      {choices.map(([choice, label]) => <div className="life-review-care-action" key={choice}>
        <button type="button" disabled={!canChooseReviewCare(game, review.id, choice)}
          onClick={() => onGame(current => chooseReviewCare(current, review.id, choice))}>{label}</button>
        {!canChooseReviewCare(game, review.id, choice) && <small>
          {game.cash < REVIEW_CARE_OPTIONS[choice].cash ? 'Chưa đủ tiền hoàn khách' :
            game.city.minutes + REVIEW_CARE_OPTIONS[choice].minutes > 1260 ? 'Đã muộn, hãy chọn cách khác' :
            game.city.energy < REVIEW_CARE_OPTIONS[choice].energy ? 'Cần nghỉ để hồi sức' :
            'Đang trong ca bán, hãy quay lại sau'}
        </small>}
      </div>)}
    </div>
  </section>;
}
