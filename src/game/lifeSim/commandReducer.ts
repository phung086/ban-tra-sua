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
const EVENT_ID = /^day:([1-9][0-9]*):[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}:[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;

function isValidEventId(value: string, currentDay: number): boolean {
  const match = EVENT_ID.exec(value);
  // JavaScript's $ may match before a final newline; require a full-string match.
  if (!match || match[0] !== value) return false;
  const eventDay = Number(match[1]);
  return Number.isSafeInteger(eventDay) && eventDay <= currentDay;
}

function isValidLedger(value: unknown, currentDay: number): value is string[] {
  if (!Array.isArray(value)) return false;
  // Array.prototype.some skips sparse slots; a damaged ledger must fail closed.
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) return false;
    const entry: unknown = value[index];
    if (typeof entry !== 'string' || !isValidEventId(entry, currentDay)) return false;
  }
  return true;
}

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
  if (rawLedger !== undefined && !isValidLedger(rawLedger, state.day)) {
    return { state, status: 'invalid' };
  }

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
