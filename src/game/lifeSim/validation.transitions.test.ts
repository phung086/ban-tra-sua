import { describe, expect, it } from 'vitest';
import day001 from '../../../docs/life-sim/examples/day-001.design.json';
import { validateEpisode, type EpisodeDefinition } from './validation';

const fixture = (): EpisodeDefinition => JSON.parse(JSON.stringify(day001)) as EpisodeDefinition;
const messages = (episode: EpisodeDefinition): string => validateEpisode(episode).errors.join(' ');

describe('T1-03 unguarded day-level transition regression', () => {
  it('rejects unconditional VND deductions even if the player has zero cash', () => {
    const episode = fixture();
    episode.transitions.push({
      type: 'money', key: 'cash', delta: -25000, ledgerKey: 'd1:automatic:fee',
    });
    expect(messages(episode)).toContain('unconditional spending requires a guarded choice');
  });

  it('rejects unconditional ingredient consumption', () => {
    const episode = fixture();
    episode.transitions.push({
      type: 'inventory', key: 'tea-leaf', delta: -2, ledgerKey: 'd1:automatic:tea',
    });
    expect(messages(episode)).toContain('unconditional spending requires a guarded choice');
  });

  it('still permits nonnegative rewards and existing day-001 design', () => {
    const episode = fixture();
    episode.transitions.push({
      type: 'money', key: 'cash', delta: 1000, ledgerKey: 'd1:welcome:bonus',
    });
    expect(validateEpisode(episode).ok).toBe(true);
    expect(validateEpisode(fixture()).ok).toBe(true);
  });
});
