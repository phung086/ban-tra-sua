import { describe, expect, it } from 'vitest';
import day001 from '../../../docs/life-sim/examples/day-001.design.json';
import { validateEpisode, type EpisodeDefinition } from './validation';

const fixture = (): EpisodeDefinition => JSON.parse(JSON.stringify(day001)) as EpisodeDefinition;
const issues = (episode: unknown): string => validateEpisode(episode).errors.join(' ');

describe('T1-03 malformed content boundary regressions', () => {
  it('rejects non-finite numeric data before graph traversal', () => {
    const episode = fixture();
    episode.priority = Number.POSITIVE_INFINITY;
    expect(issues(episode)).toContain('non-finite number');
  });

  it('rejects BigInt fields without throwing or mutating input', () => {
    const episode = fixture() as EpisodeDefinition & { debug?: unknown };
    episode.debug = 1n;
    expect(issues(episode)).toContain('non-JSON value');
    expect(episode.debug).toBe(1n);
  });

  it('rejects a missing fail-forward on a mandatory conditional beat', () => {
    const episode = fixture();
    const beat = episode.beats[1];
    beat.condition = [{ op: 'min-cash', value: 1000 }];
    beat.optional = false;
    beat.failForward = null;
    expect(issues(episode)).toContain('mandatory conditional beat needs failForward');
  });

  it('rejects duplicate place IDs without changing the original fixture', () => {
    const episode = fixture();
    const original = JSON.stringify(episode);
    episode.places.push(episode.places[0]);
    expect(issues(episode)).toContain('duplicate ID');
    expect(JSON.stringify(fixture())).toBe(original);
  });

  it('requires both cash and inventory guards on a compound-cost choice', () => {
    const episode = fixture();
    const choice = episode.choices[0].choices[0];
    choice.consequences.push(
      { type: 'money', key: 'cash', delta: -12000, ledgerKey: 'day1:boundary:money' },
      { type: 'inventory', key: 'tea-leaf', delta: -2, ledgerKey: 'day1:boundary:tea' },
    );
    expect(issues(episode)).toContain('min-cash >= 12000 required');
    expect(issues(episode)).toContain('has-item tea-leaf >= 2 required');
    choice.condition = [
      { op: 'min-cash', value: 12000 },
      { op: 'has-item', key: 'tea-leaf', quantity: 2 },
    ];
    expect(validateEpisode(episode).ok).toBe(true);
  });
});
