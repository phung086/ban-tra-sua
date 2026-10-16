import { describe, it, expect } from 'vitest';
import {
  computePourResonanceFreq,
  playProceduralSfx,
} from './hanoiAudioSynthesizer';

describe('hanoiAudioSynthesizer — Procedural Web Audio Sound Engine', () => {
  it('interpolates acoustic pour resonance frequency as cup fills from 0% to 100%', () => {
    expect(computePourResonanceFreq(0)).toBe(320);
    expect(computePourResonanceFreq(0.5)).toBe(600);
    expect(computePourResonanceFreq(1.0)).toBe(880);
    // Bounded clamp check
    expect(computePourResonanceFreq(-0.2)).toBe(320);
    expect(computePourResonanceFreq(1.5)).toBe(880);
  });

  it('safely handles playback in headless / test environment without throwing errors', () => {
    // In Node or SSR test environments without AudioContext, returns false gracefully
    const played = playProceduralSfx('tea_pour', { fillRatio: 0.7 });
    expect(typeof played).toBe('boolean');
  });
});
