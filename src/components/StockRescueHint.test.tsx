import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { createInitialState, startDay } from "../game/engine";
import { StockRescueHint } from "./StockRescueHint";
import { CraftWorkbench } from "./CraftWorkbench";
import { planStockRescue } from "../game/stockRescue";
import { updateDraft } from "../game/engine";

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

describe("live brewing stock shortage gates", () => {
  function workbench(game: ReturnType<typeof startDay>) {
    return renderToStaticMarkup(createElement(CraftWorkbench, {
      game, customerName: "Bơ", onGame: () => {}, onServe: () => {},
      station: 3, onStation: () => {},
    }));
  }
  function action(html: string, className: string) {
    return html.match(new RegExp('<button[^>]*class="[^"]*' + className + '[^"]*"[^>]*>'))?.[0] ?? "";
  }
  it("blocks mouse/touch seal and pickup when the cup cannot be made", () => {
    const started = startDay(createInitialState(), 1_000_000);
    const missing = { ...started, inventory: { ...started.inventory, cupsM: 0 } };
    const html = workbench(missing);
    expect(html).toContain("stock-seal-warning");
    expect(html).toContain("Cứu đơn");
    expect(action(html, "seal-button")).toContain("disabled");
    expect(action(html, "serve-button")).toContain("disabled");
  });
  it("unlocks seal after an actual stock rescue, then pickup only after sealing", () => {
    const started = startDay(createInitialState(), 1_000_000);
    const missing = { ...started, inventory: { ...started.inventory, cupsM: 0, cupsL: 2 } };
    const rescue = planStockRescue(missing);
    expect(rescue?.patch.size).toBe("L");
    const corrected = updateDraft(missing, rescue!.patch);
    const html = workbench(corrected);
    expect(action(html, "seal-button")).not.toContain("disabled");
    expect(action(html, "serve-button")).toContain("disabled");
    const sealed = updateDraft(corrected, { sealed: true });
    const ready = workbench(sealed);
    expect(action(ready, "serve-button")).not.toContain("disabled");
  });
});


describe("choice of substitute tea at the live workbench", () => {
  it("renders distinct rescue buttons and predicted scores for stocked alternatives", () => {
    const started = startDay(createInitialState(), 1_000_000);
    const game = {
      ...started,
      draft: { ...started.draft, base: "classic-milk-tea" as const },
      unlockedBaseIds: ["classic-milk-tea", "peach-tea", "matcha-latte"] as typeof started.unlockedBaseIds,
      inventory: { ...started.inventory, classicMilkTea: 0, peachTea: 2, matchaLatte: 2 },
    };
    const html = renderToStaticMarkup(createElement(StockRescueHint, { game, onGame: () => {} }));
    expect(html).toContain("Trà đào");
    expect(html).toContain("Matcha");
    expect(html).toContain("Chọn vị thay thế");
    expect((html.match(/Cứu đơn [12]:/g) ?? [])).toHaveLength(2);
  });
});
