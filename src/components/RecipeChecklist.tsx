import { DRINKS, TOPPINGS } from "../game/content";
import type { DrinkDraft, Order } from "../game/types";

interface Props {
  order: Order;
  draft: DrinkDraft;
}

function closeEnough(actual: number, expected: number, tolerance: number) {
  return Math.abs(actual - expected) <= tolerance;
}

export function RecipeChecklist({ order, draft }: Props) {
  const steps = [
    { label: "Nền trà", ok: draft.base === order.base, detail: DRINKS[draft.base].shortName },
    { label: "Size", ok: draft.size === order.size, detail: draft.size },
    { label: "Topping", ok: draft.topping === order.topping, detail: TOPPINGS[draft.topping].name },
    { label: "Đường", ok: closeEnough(draft.sugar, order.sugar, 5), detail: `${draft.sugar}%` },
    { label: "Đá", ok: closeEnough(draft.ice, order.ice, 5), detail: `${draft.ice}%` },
    { label: "Rót", ok: closeEnough(draft.fill, order.targetFill, 6), detail: `${draft.fill}%` },
    { label: "Lắc", ok: closeEnough(draft.shake, order.targetShake, 6), detail: `${draft.shake}%` },
    { label: "Dập nắp", ok: draft.sealed, detail: draft.sealed ? "Xong" : "Chưa" },
  ];

  const ready = steps.filter((step) => step.ok).length;

  return (
    <div className="recipe-checklist">
      <div className="recipe-checklist-head">
        <div>
          <span>CHECKLIST LY NƯỚC</span>
          <b>{ready}/{steps.length} bước ổn</b>
        </div>
        <i style={{ width: `${(ready / steps.length) * 100}%` }} />
      </div>
      <div className="recipe-checklist-grid">
        {steps.map((step) => (
          <div className={step.ok ? "ok" : ""} key={step.label}>
            <span>{step.ok ? "✓" : "○"}</span>
            <b>{step.label}</b>
            <small>{step.detail}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
