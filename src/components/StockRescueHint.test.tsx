import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { createInitialState, startDay } from "../game/engine";
import { StockRescueHint } from "./StockRescueHint";

describe("stock rescue choice visibility", () => {
  it("shows an accessible actionable substitution when a topping is missing", () => {
    const game = startDay(createInitialState(), 1_000_000);
    const depleted = {
      ...game,
      draft: { ...game.draft, topping: "black-pearl" as const },
      inventory: { ...game.inventory, blackPearl: 0 },
    };
    const html = renderToStaticMarkup(
      createElement(StockRescueHint, { game: depleted, onGame: () => {} }),
    );
    expect(html).toContain("role=\"status\"");
    expect(html).toContain("Cứu đơn");
    expect(html).toContain("min-height:48px");
    expect(html).toContain("bỏ topping");
  });

  it("does not show an irrelevant prompt when stock is sufficient or cup sealed", () => {
    const game = startDay(createInitialState(), 1_000_000);
    expect(renderToStaticMarkup(
      createElement(StockRescueHint, { game, onGame: () => {} }),
    )).toBe("");
    const sealed = { ...game, draft: { ...game.draft, sealed: true } };
    expect(renderToStaticMarkup(
      createElement(StockRescueHint, { game: sealed, onGame: () => {} }),
    )).toBe("");
  });
});
