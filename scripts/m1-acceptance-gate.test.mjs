import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateM1 } from './m1-acceptance-gate.mjs';

const device = (kind, extra = {}) => ({
  kind, physical: true, model: kind === 'iphone' ? 'iPhone test' : 'Android test',
  ramGb: 4, os: 'test OS', browser: 'test browser', evidenceUrl: 'https://example.com/evidence',
  result: { passed: true, durationMinutes: 15, p95FrameMs: 35, slowFramesOver100Percent: 0.5 },
  ...extra,
});
const good = () => ({
  comparison: { before: { drawCalls: 1000, p95Ms: 30 }, after: { drawCalls: 550, p95Ms: 32 },
    sameSetup: true, quality: 'light', camera: 'overview',
    warmupSeconds: 10, sampleSeconds: 30, baselineSha: 'base', candidateSha: 'candidate' },
  devices: [device('android-low-ram'), device('iphone')],
});
test('requires both physical device classes', () => {
  const e = good(); e.devices = [];
  assert.equal(evaluateM1(e).accepted, false);
});
test('accepts complete qualifying example schema (fixture, not actual measured evidence)', () => {
  assert.equal(evaluateM1(good()).accepted, true);
});
test('rejects insufficient draw-call savings', () => {
  const e = good(); e.comparison.after.drawCalls = 650;
  assert.match(evaluateM1(e).errors.join(' '), /40%/);
});
test('rejects P95 regression', () => {
  const e = good(); e.comparison.after.p95Ms = 34;
  assert.match(evaluateM1(e).errors.join(' '), /P95/);
});
test('rejects headless-emulated phone', () => {
  const e = good(); e.devices[0].physical = false;
  assert.equal(evaluateM1(e).accepted, false);
});
test('rejects missing 15 minute physical session', () => {
  const e = good(); e.devices[1].result.durationMinutes = 5;
  assert.equal(evaluateM1(e).accepted, false);
});
