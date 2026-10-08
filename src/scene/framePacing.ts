/**
 * Phase-aligned 30 FPS cap. A naive `now - lastDraw < 1000 / 30` check
 * can skip every other eligible 60 Hz callback due to floating-point
 * timing and effectively render at 20 FPS.
 * This schedules render opportunities; it cannot guarantee GPU throughput.
 */
export class FramePacer {
  private nextFrameAt = Number.NEGATIVE_INFINITY;

  constructor(readonly fps = 30, readonly toleranceMs = 1.5) {}

  reset() {
    this.nextFrameAt = Number.NEGATIVE_INFINITY;
  }

  shouldRender(now: number): boolean {
    if (!Number.isFinite(now)) return false;
    if (now + this.toleranceMs < this.nextFrameAt) return false;
    const interval = 1000 / this.fps;
    if (!Number.isFinite(this.nextFrameAt) || now - this.nextFrameAt > interval) {
      // No catch-up bursts after background-tab pauses or GPU stalls.
      this.nextFrameAt = now + interval;
    } else {
      this.nextFrameAt += interval;
    }
    return true;
  }
}
