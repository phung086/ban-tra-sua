import type { GameState } from '../../game/types';
import {
  canChooseWeekFour, chooseWeekFour, getWeekFourCallback,
  getWeekFourDecision, getWeekFourEpisode,
} from '../../game/lifeSim/weekFourEpisodes';

export function WeekFourEpisodePanel({ game, onGame }: {
  game: GameState;
  onGame: (state: GameState) => void;
}) {
  const episode = getWeekFourEpisode(game);
  const callback = getWeekFourCallback(game);
  const decision = getWeekFourDecision(game);
  if (game.phase !== 'prep' || (!episode && !callback)) return null;
  return <section className="life-morning" aria-label="Câu chuyện tuần bốn">
    {callback && <p aria-live="polite">💌 {callback}</p>}
    {episode && game.morning.step === 'finished' && <>
      <span className="life-morning-label">CHƯƠNG 4 · NGÀY {game.day} · {episode.character}</span>
      <h3>{episode.title}</h3>
      <p>{decision ? episode[decision].reply : episode.prompt}</p>
      {decision
        ? <p role="status">✓ Đã lưu quyết định. Ngày mai nhân vật sẽ nhớ lựa chọn này.</p>
        : <div className="life-morning-options">
          {(['takeTime', 'keepSimple'] as const).map(choice => {
            const selected = episode[choice];
            return <button
              key={choice}
              type="button"
              className="life-morning-option"
              disabled={!canChooseWeekFour(game, choice)}
              onClick={() => onGame(chooseWeekFour(game, choice))}
            >
              <strong>{selected.label}</strong>
              <small>{selected.minutes} phút · {selected.cost.toLocaleString('vi-VN')} ₫ · {selected.energy > 0 ? '+' : ''}{selected.energy} sức · +{selected.goodwill} thiện cảm</small>
            </button>;
          })}
        </div>}
      {!decision && !canChooseWeekFour(game, 'takeTime') &&
        <p role="status">Không đủ tiền, sức hoặc thời gian. Chọn phương án miễn phí để tiếp tục.</p>}
    </>}
  </section>;
}
