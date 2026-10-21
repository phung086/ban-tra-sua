import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../engine';
import { loadGame, saveGame } from '../storage';
import { reduceLifeSimCommand } from './commandReducer';

const command = { day: 1, type: 'home-meal', id: 'cook-breakfast' };

describe('life-sim command reducer', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('records state and event atomically and blocks replay after save/reload', () => {
    const initial = createInitialState();
    const first = reduceLifeSimCommand(initial, command, (state) => ({
      ...state,
      cash: state.cash - 100,
    }));

    expect(first.status).toBe('applied');
    expect(first.state.cash).toBe(initial.cash - 100);
    expect(first.state.lifeSimEventLedger).toEqual(['day:1:home-meal:cook-breakfast']);

    saveGame(first.state);
    const restored = loadGame();
    expect(restored.saveVersion).toBe(3);
    expect(restored.cash).toBe(first.state.cash);
    expect(restored.lifeSimEventLedger).toEqual(first.state.lifeSimEventLedger);

    const replay = reduceLifeSimCommand(restored, command, (state) => ({
      ...state,
      cash: state.cash - 100,
    }));
    expect(replay.status).toBe('duplicate');
    expect(replay.state).toBe(restored);
    expect(replay.state.cash).toBe(initial.cash - 100);
  });

  it('rejects stale and malformed commands without changing state', () => {
    const initial = createInitialState();
    const apply = (state: typeof initial) => ({ ...state, cash: state.cash - 1 });
    const stale = reduceLifeSimCommand(initial, { ...command, day: initial.day + 1 }, apply);
    const malformed = reduceLifeSimCommand(initial, { ...command, id: '../replay' }, apply);
    const missingId = reduceLifeSimCommand(
      initial,
      { ...command, id: undefined as unknown as string },
      apply,
    );

    expect(stale.status).toBe('stale');
    expect(malformed.status).toBe('invalid');
    expect(missingId.status).toBe('invalid');
    expect(stale.state).toBe(initial);
    expect(malformed.state).toBe(initial);
    expect(missingId.state).toBe(initial);
    expect(initial.lifeSimEventLedger).toBeUndefined();
  });

  it('fails closed on a corrupt persisted ledger instead of risking a duplicate charge', () => {
    const initial = createInitialState();
    const apply = (state: typeof initial) => ({ ...state, cash: state.cash - 100 });

    const corruptShape = {
      ...initial,
      lifeSimEventLedger: { damaged: true } as unknown as string[],
    };
    const invalidShape = reduceLifeSimCommand(corruptShape, command, apply);
    expect(invalidShape.status).toBe('invalid');
    expect(invalidShape.state).toBe(corruptShape);
    expect(invalidShape.state.cash).toBe(initial.cash);

    const corruptEntry = {
      ...initial,
      lifeSimEventLedger: ['day:1:home-meal:cook-breakfast', null] as unknown as string[],
    };
    const invalidEntry = reduceLifeSimCommand(corruptEntry, command, apply);
    expect(invalidEntry.status).toBe('invalid');
    expect(invalidEntry.state).toBe(corruptEntry);
    expect(invalidEntry.state.cash).toBe(initial.cash);

    const malformedKey = {
      ...initial,
      lifeSimEventLedger: ['not-an-event-key'] as unknown as string[],
    };
    const invalidKey = reduceLifeSimCommand(malformedKey, command, apply);
    expect(invalidKey.status).toBe('invalid');
    expect(invalidKey.state).toBe(malformedKey);
    expect(invalidKey.state.cash).toBe(initial.cash);

    const unsafeDayKey = {
      ...initial,
      lifeSimEventLedger: ['day:999999999999999999999999:home-meal:cook-breakfast'],
    };
    const invalidDayKey = reduceLifeSimCommand(unsafeDayKey, command, apply);
    expect(invalidDayKey.status).toBe('invalid');
    expect(invalidDayKey.state).toBe(unsafeDayKey);
    expect(invalidDayKey.state.cash).toBe(initial.cash);

    const futureDayKey = {
      ...initial,
      lifeSimEventLedger: ['day:2:home-meal:cook-breakfast'],
    };
    const invalidFutureDay = reduceLifeSimCommand(futureDayKey, command, apply);
    expect(invalidFutureDay.status).toBe('invalid');
    expect(invalidFutureDay.state).toBe(futureDayKey);
    expect(invalidFutureDay.state.cash).toBe(initial.cash);

    const sparseLedger = new Array(1) as string[];
    const sparseKey = { ...initial, lifeSimEventLedger: sparseLedger };
    const invalidSparse = reduceLifeSimCommand(sparseKey, command, apply);
    expect(invalidSparse.status).toBe('invalid');
    expect(invalidSparse.state).toBe(sparseKey);
    expect(invalidSparse.state.cash).toBe(initial.cash);

    const trailingNewlineKey = {
      ...initial,
      lifeSimEventLedger: ['day:1:home-meal:cook-breakfast\n'],
    };
    const invalidTrailingNewline = reduceLifeSimCommand(trailingNewlineKey, command, apply);
    expect(invalidTrailingNewline.status).toBe('invalid');
    expect(invalidTrailingNewline.state).toBe(trailingNewlineKey);
    expect(invalidTrailingNewline.state.cash).toBe(initial.cash);
  });

  it('does not consume no-op commands and compacts the ledger on day rollover', () => {
    const initial = createInitialState();
    const noOp = reduceLifeSimCommand(initial, command, (state) => state);
    expect(noOp.status).toBe('no-op');
    expect(noOp.state.lifeSimEventLedger).toBeUndefined();

    const first = reduceLifeSimCommand(noOp.state, command, (state) => ({
      ...state,
      cash: state.cash - 1,
    }));
    expect(first.status).toBe('applied');

    const dayTwo = { ...first.state, day: 2 };
    const next = reduceLifeSimCommand(dayTwo, { ...command, day: 2 }, (state) => ({
      ...state,
      cash: state.cash - 1,
    }));
    expect(next.status).toBe('applied');
    expect(next.state.lifeSimEventLedger).toEqual(['day:2:home-meal:cook-breakfast']);
    expect(next.state.cash).toBe(initial.cash - 2);
  });
});
