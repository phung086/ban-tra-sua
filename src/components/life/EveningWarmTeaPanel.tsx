import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import { EVENING_TEA, canChooseEveningTea, chooseEveningTea,
  getEveningTeaCallback, getEveningTeaChoice, type EveningTeaChoice } from '../../game/lifeSim/eveningWarmTea';

const choices: readonly EveningTeaChoice[] = ['brew', 'talk', 'rest'];
export function EveningWarmTeaPanel({game,onGame}: {
  game: GameState; onGame: Dispatch<SetStateAction<GameState>>;
}) {
  const callback = getEveningTeaCallback(game);
  const visible = game.phase === 'summary' && game.summary?.day === game.day &&
    game.summary.orders > 0 && game.day >= 2 && (game.day-2)%5 === 0;
  if (!visible && !callback) return null;
  const selected = getEveningTeaChoice(game);
  return <section className="life-morning" aria-label="Trà ấm cuối ca">
    {callback && <p role="status">💌 {callback}</p>}
    {visible && <>
      <span className="life-morning-label">GÓC PHỐ · NGÀY {game.day}</span>
      <h3>🍵 Một ly trà ấm cho bác Bình</h3>
      <p>{selected ? 'Đã ghi vào nhật ký. Bác Bình sẽ nhớ lựa chọn này vào sáng mai.' :
        'Bác Bình vẫn dọn lối đi dưới hàng sấu. Bạn muốn pha trà, hỏi thăm hay về nghỉ?'}</p>
      {!selected && <div className="life-morning-options">
        {choices.map(choice => <button type="button" key={choice}
          className="life-morning-option" disabled={!canChooseEveningTea(game,choice)}
          onClick={() => onGame(current => chooseEveningTea(current,choice))}>
          <strong>{EVENING_TEA[choice].label}</strong>
          <small>{choice === 'brew' ? '1 ly M + trà + đường · 8 phút · -2 sức · +2 thiện cảm' :
            choice === 'talk' ? 'Miễn phí · 3 phút · -1 sức · +1 thiện cảm' :
            'Miễn phí · không mất sức'}</small>
        </button>)}
      </div>}
      {!selected && !canChooseEveningTea(game,'brew') &&
        <p role="status">Không đủ nguyên liệu hoặc sức? Bạn vẫn có thể về nghỉ miễn phí.</p>}
    </>}
  </section>;
}
