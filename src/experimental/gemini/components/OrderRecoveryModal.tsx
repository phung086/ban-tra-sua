import React from 'react';
import {
  type OrderDeliveryAssessment,
  type OrderRecoveryActionId,
} from '../game/lifeSim/npcInteractionEngine';
import { pulseFeedback } from '../../../game/feedback';

interface OrderRecoveryModalProps {
  assessment: OrderDeliveryAssessment;
  onSelectRecovery: (choiceId: OrderRecoveryActionId) => void;
}

export const OrderRecoveryModal: React.FC<OrderRecoveryModalProps> = ({
  assessment,
  onSelectRecovery,
}) => {
  if (!assessment.needsRecovery) return null;

  return (
    <section
      className="life-modal-card order-recovery-card"
      role="dialog"
      aria-labelledby="order-recovery-title"
    >
      <header className="life-modal-header">
        <span className="life-badge-warn">Khách cần hỗ trợ tại quầy</span>
        <h3 id="order-recovery-title">Xử lý phản hồi ly nước</h3>
      </header>

      <blockquote className="npc-speech-bubble">
        {assessment.customerDialogue}
      </blockquote>

      <div className="life-options-list" role="group" aria-label="Cách xử lý đơn hàng">
        {assessment.recoveryOptions.map((opt, idx) => (
          <button
            key={opt.id}
            type="button"
            className="life-choice-btn"
            onClick={() => {
              pulseFeedback(opt.resultingMood === 'happy' ? 'good' : 'tap');
              onSelectRecovery(opt.id);
            }}
          >
            <div className="life-choice-top">
              <strong>
                {idx + 1}. {opt.label}
              </strong>
              <span className="life-choice-deltas">
                <em className="delta-cash">+{opt.cashDelta.toLocaleString('vi-VN')}đ</em>
                {opt.timeSecondsDelta > 0 && (
                  <em className="delta-time">-{opt.timeSecondsDelta}s</em>
                )}
                <em className="delta-rel">
                  Quan hệ {opt.relationshipDelta >= 0 ? `+${opt.relationshipDelta}` : opt.relationshipDelta}
                </em>
              </span>
            </div>
            <p className="life-choice-desc">{opt.description}</p>
            <small className="life-choice-callback">
              Hệ quả: {opt.tomorrowCallbackText}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
};
