import type { GameState } from '../../game/types';
import { canChooseSocialMorning, chooseSocialMorning, getSocialMorningCallback, getSocialMorningDecision, getSocialMorningEvent } from '../../game/lifeSim/socialMorning';
import { canChooseSocialPromise, chooseSocialPromise, getSocialPromise, getSocialPromiseCallback, getSocialPromiseChoice } from '../../game/lifeSim/socialPromise';

export function SocialMorningPanel({ game, onGame }: { game: GameState; onGame: (game: GameState) => void }) {
  const event = getSocialMorningEvent(game);
  const callback = getSocialMorningCallback(game);
  const decision = getSocialMorningDecision(game);
  const promise = getSocialPromise(game);
  const promiseDecision = promise ? getSocialPromiseChoice(game, promise) : null;
  const promiseCallback = getSocialPromiseCallback(game);
  if (!event && !callback && !promise && !promiseCallback) return null;
  return <section className="life-morning" aria-label="Tin nhắn người thân và bạn bè">
    {callback && <p aria-live="polite">💌 Hôm nay có lời nhắn: {callback}</p>}
    {promiseCallback && <p aria-live="polite">💌 Lời nhắn về cuộc hẹn: {promiseCallback}</p>}
    {promise && game.morning.step === 'finished' && <>
      <span className="life-morning-label">LỜI HỨA · NGÀY {game.day}</span>
      <h3>{promise.title}</h3>
      <p>{promiseDecision ? promise[promiseDecision].reply : promise.prompt}</p>
      {promiseDecision ? <p role="status">✓ Đã ghi lại quyết định về lời hẹn.</p> :
        <div className="life-morning-options">
          {(['keep', 'postpone'] as const).map(choice => {
            const outcome = promise[choice];
            return <button type="button" className="life-morning-option" key={choice}
              disabled={!canChooseSocialPromise(game, choice)}
              onClick={() => onGame(chooseSocialPromise(game, choice))}>
              <strong>{outcome.label}</strong>
              <small>{outcome.minutes} phút · {outcome.cost.toLocaleString('vi-VN')} ₫ · {outcome.energy >= 0 ? '+' : ''}{outcome.energy} sức · +{outcome.goodwill} thiện cảm</small>
            </button>;
          })}
        </div>}
      {!promiseDecision && !canChooseSocialPromise(game, 'keep') &&
        <p role="status">Chưa đủ tiền, sức hoặc đã qua giờ. Bạn vẫn có thể nhắn lại miễn phí.</p>}
    </>}
    {event && game.morning.step === 'finished' && <>
      <span className="life-morning-label">GIA ĐÌNH & BẠN BÈ · NGÀY {game.day}</span>
      <h3><span aria-hidden="true">{event.emoji} </span>{event.title}</h3>
      <p>{decision ? event[decision].reply : event.prompt}</p>
      {decision ? <p role="status">✓ Đã lưu cuộc trò chuyện. {event.character} sẽ nhớ lời bạn nói.</p> :
        <div className="life-morning-options">
          {(['visit', 'reply'] as const).map(choice => {
            const outcome = event[choice];
            return <button type="button" className="life-morning-option" key={choice}
              disabled={!canChooseSocialMorning(game, choice)}
              onClick={() => onGame(chooseSocialMorning(game, choice))}>
              <strong>{outcome.label}</strong>
              <small>{outcome.minutes} phút · {outcome.cost.toLocaleString('vi-VN')} ₫ · {outcome.energy >= 0 ? '+' : ''}{outcome.energy} sức · +{outcome.goodwill} thiện cảm{outcome.fans ? ` · +${outcome.fans} fan` : ''}</small>
            </button>;
          })}
        </div>}
      {!decision && !canChooseSocialMorning(game, 'visit') &&
        <p role="status">Đã quá giờ hẹn, thiếu tiền hoặc cần nghỉ ngơi. Bạn vẫn có thể nhắn lại miễn phí.</p>}
    </>}
  </section>;
}
