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


/** A selected shop destination should never become an endless walking command. */
export const NAVIGATION_STALL_TIMEOUT_MS = 20_000;
export const NAVIGATION_ARRIVAL_RADIUS = 1.15;
export type NavigationHeartbeat = {
  place: string | null;
  distance: number;
  lastProgressAt: number;
};

/** Tracks meaningful progress toward the selected table, ignoring inactive tabs. */
export function observeNavigationHeartbeat(
  previous: NavigationHeartbeat,
  place: string | null,
  distance: number,
  now: number,
  active: boolean,
): { heartbeat: NavigationHeartbeat; stalled: boolean } {
  if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(now)) {
    return { heartbeat: previous, stalled: false };
  }
  if (!active || place === null || previous.place !== place ||
      distance <= NAVIGATION_ARRIVAL_RADIUS ||
      distance < previous.distance - 0.12 || now < previous.lastProgressAt) {
    return { heartbeat: { place, distance, lastProgressAt: now }, stalled: false };
  }
  return {
    heartbeat: previous,
    stalled: now - previous.lastProgressAt >= NAVIGATION_STALL_TIMEOUT_MS,
  };
}
