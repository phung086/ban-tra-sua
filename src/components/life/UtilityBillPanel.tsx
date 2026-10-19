import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import { UTILITY_BILL_VND, canChooseUtilityBill, chooseUtilityBill, oldestUnpaidUtilityBill, utilityBillMorningMessage, utilityBillWasDeferred } from '../../game/lifeSim/utilityBill';

export function UtilityBillPanel({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  if (game.phase === 'open' || (game.phase === 'prep' && game.morning.step === 'asleep')) return null;
  const due = oldestUnpaidUtilityBill(game);
  const reminder = utilityBillMorningMessage(game);
  const paidToday = game.phase === 'summary' && game.relationshipRewardIds.includes(`life-utility-bill.${game.day}.pay`);
  if (due === null && !reminder && !paidToday) return null;
  return <section className="life-morning" aria-label="Sổ chi tiêu điện nước" data-testid="utility-bill-panel">
    <span className="life-morning-label">ĐIỆN NƯỚC · NGÀY {game.day}</span>
    <h3>💡 Sổ chi tiêu của tiệm</h3>
    {reminder && <p role="status">{reminder}</p>}
    {paidToday && <p role="status">✓ Đã thanh toán hóa đơn kỳ này.</p>}
    {due !== null && <>
      <p>Hóa đơn kỳ ngày {due}: {UTILITY_BILL_VND.toLocaleString('vi-VN')} ₫. Có thể thanh toán hoặc hẹn lại; không bị khóa ngày mới.</p>
      {utilityBillWasDeferred(game, due) && <p role="status">Đã ghi hẹn. Không phát sinh phí phạt.</p>}
      <div className="life-morning-options">
        <button type="button" className="life-morning-option" disabled={!canChooseUtilityBill(game, 'pay')}
          onClick={() => onGame(current => chooseUtilityBill(current, 'pay'))}>
          <strong>Thanh toán ngay</strong><small>32.000 ₫ · 5 phút · −1 sức</small>
        </button>
        {canChooseUtilityBill(game, 'defer') && <button type="button" className="life-morning-option"
          onClick={() => onGame(current => chooseUtilityBill(current, 'defer'))}>
          <strong>Nhắn hẹn thanh toán</strong><small>Miễn phí · vẫn được ngủ và mở tiệm</small>
        </button>}
      </div>
      {!canChooseUtilityBill(game, 'pay') && <p>Chưa đủ tiền, sức hoặc thời gian. Hóa đơn vẫn ở trong sổ.</p>}
    </>}
  </section>;
}
