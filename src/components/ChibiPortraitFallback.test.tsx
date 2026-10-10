import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CUSTOMERS } from "../game/content";
import { ChibiPortrait } from "./ChibiCustomer";
import { ChibiReaction } from "./ChibiReaction";

describe("personalized chibi fallback portrait", () => {
  it("renders an illustrated face and outfit before WebGL portrait is ready", () => {
    const markup = renderToStaticMarkup(<ChibiPortrait customer={CUSTOMERS[0]} />);
    expect(markup).toContain("has-chibi-fallback");
    expect(markup).toContain("chibi-fallback-face");
    expect(markup).toContain("chibi-fallback-shirt");
    expect(markup).toContain("chibi-fallback-fringe");
    expect(markup).not.toContain(">M<");
  });

  it("uses each authored customer's own palette rather than a generic avatar", () => {
    const first = renderToStaticMarkup(<ChibiPortrait customer={CUSTOMERS[0]} />);
    const second = renderToStaticMarkup(<ChibiPortrait customer={CUSTOMERS[1]} />);
    expect(first).toContain(CUSTOMERS[0].hair);
    expect(first).toContain(CUSTOMERS[0].shirt);
    expect(first).toContain(CUSTOMERS[0].skin);
    expect(second).toContain(CUSTOMERS[1].hair);
    expect(second).not.toBe(first);
  });

  it("keeps the visual fallback decorative while mood stays accessible", () => {
    const markup = renderToStaticMarkup(
      <ChibiReaction customer={CUSTOMERS[0]} mood="upset" celebrating={false} />,
    );
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('aria-label="thất vọng"');
    expect(markup).toContain('data-mood="upset"');
  });
});
