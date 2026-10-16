export type BreakfastChoiceId =
  | "xoi_bap_ngo"
  | "banh_mi_pate"
  | "pho_bo_nong"
  | "self_cook";

export interface BreakfastOption {
  id: BreakfastChoiceId;
  name: string;
  description: string;
  costCash: number;
  timeMinutes: number;
  energyBonus: number;
  satietyBonus: number;
}

export const BREAKFAST_CATALOG: BreakfastOption[] = [
  {
    id: "xoi_bap_ngo",
    name: "Gói xôi bắp hành phi ngõ nhỏ",
    description: "Xôi bắp dẻo thơm, hành phi rắc giòn rụm từ gánh hàng rong đầu phố.",
    costCash: 15000,
    timeMinutes: 15,
    energyBonus: 18,
    satietyBonus: 35,
  },
  {
    id: "banh_mi_pate",
    name: "Ổ bánh mì pate giòn rụm",
    description: "Bánh mì nóng hổi kẹp pate béo ngậy, dưa góp chua ngọt và chút ớt tươi.",
    costCash: 22000,
    timeMinutes: 20,
    energyBonus: 25,
    satietyBonus: 45,
  },
  {
    id: "pho_bo_nong",
    name: "Tô phở bò tái lăn nước dùng trong",
    description: "Bát phở bốc khói nghi ngút, bánh phở mềm thơm, hồi quế ấm nồng.",
    costCash: 45000,
    timeMinutes: 30,
    energyBonus: 35,
    satietyBonus: 60,
  },
  {
    id: "self_cook",
    name: "Nấu bát mì tôm trứng tại quầy",
    description: "Tự nấu nhanh gọn tiết kiệm chi phí, đủ ấm bụng sẵn sàng mở cửa quán.",
    costCash: 0,
    timeMinutes: 15,
    energyBonus: 12,
    satietyBonus: 25,
  },
];

export interface MorningWakeState {
  day: number;
  timeMinutes: number;
  currentCash: number;
  energy: number;
  satiety: number;
  shutterOpened: boolean;
  sidewalkSwept: boolean;
  breakfastConsumed: boolean;
  selectedBreakfast: BreakfastOption | null;
  ambientStreetSoundCue: string;
  readyToOpenShop: boolean;
}

export function initMorningWake(params: {
  day: number;
  currentCash: number;
  sleptEarly?: boolean;
}): MorningWakeState {
  const baseEnergy = params.sleptEarly ? 88 : 74;
  return {
    day: params.day,
    timeMinutes: 6 * 60 + 15, // 06:15 AM
    currentCash: params.currentCash,
    energy: baseEnergy,
    satiety: 45, // slightly hungry upon waking
    shutterOpened: false,
    sidewalkSwept: false,
    breakfastConsumed: false,
    selectedBreakfast: null,
    ambientStreetSoundCue: "Tiếng chuông xe đạp lướt nhẹ, tiếng chim sẻ hót trên tán cây bàng góc phố.",
    readyToOpenShop: false,
  };
}

export function openShopShutter(state: MorningWakeState): MorningWakeState {
  if (state.shutterOpened) return state;
  return {
    ...state,
    shutterOpened: true,
    timeMinutes: state.timeMinutes + 5,
    ambientStreetSoundCue: "Cửa cuốn sắt kêu rào rạo thân quen, ánh nắng sớm ngập tràn quầy pha chế.",
    readyToOpenShop: state.breakfastConsumed && state.sidewalkSwept,
  };
}

export function sweepSidewalk(state: MorningWakeState): MorningWakeState {
  if (state.sidewalkSwept) return state;
  return {
    ...state,
    sidewalkSwept: true,
    timeMinutes: state.timeMinutes + 10,
    energy: Math.max(0, state.energy - 4),
    readyToOpenShop: state.shutterOpened && state.breakfastConsumed,
  };
}

export function chooseBreakfast(
  state: MorningWakeState,
  choiceId: BreakfastChoiceId,
): { state: MorningWakeState; success: boolean; message: string } {
  if (state.breakfastConsumed) {
    return { state, success: false, message: "Đã ăn sáng xong, sẵn sàng mở quầy trà." };
  }

  const option = BREAKFAST_CATALOG.find((b) => b.id === choiceId) ?? BREAKFAST_CATALOG[3];
  if (state.currentCash < option.costCash) {
    return {
      state,
      success: false,
      message: `Không đủ tiền mặt (${option.costCash.toLocaleString("vi-VN")}đ), hãy tự nấu tại quầy nhé!`,
    };
  }

  const nextCash = state.currentCash - option.costCash;
  const nextEnergy = Math.min(100, state.energy + option.energyBonus);
  const nextSatiety = Math.min(100, state.satiety + option.satietyBonus);

  const nextState: MorningWakeState = {
    ...state,
    currentCash: nextCash,
    energy: nextEnergy,
    satiety: nextSatiety,
    timeMinutes: state.timeMinutes + option.timeMinutes,
    breakfastConsumed: true,
    selectedBreakfast: option,
    readyToOpenShop: state.shutterOpened && state.sidewalkSwept,
  };

  return {
    state: nextState,
    success: true,
    message: `Đã dùng bữa ${option.name}! Năng lượng +${option.energyBonus}, Độ no +${option.satietyBonus}.`,
  };
}
