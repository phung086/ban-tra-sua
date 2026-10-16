import { describe, it, expect } from "vitest";
import {
  closeDayFinancials,
  createInitialLedgerState,
  recordTransaction,
  settleWeeklyRent,
} from "./financialLedger";

describe("financialLedger — Accounting, Daily Profit & Rent Settle", () => {
  it("tracks revenue from tea sales and expenses from market supplies", () => {
    let state = createInitialLedgerState(150000, 250000);
    state = recordTransaction(state, {
      day: 1, timeMinutes: 420, category: "market_supply",
      description: "Mua trà và sữa tại sạp Cô Hạnh", amount: -40000,
    });
    state = recordTransaction(state, {
      day: 1, timeMinutes: 600, category: "tea_sale",
      description: "Bán 6 ly trà sữa trân châu", amount: 180000,
    });

    const { summary } = closeDayFinancials(state, 1);
    expect(summary.totalRevenue).toBe(180000);
    expect(summary.totalExpenses).toBe(40000);
    expect(summary.netProfit).toBe(140000);
    expect(summary.closingBalance).toBe(290000);
  });

  it("settles weekly rent on Day 7 if cash is sufficient", () => {
    let state = createInitialLedgerState(300000, 250000);
    const result = settleWeeklyRent(state, 7);
    expect(result.success).toBe(true);
    expect(result.familyLoanUsed).toBe(false);
    expect(result.state.currentBalance).toBe(50000);
    expect(result.state.nextRentDueDay).toBe(14);
  });

  it("triggers anti-softlock family loan from Father Quang if cash < rent on Day 7", () => {
    let state = createInitialLedgerState(50000, 250000);
    const result = settleWeeklyRent(state, 7);
    expect(result.success).toBe(true);
    expect(result.familyLoanUsed).toBe(true);
    expect(result.state.familyLoanActive).toBe(true);
    expect(result.state.currentBalance).toBeGreaterThanOrEqual(0);
  });
});
