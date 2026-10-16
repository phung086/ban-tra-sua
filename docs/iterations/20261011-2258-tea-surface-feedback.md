# Iteration 25 — 2026-10-11 22:58 ICT — tea surface and tactile cue groundwork

## Scope and source of truth
- Main at start: `a4aeec3746a1fec7c9cf7222530280f6f820cc83`.
- Active draft PR: #25, branch `codex/pour-control-integration-20261011`. PR #24 also changes the brewing workbench; no merge attempted.
- All 13 required docs were read sequentially, with no unreadable files.
- Backlog: `UX-POUR-01` remains **in_progress**, not accepted.

## Changes committed on PR #25
1. `src/game/pourControl.ts`: pure `pourCuePulse(previous, next)` emits a short signal only when entering approach or release thresholds. This is groundwork; **the React component has not yet been wired to call it**.
2. `src/components/PourControl.css`: lightweight tea meniscus, glass highlight and small ripple while pouring. Honors reduced motion. No new mesh, texture or save fields.
3. `src/game/pourCuePulse.test.ts`: threshold, dedupe, short-release and 30/60-FPS math tests.

The attempted `PourControl.tsx` integration write was rejected by the GitHub connector safety gate. The component still renders its previous CSS-only release cue. Do not claim the new audio/haptic threshold behavior is playable.

## Validation
- GitHub Actions push and PR workflows for pre-report head `4443c4f6ebde3431f21afa0fb61d7b38f2ac0298`: **SUCCESS** (CI run IDs 38153639290 and 38153645095); install, tests, preflight, typecheck and build passed.
- Local **fixture-only** Chromium screenshot comparison (not production): 360x800, 390x844, 844x390, 1280x800, fixed 78% fill/80% target and reduced-motion. No horizontal overflow; cup bounding box and liquid height unchanged. The only visual differences are liquid shading/reflection/ripple meniscus. Screenshots held in this run's handoff.
- Production preview not run: no checked-out repository or reachable GitHub network from local runner. Physical Android/iPhone and M1 measurements not available.
- M1 acceptance not met: no new verified draw-call reduction, P95 or device evidence; M2 remains blocked.

## Next
1. Wire the already-tested `pourCuePulse` to `PourControl.tsx` with no repeated frame feedback, and add React interaction tests.
2. Run production preview 360x800, 390x844, 844x390, desktop; verify receive → pour → shake → seal → deliver and save/reload.
3. Reconcile #24 stock rescue/quick-brew without overwriting it. Then shift toward chibi walking/idle and NPC delivery expressions.
4. Keep PR draft and do not merge until scope gates are satisfied.
