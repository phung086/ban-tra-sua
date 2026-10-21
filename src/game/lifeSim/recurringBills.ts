import type { GameState, StoryMoment } from '../types';

export const UTILITIES_BILL_AMOUNT = 150_000;
export const UTILITIES_DAILY_RESERVE = 5_000;
export const UTILITIES_BILL_CYCLE_DAYS = 30;

export interface UtilitiesBillStatus {
  period: number;
  duePeriod: number;
  dueDay: number;
  daysUntilDue: number;
  amountDue: number;
  reservedForDue: number;
  reservedThisPeriod: number;
  shortfall: number;
  due: boolean;
  paid: boolean;
  deferred: boolean;
  reservedToday: boolean;
  canReserve: boolean;
  canPay: boolean;
  canDefer: boolean;
}

const reserveId = (period: number, day: number) => 'utilities-reserve-' + period + '-' + day;
const paidId = (period: number) => 'utilities-paid-through-' + period;
const deferredPrefix = (period: number) => 'utilities-deferred-through-' + period + '-';

function isSummaryDay(game: GameState): boolean {
  return game.phase === 'summary' && game.summary?.day === game.day &&
    Number.isSafeInteger(game.day) && game.day >= 1;
}

function getPaidThrough(ids: readonly string[], maxDuePeriod: number): number {
  let paidThrough = 0;
  for (const id of ids) {
    const match = /^utilities-paid-through-(\d+)$/.exec(id);
    if (!match) continue;
    const period = Number(match[1]);
    // A future/corrupt marker must never suppress a bill that is due today.
    if (Number.isSafeInteger(period) && period >= 1 && period <= maxDuePeriod) {
      paidThrough = Math.max(paidThrough, period);
    }
  }
  return paidThrough;
}

function getDeferredAmount(ids: readonly string[], period: number): number | null {
  const prefix = deferredPrefix(period);
  for (let index = ids.length - 1; index >= 0; index -= 1) {
    const id = ids[index];
    if (!id.startsWith(prefix)) continue;
    const amount = Number(id.slice(prefix.length));
    if (Number.isSafeInteger(amount) && amount > 0) return amount;
  }
  return null;
}

function getOutstandingBalance(ids: readonly string[], duePeriod: number, paidThrough: number): number {
  let outstanding = 0;
  for (let period = 1; period <= duePeriod; period += 1) {
    if (period <= paidThrough) continue;
    const deferred = getDeferredAmount(ids, period);
    outstanding = deferred === null ? outstanding + UTILITIES_BILL_AMOUNT : deferred;
  }
  return outstanding;
}

interface ReservationEntry {
  period: number;
  day: number;
}

function reservationEntry(id: string): ReservationEntry | null {
  const match = /^utilities-reserve-(\d+)-(\d+)$/.exec(id);
  if (!match) return null;
  const period = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isSafeInteger(period) || period < 1 ||
      !Number.isSafeInteger(day) || day < 1) return null;
  // Every global day belongs to exactly one 30-day period.
  if (Math.floor((day - 1) / UTILITIES_BILL_CYCLE_DAYS) + 1 !== period) return null;
  return { period, day };
}

function getReservedAmount(
  ids: readonly string[],
  afterPeriod: number,
  throughPeriod: number,
  currentDay: number,
): number {
  const seen = new Set<string>();
  let total = 0;
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const entry = reservationEntry(id);
    if (entry && entry.day <= currentDay &&
        entry.period > afterPeriod && entry.period <= throughPeriod) {
      total += UTILITIES_DAILY_RESERVE;
    }
  }
  return total;
}

function getReservedInPeriod(
  ids: readonly string[],
  period: number,
  paidThrough: number,
  currentDay: number,
): number {
  if (period <= paidThrough) return 0;
  const seen = new Set<string>();
  let total = 0;
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const entry = reservationEntry(id);
    if (entry && entry.period === period && entry.day <= currentDay) {
      total += UTILITIES_DAILY_RESERVE;
    }
  }
  return total;
}

/** Deterministic 30-day household utility cycle using the existing v3 save ledger. */
export function getUtilitiesBillStatus(game: GameState): UtilitiesBillStatus {
  const day = Number.isSafeInteger(game.day) && game.day > 0 ? game.day : 1;
  const period = Math.floor((day - 1) / UTILITIES_BILL_CYCLE_DAYS) + 1;
  const duePeriod = Math.floor(day / UTILITIES_BILL_CYCLE_DAYS);
  const dueDay = period * UTILITIES_BILL_CYCLE_DAYS;
  const ids = Array.isArray(game.relationshipRewardIds) ? game.relationshipRewardIds : [];
  const paidThrough = getPaidThrough(ids, duePeriod);
  const amountDue = getOutstandingBalance(ids, duePeriod, paidThrough);
  const due = duePeriod > paidThrough && amountDue > 0;
  const paid = duePeriod > 0 && paidThrough >= duePeriod;
  const deferred = due && getDeferredAmount(ids, duePeriod) !== null;
  const reservedForDue = getReservedAmount(ids, paidThrough, duePeriod, day);
  const reservedThisPeriod = getReservedInPeriod(ids, period, paidThrough, day);
  const shortfall = due ? Math.max(0, amountDue - reservedForDue) : 0;
  const reservedToday = ids.includes(reserveId(period, day));
  const summary = isSummaryDay(game);

  return {
    period, duePeriod, dueDay,
    daysUntilDue: Math.max(0, dueDay - day),
    amountDue, reservedForDue, reservedThisPeriod, shortfall,
    due, paid, deferred, reservedToday,
    canReserve: summary && !reservedToday && paidThrough < period &&
      Number.isFinite(game.cash) && game.cash >= UTILITIES_DAILY_RESERVE,
    canPay: summary && due && Number.isFinite(game.cash) && game.cash >= shortfall,
    canDefer: summary && due && shortfall > 0 && !deferred,
  };
}

function addBillMoment(game: GameState, id: string, title: string, text: string): GameState {
  const moment: StoryMoment = {
    id, customerId: 'household-utilities', customerName: 'Điện nước',
    title, text, day: game.day, rewardFans: 0,
  };
  return {
    ...game,
    relationshipRewardIds: game.relationshipRewardIds.includes(id)
      ? game.relationshipRewardIds : [...game.relationshipRewardIds, id],
    storyLog: [moment, ...game.storyLog.filter(item => item.id !== id)].slice(0, 24),
    city: { ...game.city, journal: [text, ...game.city.journal].slice(0, 24) },
    notice: text,
  };
}

/** Reserve VND once per in-game day; the reservation survives save/reload. */
export function reserveUtilitiesBill(game: GameState): GameState {
  if (!isSummaryDay(game)) return game;
  if (game.cash < UTILITIES_DAILY_RESERVE) {
    return { ...game, notice: 'Ví chưa đủ 5.000 ₫ để dành hôm nay. Bạn có thể bỏ qua, không bị phạt.' };
  }
  const status = getUtilitiesBillStatus(game);
  if (!status.canReserve) return game;
  const id = reserveId(status.period, game.day);
  return addBillMoment(
    { ...game, cash: game.cash - UTILITIES_DAILY_RESERVE },
    id, 'Để dành hóa đơn',
    'Ngày ' + game.day + ': đã để dành 5.000 ₫ cho hóa đơn điện nước kỳ ' + status.period + '.',
  );
}

/** Pay currently due bills once; reserved funds are applied before wallet cash. */
export function payUtilitiesBill(game: GameState): GameState {
  if (!isSummaryDay(game)) return game;
  const status = getUtilitiesBillStatus(game);
  if (!status.due) return game;
  if (game.cash < status.shortfall) {
    return { ...game, notice: 'Chưa đủ tiền thanh toán phần còn thiếu. Bạn có thể xin gia hạn miễn phí hoặc tiếp tục để dành.' };
  }
  const id = paidId(status.duePeriod);
  if (game.relationshipRewardIds.includes(id)) return game;
  const message = status.shortfall > 0
    ? 'Đã thanh toán hóa đơn điện nước đến kỳ ' + status.duePeriod + '. Khoản đã dành được dùng trước; ví trả thêm ' + status.shortfall.toLocaleString('vi-VN') + ' ₫.'
    : 'Đã thanh toán hóa đơn điện nước đến kỳ ' + status.duePeriod + ' bằng khoản đã dành. Ví không bị trừ thêm tiền.';
  return addBillMoment(
    { ...game, cash: game.cash - status.shortfall },
    id, 'Thanh toán điện nước', message,
  );
}

/** Soft fallback: keep the full due balance and all reserved money for a later attempt. */
export function deferUtilitiesBill(game: GameState): GameState {
  if (!isSummaryDay(game)) return game;
  const status = getUtilitiesBillStatus(game);
  if (!status.canDefer) return game;
  const id = deferredPrefix(status.duePeriod) + status.amountDue;
  return addBillMoment(
    game, id, 'Xin gia hạn hóa đơn',
    'Đã xin gia hạn hóa đơn điện nước kỳ ' + status.duePeriod +
      '. Số dư ' + status.amountDue.toLocaleString('vi-VN') +
      ' ₫ được chuyển sang kỳ sau; khoản đã dành vẫn được giữ lại.',
  );
}
