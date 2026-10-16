import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createInitialState } from "../../game/engine";
import { RushShiftProgress } from "./RushShiftProgress";

const rush = () => ({ ...createInitialState(), day: 9, phase: "open" as const,
  shiftPlan: "rush" as const, targetOrders: 10, served: 4, dailyScoreTotal: 332 });

describe("day 9 rush live progress", () => {
  it("shows the remaining order count and live quality target", () => {
    const html = renderToStaticMarkup(<RushShiftProgress game={rush()} />);
    expect(html).toContain("4/10 đơn");
    expect(html).toContain("6 đơn còn lại");
    expect(html).toContain("83/100");
    expect(html).toContain("Cần trung bình ≥78/100");
  });
  it("shows an honest recovery target when the average is below 80", () => {
    const html = renderToStaticMarkup(<RushShiftProgress game={{ ...rush(), dailyScoreTotal: 318 }} />);
    expect(html).toContain("79.5/100");
    expect(html).toContain("Cần trung bình ≥81/100");
    expect(renderToStaticMarkup(<RushShiftProgress game={{ ...rush(), served: 9, dailyScoreTotal: 600 }} />))
      .toContain("Không còn đủ đơn");
  });
  it("never exposes rush UI during normal shifts or the day-one tutorial", () => {
    expect(renderToStaticMarkup(<RushShiftProgress game={{ ...rush(), shiftPlan: "regular" }} />)).toBe("");
    expect(renderToStaticMarkup(<RushShiftProgress game={{ ...rush(), day: 1 }} />)).toBe("");
  });
  it("reflects the same bonus decision as the payout without granting it again", () => {
    const done = { ...rush(), phase: "summary" as const, served: 10, dailyScoreTotal: 820 };
    const html = renderToStaticMarkup(<RushShiftProgress game={done} />);
    expect(html).toContain("Đã đạt mục tiêu");
    expect(html).toContain("20.000");
    expect(renderToStaticMarkup(<RushShiftProgress game={{ ...done, dailyScoreTotal: 790 }} />)).toContain("chưa đạt");
  });
});
