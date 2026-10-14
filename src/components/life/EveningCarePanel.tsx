import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import {
  canChooseEveningCare, chooseEveningCare, hasMissedHaPromise, hasUnresolvedHaPromise,
  getEveningCareCallback, getEveningCareChoice, getEveningCareOutcome,
  type EveningCareChoice,
} from '../../game/lifeSim/eveningCare';

const choices: readonly EveningCareChoice[] = ['dinner', 'help', 'rest', 'thanks', 'postpone', 'apologize', 'message', 'reconcile', 'repair'];

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
  const missedPromise = hasMissedHaPromise(game);
  const canMessage = canChooseEveningCare(game, 'message');
  const followupDue = game.day === 6 &&
    ['message', 'apologize'].includes(getEveningCareChoice(game, 5) ?? '');
  const canReconcile = canChooseEveningCare(game, 'reconcile');
  const unresolvedDue = hasUnresolvedHaPromise(game);
  const canRepair = canChooseEveningCare(game, 'repair');
  return <section className="life-morning" aria-label="Bữa tối sau ca">
    <span className="life-morning-label">CUỐI NGÀY · GÓC PHỐ</span>
    <h3>{!selected && unresolvedDue ? 'Hà vẫn muốn nghe bạn nói thật' : !selected && followupDue ? 'Hà vẫn ở đầu ngõ, ghé chào một chút nhé?' : !selected && missedPromise ? 'Hà đang chờ một lời xin lỗi' : thankYouUnlocked && !selected ? 'Hà nhớ lời hẹn cơm' : 'Hà rủ ghé quán cơm trước khi về'}</h3>
    <p>{selected
      ? getEveningCareOutcome(game, selected).text
      : unresolvedDue
        ? canRepair
          ? 'Hôm qua bạn chưa giải thích chuyện lỡ hẹn. Hôm nay có thể ghé xin lỗi muộn, mất 15 phút và 2 sức, không mất tiền; hoặc về nghỉ.'
          : 'Bạn vẫn có thể về nghỉ nếu đã quá giờ hoặc quá mệt. Hà sẽ không ép bạn phải ghé.'
      : followupDue
        ? canReconcile
          ? 'Hà đã nhận lời xin lỗi hôm qua. Ghé thăm mất 10 phút và 2 sức, hoặc bạn có thể về nghỉ.'
          : 'Hà đã nhận lời xin lỗi hôm qua. Hôm nay không đủ thời gian hoặc sức để ghé quán; bạn vẫn có thể về nghỉ.'
      : missedPromise
        ? canMessage
          ? 'Bạn đã lỡ bữa cơm hẹn lại. Quán đã đóng cửa, nhưng bạn vẫn có thể nhắn Hà xin lỗi ngay tối nay.'
          : 'Bạn đã lỡ bữa cơm hẹn lại. Hãy ghé quán xin lỗi Hà trước khi đóng cửa, hoặc về nghỉ nếu chưa sẵn sàng.'
      : thankYouUnlocked
        ? 'Bạn từng giúp Hà dọn quán. Hà vẫn giữ lời mời cơm miễn phí; bạn có thể nhận, hẹn lại nếu còn lượt, hoặc về nghỉ.'
        : 'Hà đang dọn hàng ở đầu ngõ. Bạn muốn ăn tối, giúp một tay hay về nghỉ? Chọn trước khi ngủ; không bắt buộc.'}</p>
    {selected
      ? <p role="status">✓ Hà sẽ nhớ quyết định này vào sáng mai. Bạn có thể ngủ để sang ngày mới.</p>
      : <div className="life-morning-options">
        {choices.filter(choice => (choice !== 'thanks' || thankYouUnlocked) && (choice !== 'postpone' || canPostpone) && (choice !== 'apologize' || missedPromise) && (choice !== 'message' || canMessage) && (choice !== 'reconcile' || followupDue) && (choice !== 'repair' || unresolvedDue)).map(choice => {
          const outcome = getEveningCareOutcome(game, choice);
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
