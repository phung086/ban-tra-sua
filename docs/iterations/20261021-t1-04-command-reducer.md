# Iteration T1-04 — Atomic life-sim command ledger

- Baseline main SHA: `e1b3bda53dac08a0689dbbfd8fb9ff3cd01566fa`.
- Branch: `codex/life-command-reducer-20261021`.
- Scope: runtime-backed once-only command reducer wired into breakfast preparation and finish.
- Behavior: rejects malformed/stale commands; returns gameplay mutation and event key together; compacts ledger to the current in-game day; keeps save v3 unchanged.
- Regression coverage: save/reload replay, malformed and stale IDs, no-op retry, day rollover, repeated breakfast finish.
- `npm test`: PENDING exact final SHA.
- `npm run build`: PENDING exact final SHA.
- Browser smoke (360x800, 390x844, 844x390, desktop), screenshots and console: PENDING.
- Full sleep/save/reload, brewing/delivery, joystick/camera/collision and physical Android/iPhone: PENDING.
- No merge/release claim until exact-SHA CI and changed-scope browser/save gates pass.
