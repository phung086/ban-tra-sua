import React from "react";
import {
  BREAKFAST_CATALOG,
  type MorningWakeState,
  type BreakfastChoiceId,
} from "../../game/lifeSim/morningWakeEngine";
import { pulseFeedback } from '../../../../game/feedback';

interface MorningWakeModalProps {
  morningState: MorningWakeState;
  onOpenShutter: () => void;
  onSweepSidewalk: () => void;
  onChooseBreakfast: (choiceId: BreakfastChoiceId) => void;
  onStartOpeningDay: () => void;
}

export const MorningWakeModal: React.FC<MorningWakeModalProps> = ({
  morningState,
  onOpenShutter,
  onSweepSidewalk,
  onChooseBreakfast,
  onStartOpeningDay,
}) => {
  const hours = Math.floor(morningState.timeMinutes / 60).toString().padStart(2, "0");
  const mins = (morningState.timeMinutes % 60).toString().padStart(2, "0");

  return (
    <div className="life-modal-card morning-wake-modal" role="dialog" aria-labelledby="morning-title">
      <header className="life-modal-header">
        <span className="life-badge-morning">Bình minh phố An Hòa • {hours}:{mins}</span>
        <h2 id="morning-title">Khởi Đầu Ngày {morningState.day}</h2>
      </header>

      <blockquote className="npc-speech-bubble morning-ambience">
        {morningState.ambientStreetSoundCue}
      </blockquote>

      <div className="eod-metrics-grid morning-stats-bar">
        <div className="eod-metric-box">
          <span>Năng lượng</span>
          <strong>{morningState.energy}/100</strong>
        </div>
        <div className="eod-metric-box">
          <span>Độ no</span>
          <strong>{morningState.satiety}/100</strong>
        </div>
        <div className="eod-metric-box">
          <span>Tiền mặt</span>
          <strong className="text-cash">{morningState.currentCash.toLocaleString("vi-VN")}đ</strong>
        </div>
      </div>

      <div className="morning-routine-checklist">
        <h3>Chuẩn bị mở cửa tiệm</h3>
        <div className="routine-buttons-row">
          <button
            type="button"
            disabled={morningState.shutterOpened}
            className={`routine-step-btn ${morningState.shutterOpened ? "completed" : ""}`}
            onClick={() => {
              pulseFeedback("tap");
              onOpenShutter();
            }}
          >
            {morningState.shutterOpened ? "✓ Đã mở cửa cuốn đón nắng" : "1. Kéo mở cửa cuốn sắt"}
          </button>

          <button
            type="button"
            disabled={morningState.sidewalkSwept}
            className={`routine-step-btn ${morningState.sidewalkSwept ? "completed" : ""}`}
            onClick={() => {
              pulseFeedback("tap");
              onSweepSidewalk();
            }}
          >
            {morningState.sidewalkSwept ? "✓ Đã quét sạch vỉa hè" : "2. Quét lá rụng trước hiên"}
          </button>
        </div>
      </div>

      <div className="morning-breakfast-section">
        <h3>Bữa sáng phố nhỏ</h3>
        {morningState.breakfastConsumed && morningState.selectedBreakfast ? (
          <p className="breakfast-done-badge">
            Đã dùng: <strong>{morningState.selectedBreakfast.name}</strong>
          </p>
        ) : (
          <div className="breakfast-cards-grid">
            {BREAKFAST_CATALOG.map((b) => (
              <button
                key={b.id}
                type="button"
                className="breakfast-item-card"
                onClick={() => {
                  pulseFeedback("good");
                  onChooseBreakfast(b.id);
                }}
              >
                <div className="bf-top">
                  <strong>{b.name}</strong>
                  <span className="bf-price">{b.costCash === 0 ? "Miễn phí" : `${b.costCash.toLocaleString("vi-VN")}đ`}</span>
                </div>
                <p className="bf-desc">{b.description}</p>
                <div className="bf-perks">
                  <span>+{b.energyBonus} Năng lượng</span>
                  <span>+{b.satietyBonus} Độ no</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!morningState.readyToOpenShop}
        className={`eod-sleep-save-btn start-day-btn ${!morningState.readyToOpenShop ? "disabled" : ""}`}
        onClick={() => {
          pulseFeedback("good");
          onStartOpeningDay();
        }}
      >
        {morningState.readyToOpenShop ? "Sẵn sàng mở tiệm đón khách đầu tiên! ✨" : "Hoàn thành 3 bước trên để mở quán"}
      </button>
    </div>
  );
};
