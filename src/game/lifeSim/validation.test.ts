import { describe, expect, it } from 'vitest';
import day001 from '../../../docs/life-sim/examples/day-001.design.json';
import { validateEpisode } from './validation';

const copy = (): Record<string, unknown> => JSON.parse(JSON.stringify(day001)) as Record<string, unknown>;

describe('T1-03 episode graph', () => {
  it('accepts the repaired day-001 design without claiming it is playable', () => {
    expect(validateEpisode(copy()).ok).toBe(true);
  });

  it('rejects dangling graph edges', () => {
    const episode = copy() as typeof day001;
    episode.beats[0].failForward = 'unknown-beat';
    const result = validateEpisode(episode);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('dangling');
  });

  it('rejects a choice with an unguarded payment', () => {
    const episode = copy() as typeof day001;
    episode.choices[0].choices[1].consequences.push({
      type: 'money', key: 'cash', delta: -50000, ledgerKey: 'day1:dinner:fee'
    } as (typeof episode.choices)[number]['choices'][number]['consequences'][number]);
    const result = validateEpisode(episode);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('min-cash');
  });
});
