import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import {
  getReviewCareCallbacks, getReviewCareDecision, getReviewFollowupChoice,
  canRespondToReviewFollowup, respondToReviewFollowup,
} from '../../game/lifeSim/reviewCare';

export function ReviewCareCallbacks({ game, onGame }: {
  game: GameState; onGame: Dispatch<SetStateAction<GameState>>;
}) {
  const messages = getReviewCareCallbacks(game);
  if (!messages.length) return null;
  return <section className="life-review-care-callbacks" role="region" aria-label="Tin nhắn khách ngày mới">
    <strong>💌 Khách nhắn lại sáng nay</strong>
    {messages.map(item => {
      const choice = getReviewFollowupChoice(game, item.id);
      const preferenceShared = getReviewCareDecision(game, item.id)?.choice !== 'space';
      return <div className="life-review-followup" key={item.id}>
        <p><b>{item.name}:</b> {item.text}</p>
        {choice ? <small role="status">✓ {choice === 'remember'
          ? 'Đã ghi nhớ sở thích ít ngọt cho lần ghé sau.'
          : 'Đã cảm ơn và tôn trọng ý khách.'}</small> :
          <div className="life-review-followup-actions">
            {preferenceShared && <button type="button" disabled={!canRespondToReviewFollowup(game, item.id, 'remember')}
              onClick={() => onGame(current => respondToReviewFollowup(current, item.id, 'remember'))}>
              Ghi nhớ ít ngọt · 5 phút · 1 năng lượng · +1 thân thiết
            </button>}
            <button type="button" disabled={!canRespondToReviewFollowup(game, item.id, 'thank')}
              onClick={() => onGame(current => respondToReviewFollowup(current, item.id, 'thank'))}>
              Cảm ơn khách · miễn phí
            </button>
          </div>}
      </div>;
    })}
  </section>;
}
