import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DrinkCup } from "./DrinkCup";
import { emptyDraft } from "../game/engine";

describe("live tea cup preview", () => {
  it("shows a cup with the actual fill and color", () => {
    const markup = renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), fill: 70 }} />);
    expect(markup).toContain("tea-cup-liquid");
    expect(markup).toContain('data-size="M"');
    expect(markup).toContain("height:70%");
    expect(markup).toContain("#b98b68");
  });

  it("changes color with the selected tea", () => {
    const markup = renderToStaticMarkup(<DrinkCup draft={emptyDraft("matcha-latte")} />);
    expect(markup).toContain("#91ab75");
  });

  it("shows the seal only when the cup is sealed", () => {
    expect(renderToStaticMarkup(<DrinkCup draft={emptyDraft()} />)).not.toContain("tea-cup-seal");
    expect(renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), sealed: true }} />)).toContain("tea-cup-seal");
  });

  it("keeps sugar and ice visible in the station readout", () => {
    const markup = renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), sugar: 20, ice: 80 }} />);
    expect(markup).toContain("Đường 20%");
    expect(markup).toContain("đá 80%");
  });
  it("marks large cups with a distinct size", () => {
    const markup = renderToStaticMarkup(<DrinkCup draft={{ ...emptyDraft(), size: "L" }} />);
    expect(markup).toContain('data-size="L"');
  });

});
