import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import {
  canChooseEveningCare, chooseEveningCare, EVENING_CARE,
  getEveningCareCallback, getEveningCareChoice,
  type EveningCareChoice,
} from '../../game/lifeSim/eveningCare';

const choices: readonly EveningCareChoice[] = ['dinner', 'help', 'rest', 'thanks', 'postpone'];

export function EveningCarePanel({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  if (game.phase === 'prep') {
    const callback = getEveningCareCallback(game);
    return callback ? <section className="life-morning" aria-label="Lời nhắn từ Hà">
      <span className="life-morning-label">LỜI NHẮN SAU MỘT ĐÊM · NGÀY {game.day}</span>
      <p role="status">💌 {callback}</p>
    </section> : null;
  }
  if (game.phase !== 'summary' || game.summary?.day !== game.day) return null;

  const selected = getEveningCareChoice(game);
  const thankYouUnlocked = canChooseEveningCare(game, 'thanks');
  const canPostpone = canChooseEveningCare(game, 'postpone');
  return <section className="life-morning" aria-label="Bữa tối sau ca">
    <span className="life-morning-label">CUỐI NGÀY · GÓC PHỐ</span>
    <h3>{thankYouUnlocked && !selected ? 'Hà vẫn nhớ lời hẹn cơm' : 'Hà rủ ghé quán cơm trước khi về'}</h3>
    <p>{selected
      ? EVENING_CARE[selected].text
      : thankYouUnlocked
        ? 'Hôm trước bạn giúp Hà dọn quán. Hôm nay Hà mời một suất cơm miễn phí; bạn vẫn có thể chọn việc khác hoặc về nghỉ.'
        : 'Hà đang dọn hàng ở đầu ngõ. Bạn muốn ăn tối, giúp một tay hay về nghỉ? Chọn trước khi ngủ; không bắt buộc.'}</p>
    {selected
      ? <p role="status">✓ Hà sẽ nhớ quyết định này vào sáng mai. Bạn có thể ngủ để sang ngày mới.</p>
      : <div className="life-morning-options">
        {choices.filter(choice => (choice !== 'thanks' || thankYouUnlocked) && (choice !== 'postpone' || canPostpone)).map(choice => {
          const outcome = EVENING_CARE[choice];
          const available = canChooseEveningCare(game, choice);
          return <button type="button" key={choice} className="life-morning-option"
            disabled={!available} onClick={() => onGame(current => chooseEveningCare(current, choice))}>
            <strong>{outcome.label}</strong>
            <small>{outcome.cost ? outcome.cost.toLocaleString('vi-VN') + ' ₫' : 'Miễn phí'}
              {' · '}{outcome.minutes} phút
              {' · '}{outcome.energy >= 0 ? '+' : ''}{outcome.energy} sức
              {' · '}+{outcome.goodwill} thiện cảm</small>
          </button>;
        })}
      </div>}
    {!selected && !canChooseEveningCare(game, 'dinner') &&
      <p role="status">Nếu thiếu tiền hoặc quá giờ, bạn vẫn có thể nhắn Hà rồi nghỉ miễn phí.</p>}
  </section>;
}
