import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import { formatMoney } from '../../game/engine';
import { getUtilitiesBillStatus, reserveUtilitiesBill, payUtilitiesBill, deferUtilitiesBill, UTILITIES_BILL_AMOUNT, UTILITIES_DAILY_RESERVE } from '../../game/lifeSim/recurringBills';
import '../../styles-recurring-bills.css';

export function RecurringBillsPanel({game,onGame}:{game:GameState;onGame:Dispatch<SetStateAction<GameState>>}) {
  if(game.phase!=='summary'||game.summary?.day!==game.day)return null;
  const s=getUtilitiesBillStatus(game);
  return <section className="utilities-bill" aria-label="Hóa đơn điện nước">
    <h4>Hóa đơn điện nước · {formatMoney(UTILITIES_BILL_AMOUNT)}/kỳ</h4>
    <p>{s.due?'Đến hạn kỳ '+s.duePeriod+': '+formatMoney(s.amountDue)+'. Đã dành '+formatMoney(s.reservedForDue)+'. Còn thiếu '+formatMoney(s.shortfall)+'.':'Kỳ '+s.period+' đến hạn ngày '+s.dueDay+'. Còn '+s.daysUntilDue+' ngày.'}</p>
    {s.canReserve&&<button className="utilities-bill-button utilities-bill-save" onClick={()=>onGame(g=>reserveUtilitiesBill(g))}>Để dành {formatMoney(UTILITIES_DAILY_RESERVE)} hôm nay</button>}
    {s.reservedToday&&<p role="status">Đã để dành hôm nay; đã lưu.</p>}
    {s.due&&<div className="utilities-bill-actions"><button className="utilities-bill-button utilities-bill-pay" disabled={!s.canPay} onClick={()=>onGame(g=>payUtilitiesBill(g))}>{s.shortfall? 'Thanh toán thêm '+formatMoney(s.shortfall):'Thanh toán bằng khoản đã dành'}</button><button className="utilities-bill-button utilities-bill-defer" disabled={!s.canDefer} onClick={()=>onGame(g=>deferUtilitiesBill(g))}>Xin gia hạn miễn phí</button></div>}
    {s.deferred&&<p role="status">Đã xin gia hạn; số dư được giữ cho kỳ sau.</p>}
    <small>Giá mô phỏng trong game; bỏ qua không khóa ca bán trà hoặc giấc ngủ.</small>
  </section>;
}
