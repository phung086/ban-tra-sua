import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PourControl } from "../components/PourControl";

const css = readFileSync(new URL("../components/PourControl.css", import.meta.url), "utf8");

describe("manual pour release feedback", () => {
  it("renders an accurate live verdict for a target hit", () => {
    const html = renderToStaticMarkup(createElement(PourControl, {
      value: 80, target: 80, brewerLevel: 0, onCommit: () => undefined,
    }));
    expect(html).toContain("grade-perfect");
    expect(html).toContain('aria-valuenow="80"');
    expect(html).toContain("Đúng mốc!");
  });

  it("highlights the active cup and hold button from the existing verdict", () => {
    expect(css).toContain(":has(.manual-pour-verdict.grade-perfect) .manual-pour-vessel");
    expect(css).toContain(":has(.manual-pour-verdict.grade-perfect) .manual-pour-hold");
    expect(css).toContain(":has(.manual-pour-verdict.grade-close) .manual-pour-vessel");
  });
});
