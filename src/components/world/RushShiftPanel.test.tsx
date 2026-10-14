import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { isValidElement, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { GameState } from "../../game/types";
import { chooseClosingCare, createInitialState, generateOrder, getRestockPrice, nextDay, restock, startDay } from "../../game/engine";
import { chooseShiftPlan, getRushCupRequirements } from "../../game/shiftPlans";
import { RushShiftPanel } from "./RushShiftPanel";

const callbacks = { onGame: () => undefined, onNavigate: () => undefined };
function dayNine() {
  let game = createInitialState();
  for (let i = 1; i < 9; i++) {
    if (game.day === 8) game = chooseClosingCare({ ...game, phase: "summary" }, "skip");
    game = nextDay(game);
  }
  return game;
}

/** Exercise the actual JSX onClick callbacks without a browser: React batches
 * successive touch actions, so both callbacks can capture the same render.
 */
function actionButtons(node: ReactNode): { markup: string; click: () => void }[] {
  if (Array.isArray(node)) return node.flatMap(actionButtons);
  if (!isValidElement(node)) return [];
  const props = node.props as { children?: ReactNode; onClick?: () => void };
  const children = actionButtons(props.children);
  return node.type === "button" && props.onClick
    ? [{ markup: renderToStaticMarkup(node), click: props.onClick }, ...children]
    : children;
}

describe("day 9 rush opening UI", () => {
  it("does not show the shift selector in the day 1 tutorial", () => {
    const html = renderToStaticMarkup(<RushShiftPanel game={createInitialState()} {...callbacks} />);
    expect(html).not.toContain("Ca đông khách");
    expect(html).toContain("Mở cửa tiệm");
  });

  it("shows both shift consequences and stock shortage before opening", () => {
    const selected = chooseShiftPlan(dayNine(), "rush");
    const low = { ...selected, inventory: { ...selected.inventory, cupsM: 0, cupsL: 0 } };
    const html = renderToStaticMarkup(<RushShiftPanel game={low} {...callbacks} />);
    expect(html).toContain("Ca đông khách");
    expect(html).toContain("7 giây/khách");
    expect(html).toContain("Bơ gọi trà sữa truyền thống");
    expect(html).toContain("Đức thích cacao");
    expect(html).toContain("Yêu cầu riêng");
    expect(html).toContain("Bơ: 30% đường");
    expect(html).toContain("Đức: không đá");
    expect(html).toContain("Nhập kho");
    expect(html).toContain("Nhập nhanh +12 ly M");
    expect(html).toContain("Nhập nhanh +10 ly L");
    expect(html).toContain("disabled");
  });

  it("previews the two actual commuter orders, with unlocked favorites only", () => {
    const rush = chooseShiftPlan(dayNine(), "rush");
    const markup = renderToStaticMarkup(<RushShiftPanel game={rush} {...callbacks} />);
    const first = generateOrder(rush, 0);
    const second = generateOrder(rush, 1);
    expect(first.customerId).toBe("bo");
    expect(second.customerId).toBe("duc");
    expect(markup).toContain("Bơ · ly " + first.size);
    expect(markup).toContain("Đức · ly " + second.size);
    expect(markup).toContain("30% đường");
    expect(markup).toContain("0% đá");
    expect(markup).toContain("Chọn món khi đến quầy"); // Cacao still locked.
    expect(markup).toContain("Các khách còn lại chọn món khi đến");
    expect(first.sugar).toBe(30);
    expect(second.ice).toBe(0);
  });

  it("blocks opening when M cups alone are plentiful but L cups are missing", () => {
    const selected = chooseShiftPlan(dayNine(), "rush");
    const unbalanced = { ...selected, inventory: { ...selected.inventory, cupsM: selected.targetOrders, cupsL: 0 } };
    const html = renderToStaticMarkup(<RushShiftPanel game={unbalanced} {...callbacks} />);
    expect(html).toContain("ly L");
    expect(html).toContain("disabled");
  });

  it("lets the player recover missing cups at the counter using real shop prices", () => {
    const selected = chooseShiftPlan(dayNine(), "rush");
    const missing = { ...selected, inventory: { ...selected.inventory, cupsM: 0, cupsL: 0 }, cash: 100000 };
    const firstPrice = getRestockPrice(missing, "cupsM");
    const secondPrice = getRestockPrice(missing, "cupsL");
    const afterM = restock(missing, "cupsM");
    const afterBoth = restock(afterM, "cupsL");
    expect(afterBoth.inventory.cupsM).toBe(12);
    expect(afterBoth.inventory.cupsL).toBe(10);
    expect(afterBoth.cash).toBe(missing.cash - firstPrice - secondPrice);
    expect(startDay(afterBoth, 1000).phase).toBe("open");
    expect(renderToStaticMarkup(<RushShiftPanel game={afterBoth} {...callbacks} />)).toContain("Đã đủ");
  });

  it("prevents unaffordable quick purchases without removing the regular-shift recovery", () => {
    const selected = chooseShiftPlan(dayNine(), "rush");
    const poor = { ...selected, cash: 0, inventory: { ...selected.inventory, cupsM: 0, cupsL: 0 } };
    const html = renderToStaticMarkup(<RushShiftPanel game={poor} {...callbacks} />);
    expect(html).toContain("Nhập nhanh +12 ly M");
    expect(html).toContain("Nhập nhanh +10 ly L");
    expect((html.match(/disabled/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(restock(poor, "cupsM").inventory.cupsM).toBe(0);
    expect(chooseShiftPlan(poor, "regular").targetOrders).toBeLessThan(poor.targetOrders);
  });

  it("allows opening after restock and makes the normal shift available", () => {
    const selected = chooseShiftPlan(dayNine(), "rush");
    const stocked = { ...selected, inventory: { ...selected.inventory, ...getRushCupRequirements(selected) } };
    const html = renderToStaticMarkup(<RushShiftPanel game={stocked} {...callbacks} />);
    expect(html).toContain("Đã đủ");
    expect(html).toContain("ly M và");
    expect(html).not.toContain("disabled");
    expect(renderToStaticMarkup(<RushShiftPanel game={dayNine()} {...callbacks} />)).toContain("Ca thường");
  });

  it("keeps both rapid M/L purchases instead of overwriting one with stale render state", () => {
    let current: GameState = {
      ...chooseShiftPlan(dayNine(), "rush"),
      cash: 100000,
      inventory: { ...dayNine().inventory, cupsM: 0, cupsL: 0 },
    };
    const snapshot = current;
    const onGame: Dispatch<SetStateAction<GameState>> = action => {
      current = typeof action === "function" ? action(current) : action;
    };
    const actions = actionButtons(RushShiftPanel({ game: snapshot, onGame, onNavigate: () => undefined }));
    const buyM = actions.find(button => button.markup.includes("Nhập nhanh +12 ly M"));
    const buyL = actions.find(button => button.markup.includes("Nhập nhanh +10 ly L"));
    expect(buyM).toBeDefined();
    expect(buyL).toBeDefined();
    buyM!.click();
    buyL!.click();
    expect(current.inventory.cupsM).toBe(12);
    expect(current.inventory.cupsL).toBe(10);
    expect(current.cash).toBe(100000 - getRestockPrice(snapshot, "cupsM") - getRestockPrice(snapshot, "cupsL"));
    expect(current.phase).toBe("prep");

    // Two taps on the same opening button must not re-roll the first customer.
    const openingActions = actionButtons(RushShiftPanel({ game: current, onGame, onNavigate: () => undefined }));
    const open = openingActions.find(button => button.markup.includes("Mở cửa tiệm"));
    expect(open).toBeDefined();
    open!.click();
    const opened = current;
    expect(opened.phase).toBe("open");
    open!.click();
    expect(current).toBe(opened);
    expect(current.currentOrder?.id).toBe(opened.currentOrder?.id);
    expect(current.customerQueue).toHaveLength(2);
  });

});
