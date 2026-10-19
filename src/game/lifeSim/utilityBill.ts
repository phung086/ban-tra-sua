import type { GameState } from '../types';

export const UTILITY_BILL_INTERVAL = 14;
export const UTILITY_BILL_VND = 32000;
export type UtilityBillChoice = 'pay' | 'defer';
const id = (day: number, choice: UtilityBillChoice) => `life-utility-bill.${day}.${choice}`;

export function isUtilityBillDay(day: number): boolean {
  return Number.isSafeInteger(day) && day >= 14 && day % 14 === 0;
}

export function oldestUnpaidUtilityBill(game: GameState): number | null {
  if (!Number.isSafeInteger(game.day) || game.day < 1) return null;
  for (let due = 14; due <= game.day; due += 14) {
    if (due === game.day && (game.phase !== 'summary' || game.summary?.day !== game.day)) continue;
    if (!game.relationshipRewardIds.includes(id(due, 'pay'))) return due;
  }
  return null;
}

export function utilityBillWasDeferred(game: GameState, due: number): boolean {
  return game.relationshipRewardIds.includes(id(due, 'defer'));
}

export function canChooseUtilityBill(game: GameState, choice: UtilityBillChoice): boolean {
  if (choice !== 'pay' && choice !== 'defer') return false;
  const due = oldestUnpaidUtilityBill(game);
  if (due === null || ![game.cash, game.city.minutes, game.city.energy].every(Number.isFinite) ||
      game.cash < 0 || game.city.minutes < 0 || game.city.minutes > 1260 ||
      game.city.energy < 0 || game.city.energy > 100) return false;
  const available = (game.phase === 'summary' && game.summary?.day === game.day) ||
    (game.phase === 'prep' && game.morning.day === game.day && game.morning.step !== 'asleep');
  if (!available) return false;
  if (choice === 'defer') return due === game.day && game.phase === 'summary' &&
    !utilityBillWasDeferred(game, due);
  return game.cash >= UTILITY_BILL_VND && game.city.energy >= 1 && game.city.minutes + 5 <= 1260;
}

export function chooseUtilityBill(game: GameState, choice: UtilityBillChoice): GameState {
  if (!canChooseUtilityBill(game, choice)) return game;
  const due = oldestUnpaidUtilityBill(game)!;
  const paid = choice === 'pay';
  const text = paid
    ? `Đã thanh toán hóa đơn điện nước kỳ ngày ${due}: ${UTILITY_BILL_VND.toLocaleString('vi-VN')} ₫. Không trừ lần hai.`
    : `Đã ghi hẹn hóa đơn điện nước kỳ ngày ${due}. Có thể trả từ sáng mai, không phát sinh phí phạt.`;
  return {
    ...game,
    cash: game.cash - (paid ? UTILITY_BILL_VND : 0),
    dailyCost: game.dailyCost + (paid ? UTILITY_BILL_VND : 0),
    summary: paid && game.phase === 'summary' && game.summary
      ? { ...game.summary, profit: game.summary.profit - UTILITY_BILL_VND } : game.summary,
    city: {
      ...game.city,
      minutes: game.city.minutes + (paid ? 5 : 0),
      energy: game.city.energy - (paid ? 1 : 0),
      journal: [`Ngày ${game.day} · ${text}`, ...game.city.journal].slice(0, 24),
    },
    relationshipRewardIds: [...game.relationshipRewardIds, id(due, choice)],
    notice: text,
  };
}

export function utilityBillMorningMessage(game: GameState): string | null {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step === 'asleep' || game.day < 2) return null;
  const yesterday = game.day - 1;
  if (!isUtilityBillDay(yesterday)) return null;
  return game.relationshipRewardIds.includes(id(yesterday, 'pay'))
    ? 'Sổ chi tiêu: Hóa đơn điện nước hôm qua đã thanh toán đủ. Mình có thể tập trung mở tiệm.'
    : 'Sổ chi tiêu: Hóa đơn điện nước hôm qua vẫn chưa thanh toán. Có thể trả khi đủ tiền.';
}
