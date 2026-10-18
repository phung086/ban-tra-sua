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
/** Offer a voluntary accessible escape before the automatic 20-second recovery. */
export const NAVIGATION_ASSIST_DELAY_MS = 8_000;
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
  if (!Number.isFinite(now)) {
    return { heartbeat: previous, stalled: false };
  }
  // Clearing a route is a new observation even though it has no finite
  // distance. Otherwise a second tap on the same table inherits a stale timer.
  if (place === null) {
    return { heartbeat: { place: null, distance: Infinity, lastProgressAt: now }, stalled: false };
  }
  if (!Number.isFinite(distance) || distance < 0) {
    return { heartbeat: previous, stalled: false };
  }
  if (!active || previous.place !== place ||
      distance <= NAVIGATION_ARRIVAL_RADIUS ||
      distance < previous.distance - 0.12 || now < previous.lastProgressAt) {
    return { heartbeat: { place, distance, lastProgressAt: now }, stalled: false };
  }
  return {
    heartbeat: previous,
    stalled: now - previous.lastProgressAt >= NAVIGATION_STALL_TIMEOUT_MS,
  };
}

/** Never offer a shortcut for a paused, hidden, finished or progressing route. */
export function shouldOfferNavigationAssist(
  heartbeat: NavigationHeartbeat,
  now: number,
  active: boolean,
): boolean {
  return active && heartbeat.place !== null &&
    Number.isFinite(now) && Number.isFinite(heartbeat.distance) &&
    heartbeat.distance > NAVIGATION_ARRIVAL_RADIUS &&
    now >= heartbeat.lastProgressAt &&
    now - heartbeat.lastProgressAt >= NAVIGATION_ASSIST_DELAY_MS;
}
