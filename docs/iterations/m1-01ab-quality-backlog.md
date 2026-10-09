# M1.1ab — Experience Quality Backlog, not a gameplay implementation (10/10/2026)

## Preflight

Repository: phung086/ban-tra-sua; only branch codex/mobile-beta-foundation. Remote HEAD before editing: **1124fa38994c6dab215404b0c7356bce73a1abfe**. CI [#37928850940](https://github.com/phung086/ban-tra-sua/actions/runs/37928850940) **success** on that exact SHA. Also [production #37928850991](https://github.com/phung086/ban-tra-sua/actions/runs/37928850991), [near-radius A/B #37928851001](https://github.com/phung086/ban-tra-sua/actions/runs/37928851001), [near-sector A/B #37928851125](https://github.com/phung086/ban-tra-sua/actions/runs/37928851125) were reported **success** on same SHA; no additional benchmark was run in this docs-only iteration. Main SHA at preflight: **a4aeec3746a1fec7c9cf7222530280f6f820cc83**; main is not the target and must not be modified.

Roadmap/protocol/m1-01/next-step and Game Design Bible/playbook read before authoring, plus representative current source modules (game movement, collision, customerAi, audio, engine; scene actorGeometry, city, models, Three renderer; MovementStick, CraftWorkbench, ServeCelebration, NeighborhoodDialogue, GameSettings). The backlog relates tasks to real paths but does not assert an implementation that the source does not prove.

## Motivation and deliverables

Owner feedback 10/10: current game feels repetitive, characters unattractive, effects and visuals poor, interactions lack believability. Convert into **91 individually tracked tasks** in nine epics with P0/P1/P2, dependencies/gates, candidate code locations and explicit acceptance, including gameplay, motion, character quality, graphics/lighting, NPC/collision, VFX/audio, UI and long-term life-sim. Task counts: QI 12, QF 10, QC 12, QV 10, QR 10, QG 12, QS 8, QU 9, QL 8.

New:
- docs/experience-quality/README.md — product quality pillars, delivery order and allowed work while M1.1 open.
- docs/experience-quality/backlog.md — 91 work IDs with technical anchors, test acceptance and stage dependencies.
- docs/experience-quality/quality-gates.md — visual/play-feel rubric 0–4, real test route, screenshots/animation clips, performance/mobile/save criteria and report record.
- docs/experience-quality/ai-handoff.md — agent ownership, one-task work order, branch lease, non-overlap, exact SHA CI, revert and honest blockers.
- This report.

Updated cross-links and intent: README.md; docs/production-roadmap.md; docs/game-design/README.md; docs/next-step-prompt.md. **The current next technical action stays M1.1aa**, not a premature M3 asset rollout. Separate quality specs may be refined without changing the active milestone.

## Verification and state

This iteration modifies **documents only**; no gameplay, renderer, scripts, assets, VFX, quest logic, performance code or save schema changed. No new performance uplift or improved perceived gameplay is claimed. Previous production relative overview-light threshold evidence is not a human perceptual approval, and CI alone does not close device gates.

Validation after commit: fetch new exact remote SHA and run status, confirm GitHub CI green on exactly that SHA. If CI has not finished, report pending rather than claiming pass. Benchmark workflows may not retrigger on docs-only changes; do not cite older run as a new measurement.

All 91 backlog task statuses **PLAN**. The M1.1 roadmap remains **BLOCKED**, especially absolute mobile budgets and the 15-minute physical Android RAM3–4GB + iPhone two-finger/FPS/P95/memory/thermal/gameplay test. No M2/M3, no merging, no deployment, no touches to other AI branches.

## One concrete next technical action

**M1.1aa / QI-03:** retrieve latest same-SHA production results and compare matched light/balanced, camera motion, NPC, joystick, collisions, 10/10 craft-delivery and screenshots. If valid, use controlled A/B repeat (QI-05) to choose next scoped culling change; if regression is proven, fix/revert. This task selection keeps the quality backlog live while respecting M1.1.
