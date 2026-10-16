import { describe, expect, it } from 'vitest';
import day001 from '../../../docs/life-sim/examples/day-001.design.json';
import { validateEpisode, type EpisodeDefinition } from './validation';

const fixture = (): EpisodeDefinition => JSON.parse(JSON.stringify(day001)) as EpisodeDefinition;
const errors = (episode: EpisodeDefinition): string => validateEpisode(episode).errors.join(' ');

describe('T1-03 contradictory day predicate windows', () => {
  it('rejects an episode eligible on day 1 and day 2 or later', () => {
    const episode = fixture();
    episode.eligible.push({ op: 'day-at-least', value: 2 });
    expect(errors(episode)).toContain('eligible: contradictory day predicates');
  });

  it('rejects a mandatory beat with an impossible day window', () => {
    const episode = fixture();
    episode.beats[3].condition = [
      { op: 'day-at-least', value: 5 },
      { op: 'day-at-most', value: 4 },
    ];
    expect(errors(episode)).toContain('beats[3].condition: contradictory day predicates');
  });

  it('rejects an impossible choice condition before runtime', () => {
    const episode = fixture();
    episode.choices[0].choices[0].condition = [
      { op: 'day-eq', value: 1 },
      { op: 'day-at-least', value: 2 },
    ];
    expect(errors(episode)).toContain('choices[0].choices[0].condition: contradictory day predicates');
  });

  it('accepts compatible bounded day conditions', () => {
    const episode = fixture();
    episode.eligible = [
      { op: 'day-at-least', value: 1 },
      { op: 'day-at-most', value: 2 },
    ];
    expect(validateEpisode(episode).ok).toBe(true);
  });

  it('accepts inclusive day equality boundaries', () => {
    const episode = fixture();
    episode.eligible = [
      { op: 'day-eq', value: 1 },
      { op: 'day-at-least', value: 1 },
      { op: 'day-at-most', value: 1 },
    ];
    expect(validateEpisode(episode).ok).toBe(true);
  });
});
