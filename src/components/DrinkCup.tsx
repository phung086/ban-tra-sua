import type { DrinkDraft } from "../game/types";

interface Props {
  draft: DrinkDraft;
}

function ToppingVisual({ topping }: { topping: DrinkDraft["topping"] }) {
  if (topping === "black-pearl") {
    return <div className="pearls">{Array.from({ length: 9 }).map((_, index) => <i key={index} />)}</div>;
  }
  if (topping === "pudding") {
    return <div className="pudding-bits">{Array.from({ length: 5 }).map((_, index) => <i key={index} />)}</div>;
  }
  if (topping === "rainbow-jelly") {
    return <div className="jelly-bits">{Array.from({ length: 7 }).map((_, index) => <i key={index} />)}</div>;
  }
  if (topping === "cheese-foam") {
    return <div className="cheese-foam"><i /><i /><i /></div>;
  }
  if (topping === "aloe-vera") {
    return <div className="aloe-bits">{Array.from({ length: 8 }).map((_, index) => <i key={index} />)}</div>;
  }
  if (topping === "mochi") {
    return <div className="mochi-bits">{Array.from({ length: 5 }).map((_, index) => <i key={index} />)}</div>;
  }
  return null;
}

export function DrinkCup({ draft }: Props) {
  const liquidTop = Math.max(8, 102 - draft.fill);

  return (
    <div className="cup-wrap" aria-label="Ly đồ uống đang pha">
      <div className="cup-stage-glow" />
      <div className={`cup-straw ${draft.sealed ? "visible" : ""}`} />
      <div className={`cup-lid ${draft.sealed ? "sealed" : ""}`}>
        <span />
      </div>

      <div className="drink-cup">
        <div
          className={`drink-liquid liquid-${draft.base}`}
          style={{ top: `${liquidTop}%` }}
        >
          <div className="drink-surface" />
          <div className="drink-bubbles" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => <i key={index} />)}
          </div>
          <div
            className={`drink-swirl ${draft.shake >= 70 ? "strong" : draft.shake >= 40 ? "medium" : ""}`}
            aria-hidden="true"
          />
          <div className="ice-layer" style={{ opacity: Math.max(0.08, draft.ice / 115) }}>
            {Array.from({ length: Math.max(1, Math.round(draft.ice / 20)) }).map((_, index) => (
              <i key={index} />
            ))}
          </div>
          <ToppingVisual topping={draft.topping} />
        </div>

        <div className="cup-rim-glow" />
        <div className="cup-shine" />
        <div className="cup-condensation" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => <i key={index} />)}
        </div>
        <div className="cup-logo">♡</div>
        <div className="cup-sticker">CHIBI TEA</div>
      </div>

      <div className="cup-base-shadow" />
      <div className="cup-caption v2-cup-caption">
        <span>Size {draft.size}</span>
        <span>🫗 {draft.fill}%</span>
        <span>🌀 {draft.shake}%</span>
        <span>{draft.sealed ? "🎀 Đã dập nắp" : "Nắp mở"}</span>
      </div>
    </div>
  );
}
