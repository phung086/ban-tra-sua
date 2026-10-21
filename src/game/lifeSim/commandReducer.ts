import type { GameState } from '../types';

export interface LifeSimCommand {
  id: string;
  type: string;
  day: number;
}

export type LifeSimCommandStatus = 'applied' | 'duplicate' | 'stale' | 'invalid' | 'no-op';

export interface LifeSimCommandResult {
  state: GameState;
  status: LifeSimCommandStatus;
}

const COMMAND_PART = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;

export function reduceLifeSimCommand(
  state: GameState,
  command: LifeSimCommand,
  apply: (current: GameState) => GameState,
): LifeSimCommandResult {
  if (
    !command ||
    typeof command !== 'object' ||
    typeof command.type !== 'string' ||
    typeof command.id !== 'string' ||
    !Number.isSafeInteger(command.day) ||
    command.day < 1 ||
    !COMMAND_PART.test(command.type) ||
    !COMMAND_PART.test(command.id)
  ) return { state, status: 'invalid' };

  if (!Number.isSafeInteger(state.day) || state.day < 1) {
    return { state, status: 'invalid' };
  }
  const rawLedger: unknown = state.lifeSimEventLedger;
  // Missing is valid for legacy v3 saves; a present corrupt ledger must fail closed.
  // Treating corruption as an empty ledger could replay a charge or reward.
  if (rawLedger !== undefined && (
    !Array.isArray(rawLedger) ||
    rawLedger.some((entry: unknown) => typeof entry !== 'string')
  )) return { state, status: 'invalid' };

  if (command.day !== state.day) return { state, status: 'stale' };

  const prefix = `day:${state.day}:`;
  const ledger = Array.isArray(rawLedger)
    ? [...new Set(rawLedger.filter((entry: string) => entry.startsWith(prefix)))]
    : [];
  const eventId = `${prefix}${command.type}:${command.id}`;

  if (ledger.includes(eventId)) return { state, status: 'duplicate' };

  const next = apply(state);
  if (next === state) return { state, status: 'no-op' };

  return {
    state: { ...next, lifeSimEventLedger: [...ledger, eventId] },
    status: 'applied',
  };
}
