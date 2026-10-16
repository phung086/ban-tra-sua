import React, { useState } from 'react';
import {
  CATALOG_DECOR_ITEMS,
  type DecorItem,
  type DecorSlotId,
  type ShopDecorState,
  computeActiveDecorBonuses,
} from '../game/lifeSim/shopDecorEngine';
import { pulseFeedback } from '../../../game/feedback';

interface ShopDecorModalProps {
  decorState: ShopDecorState;
  playerCash: number;
  currentDay: number;
  onPurchase: (itemId: string) => void;
  onEquip: (itemId: string) => void;
  onClose?: () => void;
}

export const ShopDecorModal: React.FC<ShopDecorModalProps> = ({
  decorState,
  playerCash,
  currentDay,
  onPurchase,
  onEquip,
  onClose,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<DecorSlotId | 'all'>('all');
  const bonuses = computeActiveDecorBonuses(decorState);

  const filteredItems =
    selectedSlot === 'all'
      ? CATALOG_DECOR_ITEMS
      : CATALOG_DECOR_ITEMS.filter((item) => item.slot === selectedSlot);

  return (
    <div
      className="shop-decor-modal"
      role="dialog"
      aria-labelledby="decor-modal-title"
    >
      <header className="decor-header">
        <div>
          <span className="decor-badge">Nâng cấp không gian tiệm</span>
          <h2 id="decor-modal-title">Trang Trí Quầy Trà & Vỉa Hè Phố Cổ</h2>
        </div>
        {onClose && (
          <button
            type="button"
            className="decor-close-btn"
            onClick={onClose}
            aria-label="Đóng bảng trang trí"
          >
            ✕
          </button>
        )}
      </header>

      {/* Bonus Banner */}
      <div className="decor-bonus-summary">
        <div className="bonus-pill">
          <span>Lưu lượng khách:</span>
          <strong>+{Math.round((bonuses.totalFootfallMultiplier - 1) * 100)}%</strong>
        </div>
        <div className="bonus-pill">
          <span>Điểm kiên nhẫn hiên quán:</span>
          <strong>+{bonuses.totalComfortBonus}</strong>
        </div>
        <div className="bonus-pill">
          <span>Ngân sách hiện có:</span>
          <strong className="text-cash">{playerCash.toLocaleString('vi-VN')}đ</strong>
        </div>
      </div>

      {/* Category Filter */}
      <nav className="decor-slot-filter" role="tablist">
        <button
          type="button"
          className={`slot-filter-btn ${selectedSlot === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedSlot('all')}
        >
          Tất cả ({CATALOG_DECOR_ITEMS.length})
        </button>
        <button
          type="button"
          className={`slot-filter-btn ${selectedSlot === 'sidewalk_seating' ? 'active' : ''}`}
          onClick={() => setSelectedSlot('sidewalk_seating')}
        >
          Chỗ ngồi vỉa hè
        </button>
        <button
          type="button"
          className={`slot-filter-btn ${selectedSlot === 'entrance_lantern' ? 'active' : ''}`}
          onClick={() => setSelectedSlot('entrance_lantern')}
        >
          Đèn lồng
        </button>
        <button
          type="button"
          className={`slot-filter-btn ${selectedSlot === 'vintage_signboard' ? 'active' : ''}`}
          onClick={() => setSelectedSlot('vintage_signboard')}
        >
          Biển hiệu
        </button>
        <button
          type="button"
          className={`slot-filter-btn ${selectedSlot === 'potted_plants' ? 'active' : ''}`}
          onClick={() => setSelectedSlot('potted_plants')}
        >
          Cây cảnh
        </button>
      </nav>

      {/* Items Grid */}
      <div className="decor-items-grid">
        {filteredItems.map((item) => {
          const isOwned = decorState.purchasedItemIds.includes(item.id);
          const isEquipped = decorState.equippedSlots[item.slot] === item.id;
          const isLocked = currentDay < item.unlockedAtDay;
          const canAfford = playerCash >= item.costCash;

          return (
            <div key={item.id} className={`decor-card ${isEquipped ? 'equipped' : ''}`}>
              <div className="decor-card-top">
                <h4>{item.displayName}</h4>
                <span className="decor-category">{item.categoryName}</span>
              </div>

              <p className="decor-desc">{item.visualDescription}</p>

              <div className="decor-stats">
                <span className="stat-footfall">+{item.footfallBonusPercent}% khách</span>
                <span className="stat-comfort">+{item.comfortBonus} thoải mái</span>
              </div>

              <div className="decor-card-action">
                {isEquipped ? (
                  <span className="badge-equipped">Đang trưng bày ✨</span>
                ) : isOwned ? (
                  <button
                    type="button"
                    className="btn-equip-decor"
                    onClick={() => {
                      pulseFeedback('tap');
                      onEquip(item.id);
                    }}
                  >
                    Trưng bày lên quầy
                  </button>
                ) : isLocked ? (
                  <span className="badge-locked">Mở khóa Ngày {item.unlockedAtDay} 🔒</span>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford}
                    className={`btn-buy-decor ${!canAfford ? 'disabled' : ''}`}
                    onClick={() => {
                      pulseFeedback('good');
                      onPurchase(item.id);
                    }}
                  >
                    Mua ({item.costCash.toLocaleString('vi-VN')}đ)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
