export type ProceduralSfxKind =
  | 'tea_pour'
  | 'ice_clink'
  | 'cup_shaker'
  | 'cup_sealer'
  | 'street_bell'
  | 'cash_register';

export interface SfxOptions {
  volume?: number;
  fillRatio?: number; // 0.0 (empty) to 1.0 (full) for tea_pour resonance
  pitchOffset?: number;
}

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

/**
 * Calculates the acoustic resonance center frequency as a tea cup fills up.
 * As liquid fills the cylinder from 0% to 100%, cavity resonance rises from ~320Hz to ~880Hz.
 */
export function computePourResonanceFreq(fillRatio = 0.5): number {
  const clamped = Math.max(0, Math.min(1, fillRatio));
  return Math.round(320 + clamped * 560);
}

/**
 * Plays a zero-asset procedural sound effect using Web Audio API synthesis.
 * Safe for offline play, zero missing file errors, zero copyright risk.
 */
export function playProceduralSfx(
  kind: ProceduralSfxKind,
  options: SfxOptions = {},
): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const now = ctx.currentTime;
  const masterVolume = Math.max(0, Math.min(1, options.volume ?? 0.8));

  switch (kind) {
    case 'tea_pour': {
      // White noise through a bandpass filter sliding upwards in frequency as cup fills
      const bufferSize = Math.floor(ctx.sampleRate * 0.45);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const startFreq = computePourResonanceFreq(options.fillRatio ?? 0.3);
      filter.frequency.setValueAtTime(startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(
        Math.min(1400, startFreq * 1.35),
        now + 0.42,
      );
      filter.Q.setValueAtTime(3.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.45 * masterVolume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(now);
      break;
    }

    case 'ice_clink': {
      // Dual high-frequency crystal tones with rapid decay
      [1850, 2420].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * (options.pitchOffset ?? 1), now + idx * 0.015);
        gain.gain.setValueAtTime(0.35 * masterVolume, now + idx * 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.015 + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.015);
        osc.stop(now + idx * 0.015 + 0.09);
      });
      break;
    }

    case 'cup_shaker': {
      // Two-stroke filtered noise sweep mimicking cocktail shaker
      [0, 0.16].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now + delay);
        osc.frequency.exponentialRampToValueAtTime(320, now + delay + 0.07);
        gain.gain.setValueAtTime(0.01, now + delay);
        gain.gain.linearRampToValueAtTime(0.4 * masterVolume, now + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.13);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.14);
      });
      break;
    }

    case 'cup_sealer': {
      // Pneumatic press hiss followed by satisfying latch snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
      gain.gain.setValueAtTime(0.5 * masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
      break;
    }

    case 'street_bell': {
      // Nostalgic Hanoi bicycle bell chime (dual frequency ring)
      [1240, 1560].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.4 * masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.58);
      });
      break;
    }

    case 'cash_register': {
      // Bright brass coin drop chime (B5 -> E6)
      [987, 1318].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.38 * masterVolume, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.34);
      });
      break;
    }
  }

  return true;
}
