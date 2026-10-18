import { describe, expect, it, vi } from 'vitest';
import { supportsWebGL } from './webglSupport';

function canvas(getContext: ReturnType<typeof vi.fn>): HTMLCanvasElement {
  return { getContext } as unknown as HTMLCanvasElement;
}

describe('WebGL startup fallback', () => {
  it('falls back when neither WebGL version is available', () => {
    const getContext = vi.fn(() => null);
    expect(supportsWebGL(() => canvas(getContext))).toBe(false);
    expect(getContext).toHaveBeenCalledWith('webgl2');
    expect(getContext).toHaveBeenCalledWith('webgl');
  });

  it('supports WebGL1 and releases its temporary probe', () => {
    const loseContext = vi.fn();
    const getContext = vi.fn((kind: string) =>
      kind === 'webgl' ? { getExtension: () => ({ loseContext }) } : null);
    expect(supportsWebGL(() => canvas(getContext))).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it('fails safely when context creation throws', () => {
    expect(supportsWebGL(() => { throw new Error('GPU unavailable'); })).toBe(false);
  });
});
