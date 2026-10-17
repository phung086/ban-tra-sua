import type { GameState, Order } from '../types';

/** Shared recipe check for the counter and the actual delivery callback.
 * A preview never mutates the draft, money or inventory.
 */
export function getRememberedCupMismatch(order: Order, draft: GameState['draft']): string | null {
  if (draft.base !== order.base) return 'Bạn pha nhầm nền trà rồi.';
  if (draft.size !== order.size) return 'Kích cỡ ly chưa đúng đơn.';
  if (draft.topping !== order.topping) return 'Topping chưa đúng đơn.';
  if (draft.sugar !== order.sugar) return 'Độ ngọt chưa đúng đơn.';
  if (draft.ice !== order.ice) return 'Mức đá chưa đúng đơn.';
  if (Math.abs(draft.fill - order.targetFill) >= 15) return 'Lượng trà trong ly chưa đúng yêu cầu.';
  if (Math.abs(draft.shake - order.targetShake) >= 15) return 'Độ lắc chưa đúng yêu cầu.';
  return null;
}
