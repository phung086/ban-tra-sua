import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CraftWorkbench } from "../components/CraftWorkbench";
import { createInitialState, emptyDraft, startDay } from "./engine";
import { advancePour, pourVerdict } from "./pourControl";

describe("live manual pouring", () => {
  it("starts each new cup empty instead of showing phantom tea", () => {
    expect(emptyDraft().fill).toBe(0);
    expect(createInitialState().draft.fill).toBe(0);
  });

  it("renders the actual manual pour at the production brewing station", () => {
    const game = startDay(createInitialState(), 1000);
    const html = renderToStaticMarkup(createElement(CraftWorkbench, {
      game,
      customerName: "Khách thử",
      onGame: () => undefined,
      onServe: () => undefined,
      station: 2,
      onStation: () => undefined,
    }));
    expect(html).toContain("Rót trà vào ly");
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain("Rót nhanh");
    expect(html).toContain("Lắc");
    expect(html).not.toContain("canh kim vào vùng chuẩn rồi CHỐT");
  });

  it("preserves a partly poured cup across repeated presses", () => {
    const first = advancePour(0, 100, "careful");
    const second = advancePour(first, 100, "careful");
    expect(first).toBeCloseTo(2.6);
    expect(second).toBeCloseTo(5.2);
  });

  it("keeps 10 and 20 FPS pour rates equivalent for foreground frames", () => {
    const tenFps = Array.from({ length: 10 }).reduce<number>(
      fill => advancePour(fill, 100, "quick"), 0);
    const twentyFps = Array.from({ length: 20 }).reduce<number>(
      fill => advancePour(fill, 50, "quick"), 0);
    expect(tenFps).toBeCloseTo(twentyFps);
    expect(tenFps).toBeCloseTo(52);
  });

  it("caps tab-resume elapsed time and never exceeds a full cup", () => {
    expect(advancePour(0, 10000, "quick")).toBeCloseTo(5.2);
    expect(advancePour(99, 100, "quick")).toBe(100);
  });

  it("uses the existing quality tolerance for player feedback", () => {
    expect(pourVerdict(80, 80, 5)).toBe("perfect");
    expect(pourVerdict(88, 80, 5)).toBe("close");
    expect(pourVerdict(92, 80, 5)).toBe("off");
  });
});
