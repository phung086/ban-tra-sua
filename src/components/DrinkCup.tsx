import type { DrinkDraft } from "../game/types";
import { DRINKS } from "../game/content";
import { GameIcon } from "./GameIcon";
const teaColors: Record<DrinkDraft["base"], string> = {
  "classic-milk-tea": "#b98b68", "peach-tea": "#efb47d",
  "matcha-latte": "#91ab75", "oolong-milk-tea": "#ad815b",
  "taro-milk-tea": "#ad95be", "strawberry-milk": "#df9cae",
  "cocoa-milk": "#79513d", "lemon-tea": "#e7c56b",
};
export function DrinkCup({ draft }: { draft: DrinkDraft }) {
  return <div className="cup-readout" aria-label="Ly đang pha trên quầy"><GameIcon /><span className="tea-cup-visual" role="img" aria-label={`Màu trà và mức rót ${draft.fill}%`}><span className="tea-cup-liquid" style={{height: `${Math.max(0, Math.min(100, draft.fill))}%`, backgroundColor: teaColors[draft.base]}} /><span className="tea-cup-label">PHỐ NHỎ</span>{draft.sealed && <span className="tea-cup-seal" />}</span><div><b>{DRINKS[draft.base].shortName} · {draft.size}</b><small>Đường {draft.sugar}% · đá {draft.ice}% · rót {draft.fill}% · lắc {draft.shake}% · {draft.sealed ? "đã dập nắp" : "nắp mở"}</small></div></div>;
}
