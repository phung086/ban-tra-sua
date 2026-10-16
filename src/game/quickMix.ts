import { scoreDrink, updateDraft } from "./engine";
import type { DrinkDraft, GameState } from "./types";

/** One-tap service choice: faster in real player actions, less precise on quality.
 * No RNG, clock reset, ingredient mutation or new save fields.
 */
// Existing technique weights: 40 fill points off costs 6; 60 shake points off costs 6.
export const QUICK_MIX_PENALTY = 12;
const quickPatch = (state: GameState): Partial<DrinkDraft> => ({
  fill: state.currentOrder!.targetFill - 40,
  shake: state.currentOrder!.targetShake <= 40
    ? state.currentOrder!.targetShake + 60
    : state.currentOrder!.targetShake - 60,
  rushed: true,
});

export function quickMixDrink(state: GameState): GameState {
  if (state.phase !== "open" || !state.currentOrder || state.draft.sealed) return state;
  const next = updateDraft(state, quickPatch(state));
  return { ...next, notice: "⚡ Đã pha nhanh: bỏ qua hai lượt canh kim, chất lượng bị trừ 12 điểm. Khách vẫn đang chờ." };
}

/** Deliberately restarting careful mixing clears the penalty but both gauges
 * must be played again; changing only one gauge does not erase rushed status.
 */
export function restartCarefulMix(state: GameState): GameState {
  if (state.phase !== "open" || !state.currentOrder || state.draft.sealed || !state.draft.rushed) return state;
  const next = updateDraft(state, { fill: 0, shake: 0, rushed: false });
  return { ...next, notice: "Đã chọn pha kỹ lại: canh rót và lắc bằng tay để lấy lại điểm chất lượng. Đồng hồ khách không đặt lại." };
}

export function predictedQuickMixScore(state: GameState): number | null {
  if (state.phase !== "open" || !state.currentOrder || state.draft.sealed) return null;
  return scoreDrink(state.currentOrder, { ...state.draft, ...quickPatch(state), sealed: true });
}
