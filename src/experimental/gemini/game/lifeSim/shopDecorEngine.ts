export type DecorSlotId =
  | 'sidewalk_seating'
  | 'entrance_lantern'
  | 'vintage_signboard'
  | 'potted_plants'
  | 'counter_radio';

export interface DecorItem {
  id: string;
  slot: DecorSlotId;
  displayName: string;
  categoryName: string;
  costCash: number;
  unlockedAtDay: number;
  footfallBonusPercent: number; // +10% to +25% customer traffic
  comfortBonus: number; // +5 to +15 patience & satisfaction
  visualDescription: string;
}

export const CATALOG_DECOR_ITEMS: DecorItem[] = [
  {
    id: 'red_blue_plastic_chairs',
    slot: 'sidewalk_seating',
    displayName: 'Bàn ghế nhựa xanh đỏ vỉa hè',
    categoryName: 'Chỗ ngồi vỉa hè',
    costCash: 60000,
    unlockedAtDay: 1,
    footfallBonusPercent: 12,
    comfortBonus: 6,
    visualDescription: 'Bàn ghế nhựa thấp quen thuộc của phố cổ, tạo không gian ngồi tán gẫu thoải mái.',
  },
  {
    id: 'bamboo_low_stools',
    slot: 'sidewalk_seating',
    displayName: 'Bộ bàn ghế đẩu tre mộc mạc',
    categoryName: 'Chỗ ngồi vỉa hè',
    costCash: 120000,
    unlockedAtDay: 5,
    footfallBonusPercent: 18,
    comfortBonus: 10,
    visualDescription: 'Ghế đẩu tre thủ công đan nan mây, mang đậm nét hoài niệm Hà Nội xưa.',
  },
  {
    id: 'hoian_silk_lantern',
    slot: 'entrance_lantern',
    displayName: 'Đèn lồng lụa Hội An góc phố',
    categoryName: 'Đèn trang trí',
    costCash: 95000,
    unlockedAtDay: 10,
    footfallBonusPercent: 15,
    comfortBonus: 8,
    visualDescription: 'Ánh sáng vàng cam ấm áp tỏa rạng trước hiên vào chập tối, thu hút khách đi dạo.',
  },
  {
    id: 'hanoi_vintage_signboard',
    slot: 'vintage_signboard',
    displayName: 'Biển hiệu gỗ chữ nổi vẽ tay',
    categoryName: 'Biển hiệu tiệm',
    costCash: 150000,
    unlockedAtDay: 7,
    footfallBonusPercent: 22,
    comfortBonus: 12,
    visualDescription: 'Biển hiệu sơn son thiếp vàng chữ viết tay phong cách phố Hàng Bạc cổ điển.',
  },
  {
    id: 'monstera_ceramic_pots',
    slot: 'potted_plants',
    displayName: 'Chậu gốm cây trầu bà & hoa giấy',
    categoryName: 'Cây cảnh xanh',
    costCash: 50000,
    unlockedAtDay: 2,
    footfallBonusPercent: 10,
    comfortBonus: 8,
    visualDescription: 'Góc xanh dịu mắt làm mát hiên quán, bác Bình rất thích mỗi lần ghé qua.',
  },
  {
    id: 'vintage_cassette_radio',
    slot: 'counter_radio',
    displayName: 'Đài cassette băng từ góc quầy',
    categoryName: 'Âm thanh quầy',
    costCash: 80000,
    unlockedAtDay: 3,
    footfallBonusPercent: 14,
    comfortBonus: 10,
    visualDescription: 'Phát những giai điệu acoustic Trịnh Công Sơn êm đềm vào mỗi buổi chiều tan tầm.',
  },
];

export interface ShopDecorState {
  purchasedItemIds: string[];
  equippedSlots: Record<DecorSlotId, string | null>;
}

export function createInitialDecorState(): ShopDecorState {
  return {
    purchasedItemIds: ['red_blue_plastic_chairs'],
    equippedSlots: {
      sidewalk_seating: 'red_blue_plastic_chairs',
      entrance_lantern: null,
      vintage_signboard: null,
      potted_plants: null,
      counter_radio: null,
    },
  };
}

export interface PurchaseDecorResult {
  success: boolean;
  state: ShopDecorState;
  remainingCash: number;
  message: string;
}

export function purchaseDecorItem(
  state: ShopDecorState,
  itemId: string,
  playerCash: number,
  currentDay: number,
): PurchaseDecorResult {
  const item = CATALOG_DECOR_ITEMS.find((d) => d.id === itemId);
  if (!item) {
    return { success: false, state, remainingCash: playerCash, message: 'Vật phẩm không tồn tại.' };
  }

  if (state.purchasedItemIds.includes(itemId)) {
    return { success: false, state, remainingCash: playerCash, message: 'Đã sở hữu vật phẩm này.' };
  }

  if (currentDay < item.unlockedAtDay) {
    return {
      success: false,
      state,
      remainingCash: playerCash,
      message: `Mở khóa vào Ngày ${item.unlockedAtDay}.`,
    };
  }

  if (playerCash < item.costCash) {
    return {
      success: false,
      state,
      remainingCash: playerCash,
      message: `Cần thêm ${(item.costCash - playerCash).toLocaleString('vi-VN')}đ để mua.`,
    };
  }

  const nextPurchased = [...state.purchasedItemIds, itemId];
  const nextEquipped = {
    ...state.equippedSlots,
    [item.slot]: itemId, // auto-equip upon purchase
  };

  return {
    success: true,
    state: {
      purchasedItemIds: nextPurchased,
      equippedSlots: nextEquipped,
    },
    remainingCash: playerCash - item.costCash,
    message: `Đã mua và trang trí ${item.displayName}!`,
  };
}

export function equipDecorItem(
  state: ShopDecorState,
  itemId: string,
): ShopDecorState {
  const item = CATALOG_DECOR_ITEMS.find((d) => d.id === itemId);
  if (!item || !state.purchasedItemIds.includes(itemId)) {
    return state;
  }

  return {
    ...state,
    equippedSlots: {
      ...state.equippedSlots,
      [item.slot]: itemId,
    },
  };
}

export interface ActiveDecorBonuses {
  totalFootfallMultiplier: number;
  totalComfortBonus: number;
  activeItems: DecorItem[];
}

export function computeActiveDecorBonuses(state: ShopDecorState): ActiveDecorBonuses {
  let footfallPercentSum = 0;
  let totalComfortBonus = 0;
  const activeItems: DecorItem[] = [];

  for (const itemId of Object.values(state.equippedSlots)) {
    if (!itemId) continue;
    const item = CATALOG_DECOR_ITEMS.find((d) => d.id === itemId);
    if (item) {
      activeItems.push(item);
      footfallPercentSum += item.footfallBonusPercent;
      totalComfortBonus += item.comfortBonus;
    }
  }

  return {
    totalFootfallMultiplier: 1 + footfallPercentSum / 100,
    totalComfortBonus,
    activeItems,
  };
}
