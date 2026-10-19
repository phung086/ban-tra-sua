import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import {
  canChooseEveningMother, chooseEveningMother, EVENING_MOTHER_OPTIONS,
  getEveningMotherCallback, getEveningMotherChoice, type EveningMotherChoice,
} from '../../game/lifeSim/eveningMother';
import { motherCallMemory } from '../../game/lifeSim/morning';

const choices: readonly EveningMotherChoice[] = ['call', 'text', 'rest'];

export function EveningMotherCallPanel({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  if (game.phase === 'prep') {
    const callback = getEveningMotherCallback(game);
    return callback ? <section className="life-morning" aria-label="Tin nhắn của mẹ Mai sáng hôm sau">
      <span className="life-morning-label">TIN NHẮN TỪ MẸ · NGÀY {game.day}</span>
      <p role="status">💌 {callback}</p>
    </section> : null;
  }
  if (game.phase !== 'summary' || game.summary?.day !== game.day) return null;
  const selected = getEveningMotherChoice(game);
  return <section className="life-morning" aria-label="Gọi mẹ Mai sau ca">
    <span className="life-morning-label">CUỐI NGÀY · GIA ĐÌNH</span>
    <h3>Hôm nay có kể mẹ nghe chuyện tiệm không?</h3>
    <p>Mẹ Mai vẫn ở đầu dây bên kia. Có thể gọi, nhắn ngắn hoặc nghỉ ngay;
      không lựa chọn nào bắt buộc để đi ngủ.</p>
    {selected ? <p role="status">✓ Đã chọn: {EVENING_MOTHER_OPTIONS[selected].label}.
      Mẹ sẽ nhớ vào sáng mai nếu bạn có liên lạc.</p> :
      <div className="life-morning-options">
        {choices.map(choice => {
          const option = EVENING_MOTHER_OPTIONS[choice];
          return <button type="button" key={choice} className="life-morning-option"
            disabled={!canChooseEveningMother(game, choice)}
            onClick={() => onGame(current => chooseEveningMother(current, choice))}>
            <strong>{option.label}</strong>
            <small>{option.minutes} phút · {option.energy} sức · +{option.bond} gắn kết</small>
            <b>Miễn phí</b>
          </button>;
        })}
      </div>}
    <small>Gắn kết với mẹ: {motherCallMemory(game).bond} điểm · Lựa chọn được lưu cùng tiến trình.</small>
  </section>;
}
