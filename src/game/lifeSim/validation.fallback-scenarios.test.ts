import { describe, expect, it } from 'vitest';
import day001 from '../../../docs/life-sim/examples/day-001.design.json';
import { validateEpisode, type EpisodeDefinition } from './validation';

const day = (): EpisodeDefinition => JSON.parse(JSON.stringify(day001)) as EpisodeDefinition;

describe('T1-03 fail-forward fixtures (static, not playable)', () => {
  it('rejects an episode whose dinner choices all require cash', () => {
    const episode = day();
    for (const choice of episode.choices[0].choices) choice.condition = [{ op: 'min-cash', value: 1000 }];
    expect(validateEpisode(episode).errors.join(' ')).toContain('cash-zero softlock');
  });
  it('accepts a safe fallback for missed promises', () => {
    const episode = day();
    for (const choice of episode.choices[0].choices) choice.condition = [{ op: 'has-flag', key: 'promise-kept', value: true }];
    episode.choices[0].fallbackNext = 'sleep';
    expect(validateEpisode(episode).ok).toBe(true);
  });
  it('requires an ingredient guard for a cooking choice', () => {
    const episode = day();
    episode.choices[0].choices[0].consequences.push({ type: 'inventory', key: 'tea-leaf', delta: -2, ledgerKey: 'd1:static:tea' });
    expect(validateEpisode(episode).errors.join(' ')).toContain('has-item tea-leaf >= 2 required');
  });
});
