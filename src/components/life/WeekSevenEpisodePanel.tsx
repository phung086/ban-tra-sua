import type { GameState } from '../../game/types';
import {canChooseWeekSeven,chooseWeekSeven,getWeekSevenEpisode,getWeekSevenDecision,getWeekSevenCallback,getWeekSevenRecap} from '../../game/lifeSim/weekSevenEpisodes';
export function WeekSevenEpisodePanel({game,onGame}:{game:GameState;onGame:(state:GameState)=>void}){
 const episode=getWeekSevenEpisode(game),decision=getWeekSevenDecision(game),callback=getWeekSevenCallback(game),recap=getWeekSevenRecap(game);
 if(!episode&&!callback)return null;
 return <section className="life-morning" aria-label="Câu chuyện chương bảy">
 {callback&&<p aria-live="polite">💌 {callback}</p>}
 {episode&&game.morning.step==='finished'&&<>
 <span className="life-morning-label">CHƯƠNG 7 · NGÀY {game.day} · {episode.character}</span>
 <h3>{episode.title}</h3><p>🕒 Hẹn trước {Math.floor(episode.meetBefore/60)}:{String(episode.meetBefore%60).padStart(2,'0')}</p>
 <p>{decision?episode[decision].reply:episode.prompt}</p>
 {decision?<p role="status">✓ Đã lưu quyết định.</p>:<div className="life-morning-options">
 {(['meet','message'] as const).map(choice=><button key={choice} type="button" className="life-morning-option"
 disabled={!canChooseWeekSeven(game,choice)} onClick={()=>onGame(chooseWeekSeven(game,choice))}>
 {episode[choice].label} · {episode[choice].cost.toLocaleString('vi-VN')} ₫</button>)}</div>}
 {recap&&<p role="status"><strong>Tổng kết tuần:</strong> {recap}</p>}
 </>}
 </section>;
}
