import type { GameState } from '../../game/types';
import {
  canChooseWeekThree, chooseWeekThree, getWeekThreeCallback,
  getWeekThreeDecision, getWeekThreeEpisode,
} from '../../game/lifeSim/weekThreeEpisodes';

export function WeekThreeEpisodePanel({ game, onGame }: {
  game: GameState;
  onGame: (state: GameState) => void;
}) {
  const episode = getWeekThreeEpisode(game);
  const callback = getWeekThreeCallback(game);
  const decision = getWeekThreeDecision(game);
  if (game.phase !== 'prep' || (!episode && !callback)) return null;

  return <section className="life-morning" aria-label="Câu chuyện tuần ba">
    {callback && <p aria-live="polite">💌 {callback}</p>}
    {episode && game.morning.step === 'finished' && <>
      <span className="life-morning-label">CHƯƠNG 3 · NGÀY {game.day} · {episode.character}</span>
      <h3>{episode.title}</h3>
      <p>{decision ? episode[decision].reply : episode.prompt}</p>
      {decision
        ? <p role="status">✓ Đã lưu quyết định. Ngày mai nhân vật sẽ nhớ lựa chọn này.</p>
        : <div className="life-morning-options">
          {(['care', 'focus'] as const).map(choice => {
            const outcome = episode[choice];
            return <button
              key={choice}
              type="button"
              className="life-morning-option"
              disabled={!canChooseWeekThree(game, choice)}
              onClick={() => onGame(chooseWeekThree(game, choice))}
            >
              <strong>{outcome.label}</strong>
              <small>{outcome.minutes} phút · {outcome.cost.toLocaleString('vi-VN')} ₫ · {outcome.energy > 0 ? '+' : ''}{outcome.energy} sức · +{outcome.goodwill} thiện cảm</small>
            </button>;
          })}
        </div>}
      {!decision && !canChooseWeekThree(game, 'care') &&
        <p role="status">Không đủ tiền, sức hoặc thời gian. Chọn phương án miễn phí để tiếp tục.</p>}
    </>}
  </section>;
}
