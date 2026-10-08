import { describe, expect, it } from 'vitest';
import { FramePacer } from './framePacing';

function countRenderOpportunities(hz: number, seconds = 10) {
  const pacer = new FramePacer(30);
  let draws = 0;
  for (let frame = 0; frame < hz * seconds; frame++) {
    if (pacer.shouldRender((frame * 1000) / hz)) draws++;
  }
  return draws;
}

describe('frame pacing', () => {
  it.each([30, 60, 75, 90, 120, 144])(
    'provides 30 render opportunities per second on %i Hz callbacks',
    (hz) => {
      expect(countRenderOpportunities(hz)).toBe(300);
    },
  );

  it('does not catch up with a burst after a long stall', () => {
    const pacer = new FramePacer(30);
    expect(pacer.shouldRender(0)).toBe(true);
    expect(pacer.shouldRender(1000)).toBe(true);
    expect(pacer.shouldRender(1001)).toBe(false);
    expect(pacer.shouldRender(1033.3333333333333)).toBe(true);
  });

  it('resets its schedule when the runtime resumes', () => {
    const pacer = new FramePacer(30);
    expect(pacer.shouldRender(100)).toBe(true);
    expect(pacer.shouldRender(101)).toBe(false);
    pacer.reset();
    expect(pacer.shouldRender(101)).toBe(true);
    expect(pacer.shouldRender(102)).toBe(false);
  });

  it('rejects non-finite timestamps without corrupting its schedule', () => {
    const pacer = new FramePacer(30);
    expect(pacer.shouldRender(NaN)).toBe(false);
    expect(pacer.shouldRender(Infinity)).toBe(false);
    expect(pacer.shouldRender(0)).toBe(true);
    expect(pacer.shouldRender(1)).toBe(false);
  });
});
