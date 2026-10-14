import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import {
  HA_PACKAGING, canChooseHaPackaging, chooseHaPackaging, getHaPackagingChoice,
  type HaPackagingChoice,
} from '../../game/lifeSim/haPackaging';

const choices: readonly HaPackagingChoice[] = ['buy', 'fold', 'rest'];

export function HaPackagingPanel({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  const selected = getHaPackagingChoice(game);
  return <section className="life-morning" aria-label="Hà chuẩn bị cơm mang đi">
    <span className="life-morning-label">CUỐI NGÀY 7 · GÓC PHỐ</span>
    <h3>Hà chuẩn bị suất cơm mang đi cho sáng mai</h3>
    <p>{selected ? HA_PACKAGING[selected].text :
      'Sau lần làm hòa, Hà kể quán đang thiếu hộp đựng cơm. Bạn có thể góp tiền mua hộp, phụ gấp hộp miễn phí, hoặc báo Hà để về nghỉ. Hà không ép bạn.'}</p>
    {selected ? <p role="status">✓ Hà ghi nhớ lựa chọn. Ngủ sang ngày 8 để nghe Hà phản hồi.</p> :
      <div className="life-morning-options">
        {choices.map(choice => {
          const outcome = HA_PACKAGING[choice];
          const enabled = canChooseHaPackaging(game, choice);
          return <button type="button" key={choice} className="life-morning-option"
            disabled={!enabled} onClick={() => onGame(current => chooseHaPackaging(current, choice))}>
            <strong>{outcome.label}</strong>
            <small>{outcome.cost ? outcome.cost.toLocaleString('vi-VN') + ' ₫' : 'Miễn phí'}
              {' · '}{outcome.minutes} phút
              {' · '}{outcome.energy >= 0 ? '+' : ''}{outcome.energy} sức
              {' · '}+{outcome.goodwill} thiện cảm</small>
          </button>;
        })}
      </div>}
    {!selected && !canChooseHaPackaging(game, 'buy') &&
      <p role="status">Không đủ tiền hoặc quá giờ? Bạn vẫn có thể chọn về nghỉ miễn phí.</p>}
  </section>;
}
