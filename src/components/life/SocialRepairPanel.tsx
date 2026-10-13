import type { GameState } from '../../game/types';
import { canChooseSocialRepair, chooseSocialRepair, getSocialRepair, getSocialRepairCallback, getSocialRepairChoice } from '../../game/lifeSim/socialRepair';

export function SocialRepairPanel({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  const event = getSocialRepair(game);
  const callback = getSocialRepairCallback(game);
  const choice = event ? getSocialRepairChoice(game, event) : null;
  if (!event && !callback) return null;
  return <section className="life-morning" aria-label="Lời nhắn từ người thân">
    {callback && <p aria-live="polite">💌 {callback}</p>}
    {event && game.morning.step === 'finished' && <>
      <span className="life-morning-label">CHUYỆN CÒN DANG DỞ · NGÀY {game.day}</span>
      <h3>{event.title}</h3>
      <p>{choice ? event[choice].reply : event.prompt}</p>
      {choice ? <p role="status">✓ {event.character} đã nhận được lời hồi đáp.</p> :
        <div className="life-morning-options">
          {(['talk', 'honest'] as const).map(option => {
            const outcome = event[option];
            return <button type="button" className="life-morning-option" key={option}
              disabled={!canChooseSocialRepair(game, option)}
              onClick={() => onGame(chooseSocialRepair(game, option))}>
              <strong>{outcome.label}</strong>
              <small>{outcome.minutes} phút · {outcome.energy >= 0 ? '+' : ''}{outcome.energy} sức · +{outcome.goodwill} thiện cảm · miễn phí</small>
            </button>;
          })}
        </div>}
      {!choice && !canChooseSocialRepair(game, 'talk') &&
        <p role="status">Đã quá giờ hoặc cần nghỉ. Bạn vẫn có thể nhắn miễn phí.</p>}
    </>}
  </section>;
}
