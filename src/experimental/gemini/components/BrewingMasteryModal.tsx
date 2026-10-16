import React, { useState } from 'react';
import {
  HANOI_SPECIALTY_RECIPES,
  type BrewingMasteryState,
  type MasterySkillId,
  computeCraftingPerks,
} from '../game/lifeSim/brewingMasteryEngine';
import { pulseFeedback } from '../../../game/feedback';

interface BrewingMasteryModalProps {
  masteryState: BrewingMasteryState;
  onUpgradeSkill: (skillId: MasterySkillId) => void;
  onClose?: () => void;
}

export const BrewingMasteryModal: React.FC<BrewingMasteryModalProps> = ({
  masteryState,
  onUpgradeSkill,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'recipes'>('skills');
  const perks = computeCraftingPerks(masteryState);

  const tierTitle =
    masteryState.tier === 'master_artisan'
      ? 'Nghệ Nhân Trà Phố Cổ'
      : masteryState.tier === 'journeyman'
      ? 'Thợ Pha Phố Cổ'
      : 'Người Học Việc';

  return (
    <div
      className="brewing-mastery-modal"
      role="dialog"
      aria-labelledby="mastery-modal-title"
    >
      <header className="mastery-header">
        <div>
          <span className="mastery-badge">Tay nghề tiệm trà phố</span>
          <h2 id="mastery-modal-title">Cây Kỹ Năng & Công Thức Đặc Sản</h2>
        </div>
        {onClose && (
          <button
            type="button"
            className="mastery-close-btn"
            onClick={onClose}
            aria-label="Đóng bảng tay nghề"
          >
            ✕
          </button>
        )}
      </header>

      {/* Tier & XP Banner */}
      <div className="mastery-tier-card">
        <div className="tier-info">
          <span className="tier-label">Cấp bậc hiện tại</span>
          <h3 className="tier-name">{tierTitle}</h3>
        </div>
        <div className="tier-stats">
          <div className="tier-xp">
            <span>Kinh nghiệm:</span>
            <strong>{masteryState.currentXp} XP</strong>
          </div>
          <div className="tier-sp">
            <span>Điểm kỹ năng sẵn sàng:</span>
            <strong className="text-sp">+{masteryState.skillPoints} SP</strong>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <nav className="mastery-tabs" role="tablist">
        <button
          type="button"
          className={`mastery-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => {
            pulseFeedback('tap');
            setActiveTab('skills');
          }}
        >
          Kỹ Năng Pha Chế (4)
        </button>
        <button
          type="button"
          className={`mastery-tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => {
            pulseFeedback('tap');
            setActiveTab('recipes');
          }}
        >
          Đặc Sản Hà Nội ({masteryState.unlockedRecipeIds.length}/{HANOI_SPECIALTY_RECIPES.length})
        </button>
      </nav>

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="mastery-body">
          <div className="skills-grid">
            {Object.values(masteryState.skills).map((skill) => {
              const isMax = skill.currentLevel >= skill.maxLevel;
              const canAfford = masteryState.skillPoints >= skill.costSkillPoints && !isMax;

              return (
                <div key={skill.id} className={`skill-card ${isMax ? 'maxed' : ''}`}>
                  <div className="skill-card-top">
                    <h4>{skill.name}</h4>
                    <span className="skill-level">Cấp {skill.currentLevel}/{skill.maxLevel}</span>
                  </div>
                  <p className="skill-desc">{skill.description}</p>
                  <small className="skill-effect">{skill.effectDescription}</small>

                  <div className="skill-card-action">
                    {isMax ? (
                      <span className="badge-maxed">Tối đa ✨</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        className={`btn-upgrade-skill ${!canAfford ? 'disabled' : ''}`}
                        onClick={() => {
                          pulseFeedback('good');
                          onUpgradeSkill(skill.id);
                        }}
                      >
                        Học Cấp {skill.currentLevel + 1} (1 SP)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="perks-summary-box">
            <h4>Hiệu ứng kích hoạt trên quầy pha chế:</h4>
            <ul>
              <li>Dung sai rót trà: <strong>+{Math.round((perks.pourToleranceMultiplier - 1) * 100)}%</strong></li>
              <li>Vùng căn ngọt chuẩn vị: <strong>+{perks.gaugeTargetToleranceAdd} đơn vị</strong></li>
              <li>Thời gian lắc bình shaker: <strong>{perks.shakerDurationMs}ms</strong></li>
            </ul>
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div className="mastery-body">
          <div className="recipes-grid">
            {HANOI_SPECIALTY_RECIPES.map((recipe) => {
              const isUnlocked = masteryState.unlockedRecipeIds.includes(recipe.id);

              return (
                <div key={recipe.id} className={`recipe-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="recipe-card-top">
                    <h4>{recipe.name}</h4>
                    <span className="recipe-price">{recipe.basePrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <p className="recipe-desc">{recipe.description}</p>
                  <blockquote className="recipe-taste">{recipe.tasteNote}</blockquote>

                  <div className="recipe-card-status">
                    {isUnlocked ? (
                      <span className="badge-recipe-unlocked">Đã mở khóa trên quầy ✨</span>
                    ) : (
                      <span className="badge-recipe-locked">Yêu cầu cấp bậc: {recipe.unlockedAtTier} 🔒</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
