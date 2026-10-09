import { describe, expect, it } from 'vitest';
import day001 from '../../../docs/life-sim/examples/day-001.design.json';
import { validateEpisode, type EpisodeDefinition } from './validation';

const copy = (): EpisodeDefinition =>
  JSON.parse(JSON.stringify(day001)) as EpisodeDefinition;
const errors = (episode: unknown): string => validateEpisode(episode).errors.join(' ');

describe('T1-03 hostile content and affordability regressions', () => {
  it('rejects circular input instead of throwing during validation', () => {
    const episode = copy() as EpisodeDefinition & { extra?: unknown };
    episode.extra = { parent: episode };
    expect(errors(episode)).toContain('cyclic object reference');
  });

  it('rejects accessors without invoking user-provided getters', () => {
    const episode = copy();
    let invoked = false;
    Object.defineProperty(episode, 'unsafe', {
      enumerable: true,
      get() { invoked = true; throw new Error('getter must not run'); },
    });
    expect(errors(episode)).toContain('accessor property');
    expect(invoked).toBe(false);
  });

  it('rejects sparse arrays disguised with an extra named property', () => {
    const episode = copy();
    const beats = episode.beats as unknown as Record<string, unknown>;
    delete beats['1'];
    beats['extra'] = 'hidden';
    expect(errors(episode)).toMatch(/non-index array property|sparse or extended array/);
  });

  it('rejects a prototype-polluting JSON property', () => {
    const episode = copy();
    Object.defineProperty(episode, '__proto__', {
      value: { polluted: true }, enumerable: true, configurable: true,
    });
    expect(errors(episode)).toContain('unsafe object key');
  });

  it('requires guards for the sum of all cash deductions on a choice', () => {
    const episode = copy();
    const choice = episode.choices[0].choices[0];
    choice.condition = [{ op: 'min-cash', value: 15000 }];
    choice.consequences.push(
      { type: 'money', key: 'cash', delta: -7000, ledgerKey: 'd1:test:fee1' },
      { type: 'money', key: 'cash', delta: -9000, ledgerKey: 'd1:test:fee2' },
    );
    expect(errors(episode)).toContain('min-cash >= 16000 required');
    choice.condition = [{ op: 'min-cash', value: 16000 }];
    expect(validateEpisode(episode).ok).toBe(true);
  });

  it('requires sufficient item quantity before ingredient consumption', () => {
    const episode = copy();
    const choice = episode.choices[0].choices[0];
    choice.consequences.push({
      type: 'inventory', key: 'tea-leaf', delta: -2, ledgerKey: 'd1:test:tea',
    });
    expect(errors(episode)).toContain('has-item tea-leaf >= 2 required');
    choice.condition = [{ op: 'has-item', key: 'tea-leaf', quantity: 2 }];
    expect(validateEpisode(episode).ok).toBe(true);
  });

  it('requires executable wake and sleep actions, not just phase labels', () => {
    const episode = copy();
    episode.beats[0].actions = ['rest'];
    expect(errors(episode)).toContain('waking entry must offer wake action');
    episode.beats[0].actions = ['wake'];
    episode.beats[episode.beats.length - 1].actions = ['rest'];
    expect(errors(episode)).toContain('sleep ending must offer sleep action');
  });

  it('rejects a transition into a time window that already ended', () => {
    const episode = copy();
    episode.beats[4].timeWindow = [1400, 1440];
    episode.beats[5].timeWindow = [1080, 1300];
    expect(errors(episode)).toContain('time-reversed');
  });
});
