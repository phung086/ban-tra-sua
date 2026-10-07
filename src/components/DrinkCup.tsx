import type { DrinkDraft } from "../game/types";
import { DRINKS } from "../game/content";
import { GameIcon } from "./GameIcon";
export function DrinkCup({ draft }: { draft: DrinkDraft }) {
  return <div className="cup-readout" aria-label="Ly đang pha trên quầy"><GameIcon /><div><b>{DRINKS[draft.base].shortName} · {draft.size}</b><small>Rót {draft.fill}% · lắc {draft.shake}% · {draft.sealed ? "đã dập nắp" : "nắp mở"}</small></div></div>;
}
