import type { GameState } from '../../game/types';
import {
  canChooseStreetMoment, chooseStreetMoment, getStreetMoment,
  getStreetMomentCallback, getStreetMomentChoice,
} from '../../game/lifeSim/streetMoment';

export function StreetMomentPanel({ game, onGame }: {
  game: GameState; onGame: (game: GameState) => void;
}) {
  const moment = getStreetMoment(game);
  const callback = getStreetMomentCallback(game);
  const decision = getStreetMomentChoice(game);
  if (!moment && !callback) return null;

  return <section className="life-morning" aria-label="Góc phố sáng nay">
    {callback && <p aria-live="polite">💌 Lời nhắn hôm nay: {callback}</p>}
    {moment && game.morning.step === 'finished' && <>
      <span className="life-morning-label">GÓC PHỐ AN HÒA · NGÀY {game.day} · {moment.character}</span>
      <h3>{moment.title}</h3>
      <p>{decision ? moment[decision].reply : moment.prompt}</p>
      {decision ? <p role="status">✓ Đã ghi vào nhật ký. Hàng xóm sẽ nhớ chuyện hôm nay.</p> :
        <div className="life-morning-options">
          {(['help', 'message'] as const).map(choice => {
            const option = moment[choice];
            return <button key={choice} type="button" className="life-morning-option"
              disabled={!canChooseStreetMoment(game, choice)}
              onClick={() => onGame(chooseStreetMoment(game, choice))}>
              <strong>{option.label}</strong>
              <small>{option.minutes} phút · {option.energy} sức · +{option.goodwill} thiện cảm
                {option.fans > 0 ? ` · +${option.fans} fan` : ''} · miễn phí</small>
            </button>;
          })}
        </div>}
      {!decision && !canChooseStreetMoment(game, 'help') &&
        <p role="status">Đã qua giờ hẹn hoặc chưa đủ sức. Bạn vẫn có thể nhắn tin miễn phí.</p>}
    </>}
  </section>;
}
