# Hourly iteration — cup size and mixing feedback (2026-10-10 09:50 ICT)

## User-visible implementation
- The live tea cup now uses a distinct size L silhouette (56x84px versus 48x72px M).
- Changing the shake setting reveals up to four translucent mixing bubbles, with a short CSS transition keyed to the slider value.
- The accessible cup label includes size and shake percentage; reduced-motion disables bubble animation.
- No new WebGL meshes, external art assets, district, scene or save schema. Existing scoring and order flow unchanged.

## Evidence / scope gates
- Branch: codex/serve-feedback-coaching-20261010; PR #20 (draft).
- Tests: DrinkCup.test.tsx checks size M/L and mixing at zero/full/out-of-range; exact-head CI pending.
- Local npm ci/test/build and production screenshots at 360x800, 390x844, 844x390 and desktop: blocked because this runner cannot resolve github.com for clone; GitHub Actions CI is the available build verification.
- M1 previous Chromium software WebGL light overview: draw calls -51.90%, P95 interval -54.84% (run 37928850991). Not a new measurement. Android RAM 3-4GB and iPhone unverified; M1 not accepted and M2 locked.
- This is a validated-on-CI candidate once CI passes, not a released feature or playable day.

## Next
Review PR #20 UI in production screenshots, then prioritize more natural NPC idle/walk movement and richer interactive tea-making without heavy 3D.
