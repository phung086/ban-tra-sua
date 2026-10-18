/** A renderer that stops presenting frames must not trap real shop interactions. */
export const RENDER_STALL_TIMEOUT_MS = 20_000;

export type RenderHeartbeat = {
  frames: number;
  lastProgressAt: number;
};

/**
 * Track frame progress only while the 3D viewport is visible. Off-screen and
 * background tabs intentionally pause rendering and must never trigger fallback.
 */
export function observeRenderHeartbeat(
  previous: RenderHeartbeat,
  frames: number,
  now: number,
  active: boolean,
): { heartbeat: RenderHeartbeat; stalled: boolean } {
  if (!Number.isFinite(frames) || !Number.isFinite(now)) {
    return { heartbeat: previous, stalled: false };
  }
  if (!active || frames !== previous.frames || now < previous.lastProgressAt) {
    return { heartbeat: { frames, lastProgressAt: now }, stalled: false };
  }
  return {
    heartbeat: previous,
    stalled: now - previous.lastProgressAt >= RENDER_STALL_TIMEOUT_MS,
  };
}
