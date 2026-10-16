import type { CanonicalNpcId } from '../game/lifeSim/npcInteractionEngine';
import React, { useState } from 'react';
import {
  type CustomerNotebookState,
} from '../game/lifeSim/customerNotebook';
import { pulseFeedback } from '../../../game/feedback';

interface CustomerNotebookModalProps {
  notebookState: CustomerNotebookState;
  onClaimQuest?: (questId: string) => void;
  onClose?: () => void;
}

export const CustomerNotebookModal: React.FC<CustomerNotebookModalProps> = ({
  notebookState,
  onClaimQuest,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'quests' | 'reputation'>('customers');
  const [selectedNpcId, setSelectedNpcId] = useState<CanonicalNpcId>('linh');

  const recordList = Object.values(notebookState.records);
  const selectedRecord = notebookState.records[selectedNpcId] ?? recordList[0];

  return (
    <div
      className="customer-notebook-modal"
      role="dialog"
      aria-labelledby="notebook-title"
    >
      <header className="notebook-header">
        <div>
          <span className="notebook-badge">Sổ tay quán trà phố cổ</span>
          <h2 id="notebook-title">Ghi nhớ Khách Quen & Nhiệm Vụ Phố</h2>
        </div>
        {onClose && (
          <button
            type="button"
            className="notebook-close-btn"
            onClick={onClose}
            aria-label="Đóng sổ tay"
          >
            ✕
          </button>
        )}
      </header>

      {/* Tabs */}
      <nav className="notebook-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'customers'}
          className={`notebook-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => {
            pulseFeedback('tap');
            setActiveTab('customers');
          }}
        >
          Khách Quen ({recordList.filter((r) => r.timesServed > 0).length}/14)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quests'}
          className={`notebook-tab-btn ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => {
            pulseFeedback('tap');
            setActiveTab('quests');
          }}
        >
          Nhiệm Vụ Phố ({notebookState.dailyQuests.filter((q) => q.isCompleted).length}/{notebookState.dailyQuests.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reputation'}
          className={`notebook-tab-btn ${activeTab === 'reputation' ? 'active' : ''}`}
          onClick={() => {
            pulseFeedback('tap');
            setActiveTab('reputation');
          }}
        >
          Danh Tiếng ({notebookState.milestones.filter((m) => m.isUnlocked).length}/3)
        </button>
      </nav>

      {/* Tab 1: Customer Preferences */}
      {activeTab === 'customers' && (
        <div className="notebook-body notebook-two-col">
          <div className="notebook-npc-selector" role="listbox">
            {recordList.map((rec) => {
              const isSelected = rec.npcId === selectedNpcId;
              const hasMet = rec.timesServed > 0;
              return (
                <button
                  key={rec.npcId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`npc-select-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    pulseFeedback('tap');
                    setSelectedNpcId(rec.npcId);
                  }}
                >
                  <span className="npc-avatar-initial">
                    {hasMet ? rec.profile.displayName.charAt(0) : '?'}
                  </span>
                  <div className="npc-select-meta">
                    <strong>{hasMet ? rec.profile.displayName : 'Chưa gặp'}</strong>
                    <small>{rec.profile.roleTitle}</small>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="notebook-npc-detail">
            <h3 className="detail-name">{selectedRecord.profile.displayName}</h3>
            <p className="detail-role">{selectedRecord.profile.roleTitle}</p>

            <div className="preference-grid">
              <div className="pref-item">
                <span>Khẩu vị đường:</span>
                <strong>
                  {selectedRecord.discovered.sweetness
                    ? `${selectedRecord.profile.preferredSweetness}% đường`
                    : '??? (chưa khám phá)'}
                </strong>
              </div>
              <div className="pref-item">
                <span>Lượng đá quen:</span>
                <strong>
                  {selectedRecord.discovered.ice
                    ? `${selectedRecord.profile.preferredIce}% đá`
                    : '??? (chưa khám phá)'}
                </strong>
              </div>
              <div className="pref-item">
                <span>Topping ruột:</span>
                <strong>
                  {selectedRecord.discovered.favoriteTopping
                    ? selectedRecord.profile.favoriteTopping
                    : '??? (chưa khám phá)'}
                </strong>
              </div>
            </div>

            <div className="detail-note-box">
              <h4>Ghi chú riêng</h4>
              <p>
                {selectedRecord.unlockedNoteText ||
                  'Phục vụ ly trà chuẩn vị để mở khóa thói quen và tính cách riêng của khách.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Daily Neighborhood Quests */}
      {activeTab === 'quests' && (
        <div className="notebook-body">
          <div className="quest-list">
            {notebookState.dailyQuests.map((quest) => (
              <div key={quest.id} className="quest-card">
                <div className="quest-info">
                  <h4>{quest.title}</h4>
                  <p>{quest.description}</p>
                  <div className="quest-rewards">
                    <span className="reward-cash">+{quest.rewardCash.toLocaleString('vi-VN')}đ</span>
                    <span className="reward-rep">+{quest.rewardReputation} Danh tiếng</span>
                  </div>
                </div>

                <div className="quest-action">
                  {quest.isClaimed ? (
                    <span className="badge-claimed">Đã nhận thưởng ✔</span>
                  ) : quest.isCompleted ? (
                    <button
                      type="button"
                      className="btn-claim-quest"
                      onClick={() => {
                        pulseFeedback('good');
                        onClaimQuest?.(quest.id);
                      }}
                    >
                      Nhận thưởng ✨
                    </button>
                  ) : (
                    <span className="badge-progress">
                      {quest.currentCount}/{quest.targetCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Reputation Milestones */}
      {activeTab === 'reputation' && (
        <div className="notebook-body">
          <div className="milestone-list">
            {notebookState.milestones.map((m) => (
              <div
                key={m.level}
                className={`milestone-card ${m.isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="milestone-badge">Mốc {m.level}</div>
                <div className="milestone-info">
                  <h4>{m.title}</h4>
                  <p>{m.bonusDescription}</p>
                  <small>
                    Yêu cầu: Hiểu rõ khẩu vị của {m.requiredUnderstoodNpcs} khách quen
                  </small>
                </div>
                <div className="milestone-status">
                  {m.isUnlocked ? 'Đã kích hoạt ✨' : 'Chưa đạt'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
