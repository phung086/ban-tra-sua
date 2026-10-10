import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CUSTOMERS } from "../game/content";
import { ChibiReaction } from "./ChibiReaction";

describe("chibi delivery acting", () => {
  const customer = CUSTOMERS[0];

  it("marks a delighted customer for the joyful portrait motion", () => {
    const markup = renderToStaticMarkup(
      <ChibiReaction customer={customer} mood="delighted" celebrating />,
    );
    expect(markup).toContain('data-mood="delighted"');
    expect(markup).toContain("is-celebrating");
    expect(markup).toContain('aria-label="rất vui"');
  });

  it("shows impatience without pretending the customer is celebrating", () => {
    const markup = renderToStaticMarkup(
      <ChibiReaction customer={customer} mood="restless" celebrating={false} />,
    );
    expect(markup).toContain('data-mood="restless"');
    expect(markup).not.toContain("is-celebrating");
    expect(markup).toContain('aria-label="sốt ruột"');
  });

  it("renders disappointed acting as an accessible expression", () => {
    const markup = renderToStaticMarkup(
      <ChibiReaction customer={customer} mood="upset" celebrating={false} />,
    );
    expect(markup).toContain('data-mood="upset"');
    expect(markup).toContain('aria-label="thất vọng"');
  });
});
