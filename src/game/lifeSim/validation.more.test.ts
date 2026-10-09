import { describe, expect, it } from 'vitest';
import day001 from '../../../docs/life-sim/examples/day-001.design.json';
import { validateEpisode } from './validation';

const copy = () => JSON.parse(JSON.stringify(day001)) as typeof day001;
const errors = (episode: unknown) => validateEpisode(episode).errors.join(' ');

describe('T1-03 safety and deterministic validation', () => {
  it('produces the same result without mutating its input', () => {
    const episode = copy();
    const original = JSON.stringify(episode);
    expect(validateEpisode(episode).ok).toBe(true);
    expect(JSON.stringify(episode)).toBe(original);
    expect(validateEpisode(episode)).toEqual(validateEpisode(copy()));
  });

  it('rejects duplicate effect ledger identifiers', () => {
    const episode = copy();
    episode.transitions[0].ledgerKey = episode.choices[0].choices[0].consequences[0].ledgerKey;
    expect(errors(episode)).toContain('duplicate ledgerKey');
  });

  it('rejects unreachable beats', () => {
    const episode = copy();
    episode.beats[1].exit = 'store-open';
    episode.beats[1].failForward = 'store-open';
    expect(errors(episode)).toContain('unreachable');
  });

  it('rejects an episode with no unconditional free dinner route', () => {
    const episode = copy();
    episode.choices[0].choices[0].condition = [{ op: 'min-cash', value: 1000 }];
    expect(errors(episode)).toContain('cash-zero softlock');
  });

  it('rejects a cycle in the episode graph', () => {
    const episode = copy();
    episode.beats[4].exit = 'breakfast';
    expect(errors(episode)).toContain('cycle');
  });
});
