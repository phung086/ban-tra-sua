import React from 'react';
import { type EndOfDaySummaryReport } from '../../game/lifeSim/npcInteractionEngine';
import { pulseFeedback } from '../../../../game/feedback';

interface EndOfDaySummaryModalProps {
  report: EndOfDaySummaryReport;
  onSleepAndSave: () => void;
}

export const EndOfDaySummaryModal: React.FC<EndOfDaySummaryModalProps> = ({
  report,
  onSleepAndSave,
}) => {
  return (
    <section
      className="life-modal-card end-of-day-card"
      role="dialog"
      aria-labelledby="eod-title"
    >
      <header className="life-modal-header">
        <span className="life-badge-night">Khép lại Ngày {report.day}</span>
        <h3 id="eod-title">{report.headline}</h3>
      </header>

      <div className="eod-metrics-grid">
        <div className="eod-metric-box">
          <span>Thu bán trà</span>
          <strong className="text-pos">+{report.earnedCash.toLocaleString('vi-VN')}đ</strong>
        </div>
        <div className="eod-metric-box">
          <span>Chi sinh hoạt</span>
          <strong className="text-neg">-{report.spentCash.toLocaleString('vi-VN')}đ</strong>
        </div>
        <div className="eod-metric-box">
          <span>Tiền mặt cuối ngày</span>
          <strong>{report.closingCash.toLocaleString('vi-VN')}đ</strong>
        </div>
      </div>

      <div className="eod-section">
        <h4>Những người đã gặp hôm nay</h4>
        {report.encounters.length === 0 ? (
          <p className="eod-empty">Hôm nay bạn tập trung dọn quầy yên tĩnh.</p>
        ) : (
          <ul className="eod-list">
            {report.encounters.map((enc, idx) => (
              <li key={`${enc.npcId}-${idx}`}>
                <strong>{enc.displayName}</strong>: {enc.outcomeLabel}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="eod-section">
        <h4>Điều rút ra sau ca bán</h4>
        <ul className="eod-list">
          {report.lessonsLearned.map((lesson, idx) => (
            <li key={idx}>{lesson}</li>
          ))}
        </ul>
      </div>

      <div className="eod-section">
        <h4>Hệ quả đang chờ ngày mai</h4>
        <ul className="eod-list">
          {report.tomorrowConsequences.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="eod-sleep-save-btn"
        onClick={() => {
          pulseFeedback('good');
          onSleepAndSave();
        }}
      >
        Đi ngủ & Lưu hành trình sang Ngày {report.day + 1} 🌙
      </button>
    </section>
  );
};
