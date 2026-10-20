import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import { formatMoney } from '../../game/engine';
import {
  deferUtilitiesBill,
  getUtilitiesBillStatus,
  payUtilitiesBill,
  reserveUtilitiesBill,
  UTILITIES_BILL_AMOUNT,
  UTILITIES_DAILY_RESERVE,
} from '../../game/lifeSim/recurringBills';
import '../../styles-recurring-bills.css';

export function RecurringBillsPanel({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  if (game.phase !== 'summary' || game.summary?.day !== game.day) return null;
  const status = getUtilitiesBillStatus(game);

  return (
    <section className="utilities-bill" aria-label="Hóa đơn điện nước">
      <h4>Hóa đơn điện nước · {formatMoney(UTILITIES_BILL_AMOUNT)}/kỳ</h4>
      <p>
        {status.due
          ? 'Đến hạn kỳ ' + status.duePeriod + ': ' + formatMoney(status.amountDue) +
            '. Đã dành ' + formatMoney(status.reservedForDue) +
            '. Còn thiếu ' + formatMoney(status.shortfall) + '.'
          : 'Kỳ ' + status.period + ' đến hạn ngày ' + status.dueDay +
            '. Còn ' + status.daysUntilDue + ' ngày.'}
      </p>
      {status.canReserve && (
        <button className="utilities-bill-button utilities-bill-save"
          onClick={() => onGame(gameState => reserveUtilitiesBill(gameState))}>
          Để dành {formatMoney(UTILITIES_DAILY_RESERVE)} hôm nay
        </button>
      )}
      {status.reservedToday && <p role="status">Đã để dành hôm nay; đã lưu.</p>}
      {status.due && (
        <div className="utilities-bill-actions">
          <button className="utilities-bill-button utilities-bill-pay"
            disabled={!status.canPay}
            onClick={() => onGame(gameState => payUtilitiesBill(gameState))}>
            {status.shortfall
              ? 'Thanh toán thêm ' + formatMoney(status.shortfall)
              : 'Thanh toán bằng khoản đã dành'}
          </button>
          <button className="utilities-bill-button utilities-bill-defer"
            disabled={!status.canDefer}
            onClick={() => onGame(gameState => deferUtilitiesBill(gameState))}>
            Xin gia hạn miễn phí
          </button>
        </div>
      )}
      {status.deferred && (
        <p role="status">
          Đã xin gia hạn kỳ {status.duePeriod}; số dư được giữ cho kỳ sau.
        </p>
      )}
      <small>Giá mô phỏng trong game; bỏ qua không khóa ca bán trà hoặc giấc ngủ.</small>
    </section>
  );
}
