import type { GameState } from '../../game/types';
import { canEatLeftoverBreak, eatLeftoverBreak } from '../../game/lifeSim/leftoverBreak';
import { canEatPackedLunch, eatPackedLunch } from '../../game/lifeSim/packedLunch';
import {
  canTakeShiftBreak, SHIFT_BREAK_OPTIONS, takeShiftBreak,
} from '../../game/lifeSim/shiftNeeds';

/** A light touch-friendly break action in the real brewing station. */
export function ShiftBreakPanel({ game, onGame }: {
  game: GameState;
  onGame: (next: GameState) => void;
}) {
  if (game.phase !== 'open' || !game.currentOrder) return null;
  const alreadyRested = game.morning.shiftBreakOrder === game.served;
  return <section className="life-morning" aria-label="Giữ sức giữa ca bán trà">
    <span className="life-morning-label">SỨC BỀN · CA BÁN NGÀY {game.day}</span>
    <h3>🥣 Hôm nay mình đã ăn đủ chưa?</h3>
    <p role="status">Độ no {game.morning.satiety}/100 · Năng lượng {Math.round(game.city.energy)}/100</p>
    {alreadyRested
      ? <p>Đã nghỉ trong lượt khách này. Hoàn tất đơn để có thể nghỉ lượt sau.</p>
      : <div className="life-morning-options">
        {game.morning.breakfast === 'leftovers' &&
          !(game.morning as typeof game.morning & {leftoverBreakUsed?: boolean}).leftoverBreakUsed && <button type="button"
          className="life-morning-option" disabled={!canEatLeftoverBreak(game)}
          onClick={() => onGame(eatLeftoverBreak(game))}>
          <strong>🍚 Ăn cơm nguội mang theo</strong>
          <small>6 phút · miễn phí · +20 no · +2 sức · chỉ một lần/ngày</small>
        </button>}
        {game.morning.lunchPrep === 'lunchbox' &&
          !(game.morning as typeof game.morning & {packedLunchEaten?: boolean}).packedLunchEaten &&
          <button type="button" className="life-morning-option"
            disabled={!canEatPackedLunch(game)}
            onClick={() => onGame(eatPackedLunch(game))}>
            <strong>🍱 Ăn cơm hộp mang theo</strong>
            <small>10 phút · đã trả khi chuẩn bị · +30 no · +4 sức · một lần/ngày</small>
          </button>}
        {(['snack', 'rest'] as const).map(choice => {
          const option = SHIFT_BREAK_OPTIONS[choice];
          return <button type="button" className="life-morning-option" key={choice}
            disabled={!canTakeShiftBreak(game, choice)}
            onClick={() => onGame(takeShiftBreak(game, choice))}>
            <strong>{option.label}</strong>
            <small>{option.minutes} phút · {option.cost.toLocaleString('vi-VN')} ₫ ·
              +{option.satiety} no · +{option.energy} sức</small>
            <small>{option.description}</small>
          </button>;
        })}
      </div>}
    {!alreadyRested && !canTakeShiftBreak(game, 'snack') &&
      <p>Thiếu tiền hoặc quá giờ? Có thể nghỉ miễn phí nếu còn thời gian trong ngày.</p>}
  </section>;
}
