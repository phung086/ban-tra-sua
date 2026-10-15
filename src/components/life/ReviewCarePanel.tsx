import type { GameState } from '../../game/types';
import { getReviewCareCallbacks } from '../../game/lifeSim/reviewCare';

export function ReviewCareCallbacks({ game }: { game: GameState }) {
  const messages = getReviewCareCallbacks(game);
  if (!messages.length) return null;
  return <section aria-label="Tin nhắn khách ngày mới">{messages.map(item => <p key={item.id}><b>{item.name}:</b> {item.text}</p>)}</section>;
}
