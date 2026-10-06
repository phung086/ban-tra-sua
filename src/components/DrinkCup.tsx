import type { DrinkDraft } from "../game/types";

interface Props {
  draft: DrinkDraft;
}

export function DrinkCup({ draft }: Props) {
  return (
    <div className="cup-wrap" aria-label="Ly đồ uống đang pha">
      <div className={`cup-straw ${draft.sealed ? "visible" : ""}`} />
      <div className={`cup-lid ${draft.sealed ? "sealed" : ""}`}>
        <span />
      </div>
      <div className="drink-cup">
        <div className={`drink-liquid liquid-${draft.base}`}>
          <div className="ice-layer" style={{ opacity: Math.max(0.08, draft.ice / 115) }}>
            {Array.from({ length: Math.max(1, Math.round(draft.ice / 20)) }).map((_, index) => (
              <i key={index} />
            ))}
          </div>
          {draft.topping === "black-pearl" && (
            <div className="pearls">
              {Array.from({ length: 9 }).map((_, index) => <i key={index} />)}
            </div>
          )}
          {draft.topping === "pudding" && (
            <div className="pudding-bits">
              {Array.from({ length: 5 }).map((_, index) => <i key={index} />)}
            </div>
          )}
          {draft.topping === "rainbow-jelly" && (
            <div className="jelly-bits">
              {Array.from({ length: 7 }).map((_, index) => <i key={index} />)}
            </div>
          )}
        </div>
        <div className="cup-shine" />
        <div className="cup-logo">♡</div>
      </div>
      <div className="cup-caption">
        <span>Size {draft.size}</span>
        <span>{draft.sealed ? "Đã đóng nắp" : "Chưa đóng nắp"}</span>
      </div>
    </div>
  );
}
