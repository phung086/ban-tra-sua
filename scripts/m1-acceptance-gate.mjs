// M1 acceptance evidence gate. Never mistake a green SwiftShader CI for physical-device approval.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function evaluateM1(evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') return { accepted: false, errors: ['Missing evidence'] };
  const { comparison, devices } = evidence;
  if (!comparison || typeof comparison !== 'object') errors.push('Missing reproducible before/after comparison');
  else {
    const { before, after, sameSetup, warmupSeconds, sampleSeconds, quality, camera } = comparison;
    const valid = n => typeof n === 'number' && Number.isFinite(n) && n > 0;
    if (sameSetup !== true || quality !== 'light' || camera !== 'overview' ||
        warmupSeconds < 10 || sampleSeconds < 30)
      errors.push('Require identical setup, light overview, warmup >=10s and sample >=30s');
    if (!valid(before?.drawCalls) || !valid(after?.drawCalls) ||
        !valid(before?.p95Ms) || !valid(after?.p95Ms))
      errors.push('Missing finite positive drawCalls or P95 measurements');
    else {
      if ((before.drawCalls - after.drawCalls) / before.drawCalls < 0.4)
        errors.push('Draw calls reduction below 40%');
      if (after.p95Ms > before.p95Ms * 1.1)
        errors.push('P95 regression exceeds 10%');
    }
    if (!comparison.baselineSha || !comparison.candidateSha)
      errors.push('Missing baseline/candidate commit SHA');
  }
  const required = ['android-low-ram', 'iphone'];
  for (const kind of required) {
    const device = Array.isArray(devices) ? devices.find(d => d?.kind === kind) : null;
    if (!device || device.physical !== true || !device.model || !device.os ||
        !device.browser || !device.result || device.result.passed !== true ||
        !(device.result.durationMinutes >= 15) ||
        !(device.result.p95FrameMs <= 40) ||
        !(device.result.slowFramesOver100Percent < 1) ||
        !device.evidenceUrl)
      errors.push('Missing valid 15-minute physical-device evidence: ' + kind);
    if (kind === 'android-low-ram' && device && !(device.ramGb >= 3 && device.ramGb <= 4))
      errors.push('Android acceptance device must have 3-4GB RAM');
  }
  return { accepted: errors.length === 0, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/m1-acceptance-gate.mjs path/to/evidence.json');
    process.exitCode = 2;
  } else {
    try {
      const result = evaluateM1(JSON.parse(readFileSync(file, 'utf8')));
      console.log(JSON.stringify(result, null, 2));
      if (!result.accepted) process.exitCode = 1;
    } catch (error) {
      console.error('Invalid evidence:', error.message);
      process.exitCode = 2;
    }
  }
}
