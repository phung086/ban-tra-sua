import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createInitialState, startDay, updateDraft } from "../game/engine";
import { quickMixDrink } from "../game/quickMix";
import { CraftWorkbench } from "./CraftWorkbench";

const render = (game: ReturnType<typeof startDay>) =>
  renderToStaticMarkup(createElement(CraftWorkbench, {
    game, customerName: "Bơ", onGame: () => {}, onServe: () => {},
    station: 2, onStation: () => {},
  }));

describe("live fast mix station", () => {
  it("offers an explicit score tradeoff beside the manual gauges", () => {
    const game = startDay(createInitialState(), 1_000_000);
    const html = render(game);
    expect(html).toContain("Pha kỹ hay pha nhanh");
    expect(html).toContain("Pha nhanh · bỏ qua 2 lượt canh");
    expect(html).toContain("12 điểm");
    expect(html).toContain("Ước tính nếu pha nhanh");
    expect(html).toContain("Bắt đầu rót");
  });

  it("requires a deliberate careful reset before the gauges return", () => {
    const game = quickMixDrink(startDay(createInitialState(), 1_000_000));
    const html = render(game);
    expect(html).toContain("Pha kỹ lại · canh cả hai bước");
    expect(html).not.toContain("Bắt đầu rót");
    expect(html).not.toContain("Bắt đầu lắc");
    const sealed = updateDraft(game, { sealed: true });
    expect(render(sealed)).toContain("disabled");
  });
});
