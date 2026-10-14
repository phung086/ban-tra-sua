import type { GameState } from '../../game/types';
import { BREAKFAST_OPTIONS } from '../../game/lifeSim/morning';
import {
  beginBreakfastCooking, canBeginBreakfastCooking, canFinishBreakfastCooking,
  COOKING_STYLES, finishBreakfastCooking, isCookingBreakfast,
} from '../../game/lifeSim/breakfastCooking';

/** Lightweight tactile breakfast interaction; mounted beside the morning routine. */
export function BreakfastCookingPanel({ game, onGame }: {
  game: GameState; onGame: (state: GameState) => void;
}) {
  if (game.phase !== 'prep' || game.morning.step !== 'awake' || game.morning.day !== game.day)
    return null;
  const cooking = isCookingBreakfast(game);
  return <section className="life-morning" aria-label="Bếp sáng tại nhà">
    <span className="life-morning-label">BẾP NHÀ · NGÀY {game.day}</span>
    <h3>🍳 Cơm trứng buổi sáng</h3>
    <p>{cooking
      ? 'Gạo đã vo, chảo đã nóng. Bạn muốn nấu chậm cho no lâu hay làm nhanh để kịp mở tiệm?'
      : 'Tự nấu một bữa sáng: sơ chế 5 phút, rồi chọn lửa nhỏ hoặc lửa vừa. Tiền chỉ trừ khi nấu xong.'}</p>
    {cooking ? <>
      <progress value={1} max={2} aria-label="Tiến độ nấu bữa sáng"/>
      <div className="life-morning-options" role="group" aria-label="Chọn lửa nấu">
        {(['gentle', 'quick'] as const).map(heat => {
          const style = COOKING_STYLES[heat];
          return <button key={heat} type="button" className="life-morning-option"
            disabled={!canFinishBreakfastCooking(game, heat)}
            onClick={() => onGame(finishBreakfastCooking(game, heat))}>
            <strong>{style.label}</strong>
            <small>{style.minutes} phút nữa · No {style.satiety}/100 · +{style.energy} sức</small>
            <small>{style.hint}</small>
            <b>{BREAKFAST_OPTIONS.cook.cost.toLocaleString('vi-VN')} ₫</b>
          </button>;
        })}
      </div>
      <p role="status">Có thể đổi ý, mua bánh mì hoặc đi làm luôn ở phần bữa sáng. Không mất tiền nấu nếu đổi ý.</p>
    </> : <button type="button" className="life-morning-option"
      disabled={!canBeginBreakfastCooking(game)}
      onClick={() => onGame(beginBreakfastCooking(game))}>
      <strong>🥚 Vo gạo, chuẩn bị chảo</strong>
      <small>5 phút · -1 sức · chưa thu tiền</small>
    </button>}
  </section>;
}
