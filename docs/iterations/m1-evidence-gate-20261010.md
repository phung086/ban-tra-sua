# M1 evidence acceptance gate — 2026-10-10
- Added scripts/m1-acceptance-gate.mjs and Node tests.
- Explicitly separates software-WebGL benchmark pass from physical acceptance.
- M1 remains blocked pending real Android 3–4GB and iPhone evidence, 15-minute sessions, and controlled light-overview baseline/candidate comparison.
- Use: node --test scripts/m1-acceptance-gate.test.mjs
- Use with measured evidence: node scripts/m1-acceptance-gate.mjs path/to/real-evidence.json
- Example test fixtures are synthetic and MUST NOT be presented as measured devices.
- No scene changes; no M2.
- Next: produce reproducible measurements and device artifacts, then validate and review M1 acceptance.
