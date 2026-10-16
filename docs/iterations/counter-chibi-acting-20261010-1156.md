# Counter chibi acting — 2026-10-10 11:56 Asia/Ho_Chi_Minh

## Scope and observable improvement
Continuation of stacked PR #21 (base PR #20). The existing lightweight chibi fallback portrait now has two arms, two shoes and eyebrows in each NPC's own palette. At the active tea counter, the customer can wave when relaxed, tap a foot when impatient, and visibly enter the frame for each new order. The arrival transition is keyed to the current order ID; there are no extra JS timers, scene meshes, textures, sound assets or changes to saved state.

## Verification and limitations
- Added two SSR tests for full silhouette and customer palette; prior waiting/mood tests remain.
- CI on exact PR head: pending at time of writing.
- Local npm ci/test/build: blocked because this environment cannot resolve github.com to clone the repository. CI is the validation path.
- Production preview and screenshots at 360x800, 390x844, 844x390 and desktop: not yet captured.
- Physical Android 3–4GB and iPhone: not tested.
- No before/after renderer measurement is claimed; this change is DOM/CSS only.
- Reduced-motion via media query and root data-motion=off disables new motion.
- This is UI acting, not a full-body 3D rig/walking clip and not a playable day.

## Follow-up
Validate exact-head CI, inspect mobile portrait and joystick overlap, and only then consider merging stacked PRs. Next iteration should prioritize actual world-character motion or an interaction with meaningful consequences, without bypassing M1 device gate.
