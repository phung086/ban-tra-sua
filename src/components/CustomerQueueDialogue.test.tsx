import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createInitialState } from "../game/engine";
import type { Order } from "../game/types";
import { CustomerQueueStatus } from "./CustomerQueueStatus";

const order: Order = {
  id: "counter-line-test", customerId: "bo", size: "M",
  base: "classic-milk-tea", sugar: 50, ice: 50, topping: "none",
  targetFill: 80, targetShake: 60, price: 25000,
};

describe("live customer queue dialogue", () => {
  it("shows a character-specific line at the beginning of service", () => {
    const game = { ...createInitialState(), phase: "open" as const,
      currentOrder: order, currentOrderQueuedAt: 1_000_000 };
    const html = renderToStaticMarkup(<CustomerQueueStatus game={game} now={1_000_000} />);
    expect(html).toContain("trước giờ làm");
    expect(html).toContain('aria-live="off"');
    expect(html).toContain('aria-label="Nhịp phục vụ khách"');
  });

  it("changes the line when the same customer becomes upset", () => {
    const game = { ...createInitialState(), phase: "open" as const,
      currentOrder: order, currentOrderQueuedAt: 1_000_000 };
    const html = renderToStaticMarkup(<CustomerQueueStatus game={game} now={1_150_000} />);
    expect(html).toContain("đợi lâu quá");
    expect(html).toContain("mood-upset");
  });

  it("does not show stale dialogue when there is no current order", () => {
    const html = renderToStaticMarkup(<CustomerQueueStatus game={createInitialState()} now={1_000_000} />);
    expect(html).toBe("");
  });
});
