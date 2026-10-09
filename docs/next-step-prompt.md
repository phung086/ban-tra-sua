# Next step: M1.1ad — verify QI-05 ABBA/BAAB artifacts and CI

Read docs/production-roadmap.md, docs/iteration-protocol.md, docs/iterations/m1-01.md, docs/experience-quality/README.md, backlog.md, quality-gates.md and ai-handoff.md. Verify remote HEAD and exact-SHA CI before changes. The prior production #37928850991 and A/B #37928851001/#37928851125 were on SHA 1124fa3, not the new QI-05 patch.

QI-05 changes A/B instrumentation only: two matched rounds per variant in light/balanced, ABBA/BAAB, 16 rows and 16 WebGL PNGs per workflow, median/min/max and sample counts with fail-closed statistics. Verify both workflows on **the same new SHA**: all 16 rows, 16 PNGs, four comparisons with two pairs each, zero failures, no blank/cropped frames or camera-pose mismatch. Investigate any CI/workflow failures; do not weaken asserts or label noisy SwiftShader P95 as GPU phone FPS.

Then continue M1.1 QI-03: full production benchmark before/after same Chromium/390×844/DPR1/light-balanced with >=40% overview-light draw-call reduction and <=10% P95 regression, matched images/camera motion and joystick/NPC/wall/scooter/10/10 craft-delivery. If regression, optimize or revert. M1.1 remains blocked by absolute mobile budgets and 15-minute Android RAM3–4GB + iPhone FPS/P95, memory, thermal and two-finger gameplay; no M2, merge or deploy.

## Quality initiative handoff (not a second active technical milestone)

User feedback on 10/10/2026: existing gameplay feels boring, current actors/animation, VFX, realism and graphics require major improvement. All future AI contributors **must read** [Experience Quality Initiative](experience-quality/README.md), [91-item backlog](experience-quality/backlog.md), [quality gates](experience-quality/quality-gates.md), and [AI handoff](experience-quality/ai-handoff.md) before selecting visual/game-feel work. Explicit task IDs, objective gameplay integrity, images/motion clips, independent perceptual reviews and before/after mobile budgets are required. This backlog is PLAN, not implementation.

**The one current technical next step remains M1.1aa above:** check latest exact-SHA production benchmark/CI, inspect matched screenshots and all gameplay, then continue a single valid renderer/perf QA task (QI-03/QI-05) or fix any regression. Do not launch M3 visual asset, M4 input rewrite, M6 new loop or M7 VFX early. M1.1 needs real Android 3–4GB + iPhone 15-min tests and absolute budgets; do not claim acceptance or switch milestones.
