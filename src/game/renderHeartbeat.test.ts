import { describe, expect, it } from 'vitest';
import {
  NAVIGATION_STALL_TIMEOUT_MS,
  NAVIGATION_ASSIST_DELAY_MS,
  shouldOfferNavigationAssist,
  observeNavigationHeartbeat,
  observeRenderHeartbeat,
  RENDER_STALL_TIMEOUT_MS,
} from './renderHeartbeat';

describe('3D shop interaction recovery', () => {
  it('detects a visible renderer stalled for twenty seconds', () => {
    const start = { frames: 14, lastProgressAt: 1000 };
    expect(observeRenderHeartbeat(start, 14, 1000 + RENDER_STALL_TIMEOUT_MS - 1, true).stalled).toBe(false);
    expect(observeRenderHeartbeat(start, 14, 1000 + RENDER_STALL_TIMEOUT_MS, true).stalled).toBe(true);
    expect(observeRenderHeartbeat(start, 14, 100_000, false).stalled).toBe(false);
    expect(observeRenderHeartbeat(start, 15, 100_000, true).stalled).toBe(false);
  });

  it('recovers a stuck table route but not a progressing route', () => {
    const initial = { place: null, distance: Infinity, lastProgressAt: 1000 };
    const selected = observeNavigationHeartbeat(initial, 'table2', 6, 2000, true).heartbeat;
    expect(observeNavigationHeartbeat(selected, 'table2', 6, 2000 + NAVIGATION_STALL_TIMEOUT_MS - 1, true).stalled).toBe(false);
    expect(observeNavigationHeartbeat(selected, 'table2', 6, 2000 + NAVIGATION_STALL_TIMEOUT_MS, true).stalled).toBe(true);
    const progress = observeNavigationHeartbeat(selected, 'table2', 5.6, 7000, true);
    expect(progress.stalled).toBe(false);
    expect(progress.heartbeat.lastProgressAt).toBe(7000);
  });

  it('offers a voluntary fallback only after eight seconds without route progress', () => {
    const start = { place: 'table2', distance: 6, lastProgressAt: 1000 };
    expect(shouldOfferNavigationAssist(start, 1000 + NAVIGATION_ASSIST_DELAY_MS - 1, true)).toBe(false);
    expect(shouldOfferNavigationAssist(start, 1000 + NAVIGATION_ASSIST_DELAY_MS, true)).toBe(true);
    expect(shouldOfferNavigationAssist(start, 100_000, false)).toBe(false);
    expect(shouldOfferNavigationAssist({ ...start, place: null }, 100_000, true)).toBe(false);
    expect(shouldOfferNavigationAssist({ ...start, distance: 1 }, 100_000, true)).toBe(false);
    expect(shouldOfferNavigationAssist({ ...start, distance: Infinity }, 100_000, true)).toBe(false);
    const progressed = observeNavigationHeartbeat(start, 'table2', 5.7, 8000, true).heartbeat;
    expect(shouldOfferNavigationAssist(progressed, 8000, true)).toBe(false);
    expect(shouldOfferNavigationAssist(progressed, 8000 + NAVIGATION_ASSIST_DELAY_MS, true)).toBe(true);
  });

  it('ignores hidden, paused, arrived, changed and invalid destinations', () => {
    const start = { place: 'table2', distance: 6, lastProgressAt: 1000 };
    expect(observeNavigationHeartbeat(start, 'table2', 6, 100_000, false).stalled).toBe(false);
    expect(observeNavigationHeartbeat(start, 'table2', 0.9, 100_000, true).stalled).toBe(false);
    expect(observeNavigationHeartbeat(start, 'counter', 6, 100_000, true).stalled).toBe(false);
    expect(observeNavigationHeartbeat(start, 'table2', NaN, 100_000, true).stalled).toBe(false);
    const cleared = observeNavigationHeartbeat(start, null, Infinity, 100_000, true);
    expect(cleared.stalled).toBe(false);
    expect(cleared.heartbeat.place).toBeNull();
    expect(observeNavigationHeartbeat(cleared.heartbeat, 'table2', 6, 101_000, true).stalled).toBe(false);
  });
});
