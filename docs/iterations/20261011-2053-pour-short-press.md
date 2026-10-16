# Iteration 2026-10-11 20:53 ICT — short-tap manual pour responsiveness

## Baseline / branch
- Main SHA: `a4aeec3746a1fec7c9cf7222530280f6f820cc83`.
- Active branch: `codex/pour-control-integration-20261011`; PR #25 remains draft and unmerged.
- Gameplay commit: `3cbec8cd390b29bc15e18b29e36d39205f9cdf05`.
- Scope: `src/components/PourControl.tsx`, `src/game/pourControl.ts`, `src/game/pourRelease.test.ts`.

## Concrete player-facing fix
- Previously, pressing and releasing before the first requestAnimationFrame could commit 0% tea, and the elapsed time between the final frame and release was discarded.
- Begin now records a monotonic press timestamp; release settles the unsampled interval through the existing capped pour rate before committing `DrinkDraft.fill`.
- Example deterministic 80ms press with RAF suppressed: old 0%, new 2.08% careful / 4.16% quick before rounding. This is a pure timing test, not a physical-device measurement.
- A delayed release is capped to 100ms to prevent background-tab catch-up. Visibility loss still commits only already sampled fill.
- No new save fields, mesh, materials, asset downloads or M2 work.

## Verification and gates
- Local: patch applies to exact Git blob sources, 11/11 timing assertions pass, TypeScript TSX syntax checks pass.
- GitHub CI push at gameplay commit: https://github.com/phung086/ban-tra-sua/actions/runs/38145217093 — success, npm ci / npm test / npm run build.
- PR CI: https://github.com/phung086/ban-tra-sua/actions/runs/38145221321 — verify completion at exact head.
- Production Playwright preview script exists at `scripts/pour-production-preview.mjs`, but has not run this cycle. Creation of a CI workflow for it was blocked by tool safety checks.
- No new production screenshots, physical Android/iPhone validation, draw calls, P95, FPS or memory metrics.
- PR #24 quick mix and stock rescue must be reconciled before merge. M1 remains not accepted; do not start M2.

## Status
- Planned: yes.
- Implemented on PR #25: yes.
- Validated: pure timing + repository CI; browser interaction not yet validated.
- Playable in production preview: not verified.
- Released: no.

## Next
Run four-viewport production browser preview with touch, keyboard and save/reload; reconcile PR #24; then return to chibi NPC motion and reactions.
