// A short, once-per-approach greeting rather than endless arm waving.
// This is visual state only: no NPC relationship, save, or economy mutation.
export interface GreetingState {
  near: boolean;
  startedAt: number | null;
}

export const INITIAL_GREETING: GreetingState = { near: false, startedAt: null };

export function neighborGreeting(
  previous: GreetingState,
  distance: number,
  seconds: number,
): { state: GreetingState; strength: number } {
  const state = { ...previous };
  if (!Number.isFinite(distance) || !Number.isFinite(seconds)) return { state, strength: 0 };
  if (!state.near && distance < 3.1) {
    state.near = true;
    state.startedAt = seconds;
  } else if (state.near && distance > 4.5) {
    state.near = false;
    state.startedAt = null;
  }
  const elapsed = state.startedAt === null ? Infinity : Math.max(0, seconds - state.startedAt);
  const duration = 1.75;
  const strength = elapsed >= duration ? 0 : Math.max(0, Math.min(1, elapsed / 0.22, (duration - elapsed) / 0.35));
  return { state, strength };
}

// Wrap at +/- PI so the character never spins 350 degrees to face the player.
export function turnTowardAngle(current: number, target: number, dt: number): number {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * Math.min(1, Math.max(0, dt) * 5);
}
