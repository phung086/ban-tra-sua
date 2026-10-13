import type { GameState } from '../../game/types';
import {
  canChooseWeekSix, chooseWeekSix, getWeekSixCallback, getWeekSixDecision,
  getWeekSixEpisode, getWeekSixRecap, type WeekSixChoice,
} from '../../game/lifeSim/weekSixEpisodes';

interface Props { game: GameState; onGame: (state: GameState) => void }

export function WeekSixEpisodePanel({ game, onGame }: Props) {
  const episode = getWeekSixEpisode(game);
  const callback = getWeekSixCallback(game);
  const decision = getWeekSixDecision(game);
  const recap = getWeekSixRecap(game);
  if (!episode && !callback) return null;
  return <section className="life-morning" aria-label="Câu chuyện chương sáu">
    {callback && <p aria-live="polite">💌 {callback}</p>}
    {episode && game.morning.step === 'finished' && <>
      <span className="life-morning-label">CHƯƠNG 6 · NGÀY {game.day} · {episode.character}</span>
      <h3>{episode.title}</h3>
      <p>🕒 {episode.schedule}</p>
      <p>{decision ? episode[decision].reply : episode.prompt}</p>
      {decision ? <p role="status">✓ Đã lưu quyết định. Nhân vật sẽ nhớ vào ngày sau.</p> :
        <div className="life-morning-options">
          {(['meet', 'message'] as const).map((choice: WeekSixChoice) => {
            const option = episode[choice];
            return <button key={choice} type="button" className="life-morning-option"
              disabled={!canChooseWeekSix(game, choice)}
              onClick={() => onGame(chooseWeekSix(game, choice))}>
              <strong>{option.label}</strong>
              <small>{option.minutes} phút · {option.cost.toLocaleString('vi-VN')} ₫ ·
                {option.energy >= 0 ? '+' : ''}{option.energy} sức ·
                +{option.goodwill} thiện cảm
                {option.stockSugar > 0 ? ` · +${option.stockSugar} đường` : ''}
                {option.fans > 0 ? ` · +${option.fans} fan` : ''}
              </small>
            </button>;
          })}
        </div>}
      {!decision && !canChooseWeekSix(game, 'meet') &&
        <p role="status">Không đủ tiền, sức hoặc đã qua giờ hẹn. Bạn vẫn có thể nhắn miễn phí.</p>}
      {recap && <p role="status"><strong>Tổng kết tuần:</strong> {recap}</p>}
    </>}
  </section>;
}
