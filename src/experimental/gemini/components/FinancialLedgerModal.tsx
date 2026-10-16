import React from "react";
import { type FinancialLedgerState } from "../game/lifeSim/financialLedger";

interface FinancialLedgerModalProps {
  ledgerState: FinancialLedgerState;
  onClose?: () => void;
}

export const FinancialLedgerModal: React.FC<FinancialLedgerModalProps> = ({ ledgerState, onClose }) => {
  const historyList = ledgerState.history.slice(-7);
  const maxBarAmount = Math.max(100000, ...historyList.map((h) => Math.max(h.totalRevenue, h.totalExpenses)));

  return (
    <div className="financial-ledger-modal" role="dialog" aria-labelledby="ledger-title">
      <header className="ledger-header">
        <div>
          <span className="ledger-badge">Sổ cái tài chính phố An Hòa</span>
          <h2 id="ledger-title">Cân Đối Thu Chi & Tiền Thuê Quán</h2>
        </div>
        {onClose && (
          <button type="button" className="ledger-close-btn" onClick={onClose} aria-label="Đóng sổ tài chính">✕</button>
        )}
      </header>

      <div className="ledger-overview-grid">
        <div className="overview-card">
          <span>Tiền mặt trong két</span>
          <strong className="text-cash">{ledgerState.currentBalance.toLocaleString("vi-VN")}đ</strong>
        </div>
        <div className="overview-card">
          <span>Tiền thuê tuần</span>
          <strong className="text-rent">{ledgerState.weeklyRentAmount.toLocaleString("vi-VN")}đ</strong>
          <small>Hạn nộp: Ngày {ledgerState.nextRentDueDay}</small>
        </div>
        <div className="overview-card">
          <span>Khoản hỗ trợ gia đình</span>
          <strong>
            {ledgerState.familyLoanActive ? `${ledgerState.familyLoanAmount.toLocaleString("vi-VN")}đ` : "0đ (Tự chủ tài chính)"}
          </strong>
        </div>
      </div>

      <div className="ledger-chart-section">
        <h3>Biểu đồ Thu / Chi 7 ngày gần nhất</h3>
        {historyList.length === 0 ? (
          <p className="ledger-empty">Chưa có dữ liệu lịch sử các ngày trước.</p>
        ) : (
          <div className="svg-chart-container">
            <svg viewBox="0 0 350 120" className="ledger-svg-chart" aria-label="Biểu đồ cột thu chi">
              {historyList.map((h, idx) => {
                const x = 20 + idx * 46;
                const revHeight = (h.totalRevenue / maxBarAmount) * 80;
                const expHeight = (h.totalExpenses / maxBarAmount) * 80;
                return (
                  <g key={h.day} className="chart-day-group">
                    <rect x={x} y={95 - revHeight} width="16" height={Math.max(2, revHeight)} rx="3" fill="#2a9d8f" />
                    <rect x={x + 18} y={95 - expHeight} width="16" height={Math.max(2, expHeight)} rx="3" fill="#e76f51" />
                    <text x={x + 16} y="112" textAnchor="middle" fontSize="10" fill="#666">N{h.day}</text>
                  </g>
                );
              })}
            </svg>
            <div className="chart-legend">
              <span className="legend-rev">■ Doanh thu</span>
              <span className="legend-exp">■ Chi phí</span>
            </div>
          </div>
        )}
      </div>

      <div className="ledger-tx-section">
        <h3>Giao dịch ghi nhận trong ngày</h3>
        {ledgerState.todayTransactions.length === 0 ? (
          <p className="ledger-empty">Chưa có giao dịch phát sinh hôm nay.</p>
        ) : (
          <ul className="ledger-tx-list">
            {ledgerState.todayTransactions.map((tx) => (
              <li key={tx.id} className="ledger-tx-item">
                <div className="tx-meta">
                  <strong>{tx.description}</strong>
                  <small>{tx.category}</small>
                </div>
                <span className={`tx-amount ${tx.amount >= 0 ? "pos" : "neg"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString("vi-VN")}đ
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
