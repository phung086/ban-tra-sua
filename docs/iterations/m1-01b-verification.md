# M1.1b — isolated benchmark acceptance validation

Date: 2026-10-08. Parent source: `79f596d714ea3ebdbcf85878ccdd9e3675d7b562` on `codex/mobile-beta-foundation`.

## Scope and isolation
Work confined to `codex/m1-benchmark-gate-isolated`, created from the exact parent SHA. No writes to `main` or `codex/mobile-beta-foundation`. M1 and M2 renderer/gameplay code are unchanged.

## Fix
Previously `scripts/m1-browser-benchmark.mjs` printed `M1 GATE UNMET` for the light/overview criterion but returned exit code 0 unless a separate smoke error occurred. That could produce a green workflow with a known M1 performance regression.

Now draw-call reduction under 40% OR P95 frame interval growth over 10% adds a failure, writes machine-readable `m1-artifacts/gate.json` with comparisons and failures, and forces exit code 1. Missing comparable overview samples also fail. The separate benchmark workflow is now enabled for this isolated branch, without modifying the existing branch's trigger.

## Verification status
- GitHub Actions `CI` runs `npm ci`, `npm test`, and `npm run build` on `codex/**` branches. Confirm conclusion for the final SHA, not the parent.
- GitHub Actions `M1 mobile scene benchmark` builds matched sector 16/32 variants and runs Playwright against production previews with Chromium SwiftShader, 10s warm-up and 30s capture. Collect screenshots, measurements, and gate.json from the artifact.
- These checks are CI/headless proxies, **not a physical Android/iPhone benchmark**. Main/shadow pass attribution and GPU timings are not supplied. No before/after measured performance number is claimed in this report.
- Environment limitation: container git clone fails (GitHub DNS), so local `npm ci` / production preview and real-device manipulation were not performed in this execution.
- Collision, joystick, camera, NPC and full brew/delivery need passing production browser smoke, and physical multi-touch still remains unverified.

## M1 decision
**Not accepted. Do not advance M2.** Only mark M1.1 complete after checking the finished benchmark artifacts, exact head SHA, frame P50/P95, draw-call reduction, triangles and memory, plus device acceptance.

## Follow-up
If benchmark shows <40% draw-call reduction or >10% P95 growth, keep CI red and pursue sector-aware instancing/culling, or revert sector 32 if regression is confirmed. If the browser run cannot produce samples, correct the test harness first, then rerun the same fixed viewport/camera benchmark.
