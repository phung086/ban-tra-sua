export type TransactionCategory =
  | "tea_sale"
  | "customer_tip"
  | "market_supply"
  | "rent_payment"
  | "decor_investment"
  | "social_meal"
  | "quest_reward"
  | "family_support";

export interface FinancialTransaction {
  id: string;
  day: number;
  timeMinutes: number;
  category: TransactionCategory;
  description: string;
  amount: number;
}

export interface DailyFinancialSummary {
  day: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  closingBalance: number;
  marginPercent: number;
  rentDueInDays: number;
  isRentWarning: boolean;
  transactionsCount: number;
}

export interface FinancialLedgerState {
  currentBalance: number;
  weeklyRentAmount: number;
  nextRentDueDay: number;
  todayTransactions: FinancialTransaction[];
  history: DailyFinancialSummary[];
  familyLoanActive: boolean;
  familyLoanAmount: number;
}

export function createInitialLedgerState(initialCash = 150000, weeklyRent = 250000): FinancialLedgerState {
  return {
    currentBalance: initialCash,
    weeklyRentAmount: weeklyRent,
    nextRentDueDay: 7,
    todayTransactions: [{
      id: "tx-day1-init",
      day: 1,
      timeMinutes: 360,
      category: "tea_sale",
      description: "Vốn ban đầu mở tiệm trà",
      amount: initialCash,
    }],
    history: [],
    familyLoanActive: false,
    familyLoanAmount: 0,
  };
}

export function recordTransaction(state: FinancialLedgerState, tx: Omit<FinancialTransaction, "id">): FinancialLedgerState {
  const transaction: FinancialTransaction = {
    ...tx,
    id: `tx-d${tx.day}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };
  return {
    ...state,
    currentBalance: Math.max(0, state.currentBalance + tx.amount),
    todayTransactions: [...state.todayTransactions, transaction],
  };
}

export function closeDayFinancials(state: FinancialLedgerState, day: number): { state: FinancialLedgerState; summary: DailyFinancialSummary } {
  let totalRevenue = 0;
  let totalExpenses = 0;
  for (const tx of state.todayTransactions) {
    if (tx.amount > 0 && tx.id !== "tx-day1-init") {
      totalRevenue += tx.amount;
    } else if (tx.amount < 0) {
      totalExpenses += Math.abs(tx.amount);
    }
  }
  const netProfit = totalRevenue - totalExpenses;
  const marginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const rentDueInDays = Math.max(0, state.nextRentDueDay - day);
  const isRentWarning = rentDueInDays <= 2 && state.currentBalance < state.weeklyRentAmount;

  const summary: DailyFinancialSummary = {
    day,
    totalRevenue,
    totalExpenses,
    netProfit,
    closingBalance: state.currentBalance,
    marginPercent,
    rentDueInDays,
    isRentWarning,
    transactionsCount: state.todayTransactions.length,
  };

  return {
    state: {
      ...state,
      todayTransactions: [],
      history: [...state.history, summary],
    },
    summary,
  };
}

export interface RentSettlementResult {
  state: FinancialLedgerState;
  success: boolean;
  message: string;
  familyLoanUsed: boolean;
}

export function settleWeeklyRent(state: FinancialLedgerState, currentDay: number): RentSettlementResult {
  if (currentDay < state.nextRentDueDay) {
    return {
      state,
      success: true,
      message: `Chưa đến hạn nộp tiền thuê (còn ${state.nextRentDueDay - currentDay} ngày).`,
      familyLoanUsed: false,
    };
  }

  const rent = state.weeklyRentAmount;
  if (state.currentBalance >= rent) {
    const nextBalance = state.currentBalance - rent;
    const rentTx: FinancialTransaction = {
      id: `tx-rent-day${currentDay}`,
      day: currentDay,
      timeMinutes: 480,
      category: "rent_payment",
      description: `Tiền thuê mặt bằng tuần (Ngày ${currentDay})`,
      amount: -rent,
    };
    return {
      state: {
        ...state,
        currentBalance: nextBalance,
        nextRentDueDay: state.nextRentDueDay + 7,
        todayTransactions: [...state.todayTransactions, rentTx],
      },
      success: true,
      message: `Đã thanh toán tiền thuê mặt bằng tuần: -${rent.toLocaleString("vi-VN")}đ.`,
      familyLoanUsed: false,
    };
  }

  const deficit = rent - state.currentBalance;
  const loanAmount = Math.max(100000, deficit + 50000);
  const loanTx: FinancialTransaction = {
    id: `tx-loan-day${currentDay}`,
    day: currentDay,
    timeMinutes: 470,
    category: "family_support",
    description: "Bố Quang hỗ trợ tạm ứng tiền thuê mặt bằng",
    amount: loanAmount,
  };
  const rentTx: FinancialTransaction = {
    id: `tx-rent-day${currentDay}`,
    day: currentDay,
    timeMinutes: 480,
    category: "rent_payment",
    description: `Tiền thuê mặt bằng tuần (Ngày ${currentDay})`,
    amount: -rent,
  };

  const nextBalance = state.currentBalance + loanAmount - rent;
  return {
    state: {
      ...state,
      currentBalance: nextBalance,
      nextRentDueDay: state.nextRentDueDay + 7,
      familyLoanActive: true,
      familyLoanAmount: state.familyLoanAmount + loanAmount,
      todayTransactions: [...state.todayTransactions, loanTx, rentTx],
    },
    success: true,
    message: `Bố Quang ghé tiệm đưa ${loanAmount.toLocaleString("vi-VN")}đ giúp bạn trang trải tiền thuê mặt bằng tuần này!`,
    familyLoanUsed: true,
  };
}
