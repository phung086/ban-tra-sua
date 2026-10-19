import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import { cityWeather } from '../../game/city';
import {
  UMBRELLA_OPTIONS, canChooseUmbrella, chooseUmbrella,
  getUmbrellaCallback, getUmbrellaChoice,
  type UmbrellaChoice,
} from '../../game/lifeSim/rainUmbrella';

export function RainUmbrellaPanel({ game, onGame }: {
  game: GameState; onGame: Dispatch<SetStateAction<GameState>>;
}) {
  const callback = getUmbrellaCallback(game);
  if (game.phase === 'prep') return callback ? <section className="life-morning" aria-label="Lời nhắn của bác Minh">
    <span className="life-morning-label">SÁNG MƯA · NGÀY {game.day}</span>
    <p role="status">☂️ {callback}</p>
  </section> : null;
  if (game.phase !== 'summary' || game.summary?.day !== game.day || !cityWeather(game.day + 1).rain)
    return null;
  const choice = getUmbrellaChoice(game);
  return <section className="life-morning" aria-label="Chuẩn bị ô cho ngày mưa">
    <span className="life-morning-label">CUỐI CA · DỰ BÁO NGÀY {game.day + 1}</span>
    <h3>☂️ Mai mưa, bác Minh hỏi có cần mượn ô không?</h3>
    <p>{choice ? UMBRELLA_OPTIONS[choice].text :
      'Mượn ô không tốn tiền, nhưng mất 5 phút và 1 sức để nhận. Ngày mai đi bộ trong phố chỉ tốn một nửa sức. Không mượn vẫn chơi bình thường.'}</p>
    {choice ? <p role="status">✓ Đã ghi vào sổ. Bác Minh sẽ nhắn lại sáng mai.</p> :
      <div className="life-morning-options">
        {(['borrow', 'message'] as UmbrellaChoice[]).map(id => {
          const option = UMBRELLA_OPTIONS[id];
          return <button type="button" key={id} className="life-morning-option"
            disabled={!canChooseUmbrella(game, id)}
            onClick={() => onGame(state => chooseUmbrella(state, id))}>
            <strong>{option.label}</strong>
            <small>Miễn phí · {option.minutes} phút · -{option.energy} sức · +{option.goodwill} thiện cảm</small>
          </button>;
        })}
      </div>}
    {!choice && !canChooseUmbrella(game, 'borrow') &&
      <p role="status">Hết giờ hoặc đã mệt, bạn vẫn có thể nhắn bác miễn phí rồi đi ngủ.</p>}
  </section>;
}
