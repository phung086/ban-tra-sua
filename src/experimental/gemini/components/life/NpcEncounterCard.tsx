import React from 'react';
import {
  CANONICAL_NPCS,
  type SocialChoiceId,
  type SocialInviteScenario,
} from '../../game/lifeSim/npcInteractionEngine';
import { pulseFeedback } from '../../../../game/feedback';

interface NpcEncounterCardProps {
  scenario: SocialInviteScenario;
  onChoose: (choiceId: SocialChoiceId) => void;
}

export const NpcEncounterCard: React.FC<NpcEncounterCardProps> = ({
  scenario,
  onChoose,
}) => {
  const npc = CANONICAL_NPCS[scenario.npcId];

  return (
    <section
      className="life-modal-card npc-encounter-card"
      role="dialog"
      aria-labelledby="npc-encounter-title"
    >
      <header className="life-modal-header">
        <div className="npc-header-meta">
          <span className="npc-avatar-badge" aria-hidden="true">
            {npc.displayName.charAt(0)}
          </span>
          <div>
            <h3 id="npc-encounter-title">{scenario.title}</h3>
            <small>{npc.roleTitle} • {scenario.locationName}</small>
          </div>
        </div>
      </header>

      <blockquote className="npc-speech-bubble">
        {scenario.dialoguePrompt}
      </blockquote>

      <p className="life-cost-notice">
        Chính sách chi tiêu: Chỉ trừ tiền sau khi bạn xác nhận lựa chọn bên dưới.
      </p>

      <div className="life-options-list" role="group" aria-label="Các lựa chọn phản hồi NPC">
        {scenario.options.map((opt, idx) => (
          <button
            key={opt.id}
            type="button"
            disabled={!opt.canAfford}
            className={`life-choice-btn ${!opt.canAfford ? 'is-disabled' : ''}`}
            onClick={() => {
              pulseFeedback('tap');
              onChoose(opt.id);
            }}
          >
            <div className="life-choice-top">
              <strong>
                {idx + 1}. {opt.label}
              </strong>
              <span className="life-choice-deltas">
                <em className="delta-cash">
                  {opt.cashDelta === 0
                    ? '0đ'
                    : `${opt.cashDelta.toLocaleString('vi-VN')}đ`}
                </em>
                {opt.timeMinutesDelta > 0 && (
                  <em className="delta-time">{opt.timeMinutesDelta} phút</em>
                )}
                {opt.satietyDelta > 0 && (
                  <em className="delta-satiety">Độ no +{opt.satietyDelta}</em>
                )}
                <em className="delta-rel">
                  Quan hệ {opt.relationshipDelta >= 0 ? `+${opt.relationshipDelta}` : opt.relationshipDelta}
                </em>
              </span>
            </div>
            <small className="life-choice-callback">
              Ngày mai: {opt.tomorrowConsequence}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
};
