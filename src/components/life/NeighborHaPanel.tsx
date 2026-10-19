import type { GameState } from '../../game/types';
import { HA_OPTIONS, canVisitHa, chooseHa, haChoice, haYesterdayReply, type HaChoice } from '../../game/lifeSim/neighborHa';
import { morningActionBlock } from '../../game/lifeSim/morningAction';

/** A text-first, touch-friendly neighbor interaction in the existing morning panel. */
export function NeighborHaPanel({ game, onGame }: { game: GameState; onGame: (next: GameState) => void }) {
  if (game.phase !== 'prep' || game.morning.step !== 'finished') return null;
  const chosen = haChoice(game);
  const callback = haYesterdayReply(game);
  if (!chosen && !callback && game.morning.satiety >= 60) return null;
  const reply = game.storyLog.find(item => item.id === `neighbor-ha-${game.day}`)?.text;
  return <section className="life-lan-invite" aria-label="Bữa cơm của chị Hà">
    <p className="life-morning-prompt">🍚 Bữa cơm của chị Hà ở đầu ngõ</p>
    {callback && <p className="life-lan-reply" aria-live="polite">💌 {callback}</p>}
    {chosen ? <p className="life-lan-reply" role="status">
      ✓ {reply ?? (chosen === 'help' ? 'Đã giúp chị Hà và ăn cơm hôm nay.' : 'Đã trò chuyện cùng chị Hà hôm nay.')}
      {' '}Độ no {game.morning.satiety}/100 · Đã lưu, không nhận hai lần.
    </p> : canVisitHa(game) ? <>
      <p>Hôm nay chưa no bụng. Chị Hà đang dọn quán cơm; mình có thể phụ một tay để ăn bữa nóng, hoặc chỉ ngồi nói chuyện.</p>
      <div className="life-morning-options">
        {(['help', 'chat'] as HaChoice[]).map(choice => {
          const option = HA_OPTIONS[choice];
          const blocked = morningActionBlock(game, 0, option.minutes, option.energy);
          return <button key={choice} type="button" className="life-morning-option" disabled={!!blocked}
            onClick={() => onGame(chooseHa(game, choice))}>
            <span aria-hidden="true">{choice === 'help' ? '🥬' : '💬'}</span>
            <strong>{option.label}</strong>
            <small>{option.minutes} phút · −{option.energy} sức{option.satiety ? ` · +${option.satiety} độ no` : ''}</small>
            <b>Miễn phí</b>
            {blocked && <small>{blocked}</small>}
          </button>;
        })}
      </div>
      <small>Tùy chọn · Không cần trả tiền hay bắt buộc nhận lời.</small>
    </> : null}
  </section>;
}
