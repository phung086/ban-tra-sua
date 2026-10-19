import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import {
  canChooseSupplierEvening, chooseSupplierEvening, getSupplierEveningChoice,
  SUPPLIER_EVENING_OPTIONS, type SupplierEveningChoice,
} from '../../game/lifeSim/eveningSupplier';

const choices: readonly SupplierEveningChoice[] = ['reserve', 'chat', 'rest'];

export function EveningSupplierPanel({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  if (game.phase !== 'summary' || game.summary?.day !== game.day ||
    game.day < 1 || game.day > 6) return null;
  const selected = getSupplierEveningChoice(game);
  return <section className="life-morning" aria-label="Hẹn nguyên liệu với cô Hạnh">
    <span className="life-morning-label">CUỐI CA · CHỢ NGỌC HÀ</span>
    <h3>🧺 Nhắn cô Hạnh giữ giỏ trà cho sáng mai?</h3>
    <p>Đặt trước mất 2.000 ₫ và 6 phút; nếu ghé chợ mua giỏ đầy đủ ngày mai,
      giá giảm 6.000 ₫ (tiết kiệm ròng 4.000 ₫). Không ghé mua thì mất phí giữ hàng.
      Có thể chỉ hỏi thăm hoặc về nghỉ, không bắt buộc.</p>
    {selected
      ? <p role="status">✓ {selected === 'reserve'
        ? 'Cô Hạnh đã nhận đặt hàng. Mai thức dậy và ghé chợ Ngọc Hà để nhận giá ưu đãi.'
        : selected === 'chat'
          ? 'Đã hỏi thăm cô Hạnh. Sáng mai cô sẽ nhắn lại.'
          : 'Đã chọn về nghỉ. Mai vẫn có thể mua hàng giá thường.'}</p>
      : <div className="life-morning-options">
        {choices.map(choice => {
          const option = SUPPLIER_EVENING_OPTIONS[choice];
          return <button key={choice} type="button" className="life-morning-option"
            disabled={!canChooseSupplierEvening(game, choice)}
            onClick={() => onGame(current => chooseSupplierEvening(current, choice))}>
            <strong>{option.label}</strong>
            <small>{option.cost.toLocaleString('vi-VN')} ₫ · {option.minutes} phút ·
              {option.energy >= 0 ? '+' : ''}{option.energy} sức · +{option.goodwill} thiện cảm</small>
          </button>;
        })}
      </div>}
    {!selected && !canChooseSupplierEvening(game, 'reserve') &&
      <p role="status">Thiếu tiền, sức hoặc quá giờ? Có thể về nghỉ miễn phí.</p>}
  </section>;
}
