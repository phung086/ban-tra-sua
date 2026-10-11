# QC-05 — Actual 3D actor idle/walk animation improvement (11/10/2026)

**Owner feedback:** game still feels dull/ugly; owner passed the previously assigned M2 task and requested **actual runtime code development**, not repeated benchmark documentation. This is one narrow **character-quality slice** integrated on `codex/mobile-beta-foundation`, not a claim that M2 budget/device gate is accepted or that M3 is complete.

**Initial remote HEAD:** `84f17b813a544480424dac7f22be1120633babea`; [CI #38030218857](https://github.com/phung086/ban-tra-sua/actions/runs/38030218857) SUCCESS, [production benchmark #38030218870](https://github.com/phung086/ban-tra-sua/actions/runs/38030218870) SUCCESS on that exact baseline SHA. Main before change: `a4aeec3746a1fec7c9cf7222530280f6f820cc83`, never modified.

## Changed runtime behavior

`src/scene/models.ts` — `makePerson` stores lightweight, actor-local animation state (no new geometry, materials, textures or per-frame allocations). `pose` now eases idle↔walk over time instead of snapping all shoulders and knees; coordinates arms, stride and knee lift with the current gait phase; adds subtle body weight/breath and deterministic per-character head-look/blink timing; keeps seated legs and gesture/cup hand parenting; respects `motion=false` by returning head/body to neutral without animation. Preserves baseline forward lean for older characters.

`src/scene/actorGeometry.test.ts` — three new regression tests for walk/stop easing, seated/reduced-motion and per-character idle/gesture. Existing connected skinned-mesh integrity test remains.

**No fake performance claims:** no new renderer optimization or player input/save/quest changes. This does not replace a 3D animated clip and human aesthetic review. Runtime code committed before video/screenshot evidence is tagged **IMPLEMENTED_UNVERIFIED** until browser/real-device visual QA.

## Mandatory verification

`npm test`, `npm run build` and benchmark syntax/type validation via exact-SHA GitHub CI. If CI fails, diagnose and fix or revert code. Use 390×844 and 844×390 production near/far screenshots and 20–60s character moving/stopping/idle clip for actual visual evaluation; compare calls/triangles/P95 on light/balanced before/after; preserve 10/10 craft-delivery, NPC, wall/scooter and joystick. Real Android RAM3–4GB/iPhone frame interval, thermals and 15min data remain **not attached**, do not invent.

**Milestone M2 is still OPEN** and needs own LOD/streaming, mobile budgets and memory 10-zone-cycle gate. Owner passed an individual task and required code-first changes; do not silently mark M2 complete.

**Next single task:** QC-05 — visual inspection/capture of the new locomotion and idle slice, fix any clipping, bad pacing or heavy frame regressions before expanding models/VFX.
