import type { DrinkDraft } from "../game/types";
import { DRINKS, TOPPINGS } from "../game/content";
import { GameIcon } from "./GameIcon";

const teaColors: Record<DrinkDraft["base"], string> = {
  "classic-milk-tea": "#b98b68", "peach-tea": "#efb47d",
  "matcha-latte": "#91ab75", "oolong-milk-tea": "#ad815b",
  "taro-milk-tea": "#ad95be", "strawberry-milk": "#df9cae",
  "cocoa-milk": "#79513d", "lemon-tea": "#e7c56b",
};

/** A lightweight, deterministic visual of the actual drink draft. */
export function DrinkCup({ draft }: { draft: DrinkDraft }) {
  const fill = Math.max(0, Math.min(100, draft.fill));
  const iceCount = Math.ceil(Math.max(0, Math.min(100, draft.ice)) / 34);
  const hasPieces = draft.topping !== "none" && draft.topping !== "cheese-foam";
  const toppingName = TOPPINGS[draft.topping].name;

  return (
    <div className="cup-readout">
      <GameIcon />
      <span
        className="tea-cup-visual"
        role="img"
        aria-label={`Ly ${DRINKS[draft.base].shortName}, rót ${fill}%, đá ${draft.ice}%, topping ${toppingName}, ${draft.sealed ? "đã dập nắp" : "nắp mở"}`}
      >
        <span className="tea-cup-liquid" style={{ height: `${fill}%`, backgroundColor: teaColors[draft.base] }}>
          <span className="tea-cup-ice-layer">
            {Array.from({ length: iceCount }, (_, index) => (
              <span className="tea-cup-ice" key={index} />
            ))}
          </span>
          {hasPieces && (
            <span className={`tea-cup-toppings topping-${draft.topping}`}>
              {Array.from({ length: 4 }, (_, index) => (
                <span className="tea-cup-topping" key={index} />
              ))}
            </span>
          )}
          {draft.topping === "cheese-foam" && <span className="tea-cup-foam" />}
        </span>
        <span className="tea-cup-shine" />
        <span className="tea-cup-label">PHỐ NHỎ</span>
        <span className="tea-cup-rim" />
        {draft.sealed && <span className="tea-cup-seal" />}
      </span>
      <div>
        <b>{DRINKS[draft.base].shortName} · {draft.size}</b>
        <small>
          Đường {draft.sugar}% · đá {draft.ice}% · rót {draft.fill}% · lắc {draft.shake}% · {toppingName} · {draft.sealed ? "đã dập nắp" : "nắp mở"}
        </small>
      </div>
    </div>
  );
}
