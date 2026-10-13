import type { GameState } from '../../game/types';
import { canChooseWeekTwo, chooseWeekTwo, getWeekTwoCallback, getWeekTwoDecision, getWeekTwoEpisode } from '../../game/lifeSim/weekTwoEpisodes';

export function WeekTwoEpisodePanel({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  const episode = getWeekTwoEpisode(game.day);
  const callback = getWeekTwoCallback(game);
  const decision = getWeekTwoDecision(game);
  if (game.phase !== 'prep' || (!episode && !callback)) return null;
  return <section className="life-morning" aria-label="Câu chuyện tuần hai">
    {callback && <p aria-live="polite">💌 {callback}</p>}
    {episode && game.morning.step === 'finished' && <>
      <span className="life-morning-label">CHƯƠNG 2 · NGÀY {game.day} · {episode.character}</span>
      <h3>{episode.title}</h3>
      <p>{decision ? episode[decision].reply : episode.prompt}</p>
      {decision ? <p role="status">✓ Đã lưu lựa chọn. Nhân vật sẽ nhớ vào ngày mai.</p> :
        <div className="life-morning-options">
          {(['join', 'later'] as const).map(choice => <button
            className="life-morning-option" type="button" key={choice}
            disabled={!canChooseWeekTwo(game, choice)}
            onClick={() => onGame(chooseWeekTwo(game, choice))}>
            <strong>{episode[choice].label}</strong>
            <small>{episode[choice].minutes} phút · {episode[choice].cost.toLocaleString('vi-VN')} ₫</small>
          </button>)}
        </div>}
      {!decision && !canChooseWeekTwo(game, 'join') &&
        <p role="status">Không đủ tiền, sức hoặc thời gian. Hãy chọn phương án miễn phí hoặc mở tiệm.</p>}
    </>}
  </section>;
}
