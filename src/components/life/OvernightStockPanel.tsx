import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import {
  OVERNIGHT_STOCK_OPTIONS, canChooseOvernightStock, chooseOvernightStock,
  getOvernightStockCallback, getOvernightStockChoice, perishableStock,
  type OvernightStockChoice,
} from '../../game/lifeSim/overnightStock';

const choices: readonly OvernightStockChoice[] = ['chill', 'sort', 'leave'];

/** Real post-shift stock action; the existing sleep/save pipeline persists its consequences. */
export function OvernightStockPanel({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  if (game.phase === 'prep') {
    const callback = getOvernightStockCallback(game);
    return callback ? <section className="life-morning" aria-label="Nhật ký kho sáng nay">
      <span className="life-morning-label">SÁNG NGÀY {game.day} · KHO NGUYÊN LIỆU</span>
      <p role="status">📦 {callback}</p>
    </section> : null;
  }
  if (game.phase !== 'summary' || game.summary?.day !== game.day) return null;
  const selected = getOvernightStockChoice(game);
  const stock = perishableStock(game);
  const lowFreshness = stock.length
    ? Math.min(...stock.map(item => Number.isFinite(game.freshness[item.key]) ? game.freshness[item.key] : 100))
    : null;
  return <section className="life-morning" aria-label="Bảo quản nguyên liệu qua đêm">
    <span className="life-morning-label">CUỐI CA · KHO TIỆM</span>
    <h3>🧊 Giữ nguyên liệu cho ngày mai</h3>
    <p>{stock.length
      ? `Còn ${stock.length} loại nguyên liệu dễ hỏng; độ tươi thấp nhất ${lowFreshness}%. Chọn cách bảo quản trước khi ngủ (không bắt buộc).`
      : 'Kho không còn nguyên liệu dễ hỏng cần bảo quản. Có thể về nghỉ.'}</p>
    {selected ? <p role="status">✓ Đã chọn: {OVERNIGHT_STOCK_OPTIONS[selected].label}. Quyết định được lưu và chỉ tính một lần.</p>
      : <div className="life-morning-options">
        {choices.map(choice => {
          const option = OVERNIGHT_STOCK_OPTIONS[choice];
          return <button key={choice} type="button" className="life-morning-option"
            disabled={!canChooseOvernightStock(game, choice)}
            onClick={() => onGame(current => chooseOvernightStock(current, choice))}>
            <strong>{option.label}</strong>
            <small>{option.cost.toLocaleString('vi-VN')} ₫ · {option.minutes} phút · -{option.energy} sức</small>
            <small>{option.freshness ? `+ ${option.freshness} điểm độ tươi trước hao hụt qua đêm` : 'Không cải thiện độ tươi'}</small>
          </button>;
        })}
      </div>}
    <small>Nguyên liệu vẫn hao hụt khi sang ngày; tủ mát nâng cấp và nghiên cứu vẫn có tác dụng.</small>
  </section>;
}
