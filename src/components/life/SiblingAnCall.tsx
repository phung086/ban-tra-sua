import { formatMoney } from '../../game/engine';
import { AN_CALL_CHOICES, answerAnCall, canAnswerAnCall, canChooseAnCall, getAnCallReceipt, getAnCallReply, type AnCallChoice } from '../../game/lifeSim/siblingAn';
import type { GameState } from '../../game/types';

const choices: AnCallChoice[] = ['fare', 'guide', 'later'];

/** Optional family interaction mounted in the real pre-shop morning flow. */
export function SiblingAnCall({ game, onGame }: { game: GameState; onGame: (next: GameState) => void }) {
  const available = canAnswerAnCall(game);
  const reply = getAnCallReply(game);
  const receipt = getAnCallReceipt(game);
  if (!available && !reply && !receipt) return null;
  return <section className="life-an-call" aria-label="Tin nhắn từ em An">
    <div className="life-an-call-heading">
      <span aria-hidden="true">📱</span>
      <div><h4>Em An · Chuyện xe buýt đầu tuần</h4>
        <small>{available ? 'Một tin nhắn cần bạn quyết định' : 'An vẫn nhớ cuộc trò chuyện'}</small></div>
    </div>
    {available ? <>
      <p>An nhắn: “Em lỡ chuyến xe đi học, giờ hơi cuống. Có cách nào không?”</p>
      <div className="life-an-call-actions">
        {choices.map(choice => {
          const option = AN_CALL_CHOICES[choice];
          const allowed = canChooseAnCall(game, choice);
          return <button key={choice} type="button" disabled={!allowed}
            onClick={() => onGame(answerAnCall(game, choice))}>
            <strong>{option.label}</strong>
            <small>{option.cost ? formatMoney(option.cost) : 'Miễn phí'} · {option.minutes} phút{option.energy ? ` · -${option.energy} sức` : ''}</small>
            {!allowed && <small>Không đủ tài nguyên</small>}
          </button>;
        })}
      </div>
    </> : <p className="life-an-call-reply" role="status">{reply ?? receipt}</p>}
  </section>;
}
