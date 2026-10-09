import { describe, expect, it } from 'vitest';
import day001 from '../../../docs/life-sim/examples/day-001.design.json';
import { validateEpisode, type EpisodeDefinition, type EpisodeEffectType } from './validation';

const fixture = (): EpisodeDefinition => JSON.parse(JSON.stringify(day001)) as EpisodeDefinition;
const withReward = (type: EpisodeEffectType, key: string, delta: number): EpisodeDefinition => {
  const episode = fixture();
  episode.transitions.push({ type, key, delta, ledgerKey: `d1:bounds:${type}` });
  return episode;
};
const errors = (episode: EpisodeDefinition) => validateEpisode(episode).errors.join(' ');

describe('T1-03 resource delta scale regressions', () => {
  it('rejects unrealistic need, mood, health and trust effects', () => {
    for (const [type, key] of [
      ['need', 'satiety'], ['mood', 'mood'], ['health', 'health'], ['trust', 'hanh'],
    ] as const) {
      expect(errors(withReward(type, key, 101))).toContain('delta must be bounded integer');
      expect(errors(withReward(type, key, -101))).toContain('delta must be bounded integer');
    }
  });

  it('rejects inventory effects exceeding the content quantity cap', () => {
    expect(errors(withReward('inventory', 'tea-leaf', 100001)))
      .toContain('delta must be bounded integer');
  });

  it('keeps valid bounded needs and integer VND rewards', () => {
    expect(validateEpisode(withReward('need', 'satiety', 100)).ok).toBe(true);
    expect(validateEpisode(withReward('inventory', 'tea-leaf', 100000)).ok).toBe(true);
    expect(validateEpisode(withReward('money', 'cash', 1000000000)).ok).toBe(true);
  });
});
