import { DRINKS, TOPPINGS } from "../game/content";
import type { DrinkDraft, Order } from "../game/types";

interface Props {
  order: Order;
  draft: DrinkDraft;
}

interface Hint {
  icon: string;
  title: string;
  detail: string;
  priority: number;
}

function delta(actual: number, target: number) {
  return Math.abs(actual - target);
}

export function AdaptiveCraftHint({ order, draft }: Props) {
  const hints: Hint[] = [];

  if (draft.base !== order.base) {
    hints.push({
      icon: "🫖",
      title: "Sai nền trà",
      detail: "Order cần " + DRINKS[order.base].shortName + ", hiện đang là " + DRINKS[draft.base].shortName + ".",
      priority: 100,
    });
  }

  if (draft.size !== order.size) {
    hints.push({
      icon: "🥤",
      title: "Kiểm tra size",
      detail: "Khách gọi size " + order.size + ", ly hiện tại là " + draft.size + ".",
      priority: 95,
    });
  }

  if (draft.topping !== order.topping) {
    hints.push({
      icon: TOPPINGS[order.topping].emoji,
      title: "Topping chưa đúng",
      detail: "Cần " + TOPPINGS[order.topping].name + ".",
      priority: 90,
    });
  }

  const sugarDelta = delta(draft.sugar, order.sugar);
  if (sugarDelta > 5) {
    hints.push({
      icon: "🍬",
      title: sugarDelta > 20 ? "Đường lệch khá nhiều" : "Canh lại đường",
      detail: "Đang " + draft.sugar + "% · mục tiêu " + order.sugar + "%.",
      priority: 80 + Math.min(15, sugarDelta / 2),
    });
  }

  const iceDelta = delta(draft.ice, order.ice);
  if (iceDelta > 5) {
    hints.push({
      icon: "🧊",
      title: iceDelta > 20 ? "Đá lệch khá nhiều" : "Canh lại đá",
      detail: "Đang " + draft.ice + "% · mục tiêu " + order.ice + "%.",
      priority: 78 + Math.min(15, iceDelta / 2),
    });
  }

  const fillDelta = delta(draft.fill, order.targetFill);
  if (fillDelta > 6) {
    hints.push({
      icon: "🫗",
      title: "Mức rót chưa đẹp",
      detail: "Đang " + draft.fill + "% · mục tiêu " + order.targetFill + "%.",
      priority: 72 + Math.min(12, fillDelta / 2),
    });
  }

  const shakeDelta = delta(draft.shake, order.targetShake);
  if (shakeDelta > 6) {
    hints.push({
      icon: "🌀",
      title: "Độ lắc chưa chuẩn",
      detail: "Đang " + draft.shake + "% · mục tiêu " + order.targetShake + "%.",
      priority: 70 + Math.min(12, shakeDelta / 2),
    });
  }

  if (!draft.sealed) {
    hints.push({
      icon: "🎀",
      title: "Còn thiếu bước dập nắp",
      detail: "Hoàn thiện ly trước khi giao khách.",
      priority: 45,
    });
  }

  hints.sort((a, b) => b.priority - a.priority);
  const top = hints[0];

  if (!top) {
    return (
      <div className="adaptive-hint ready">
        <span>✨</span>
        <div>
          <b>Ly đã sẵn sàng!</b>
          <small>Mọi thông số chính đều đang nằm trong vùng chuẩn.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="adaptive-hint">
      <span>{top.icon}</span>
      <div>
        <b>{top.title}</b>
        <small>{top.detail}</small>
      </div>
      {hints.length > 1 && <em>+{hints.length - 1} việc</em>}
    </div>
  );
}
