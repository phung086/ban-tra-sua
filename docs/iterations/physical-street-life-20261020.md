# Physical street life — 20/10/2026

- Baseline main: `e1b3bda53dac08a0689dbbfd8fb9ff3cd01566fa`.
- Branch: `codex/physical-street-life-20261020`.
- PR: https://github.com/phung086/ban-tra-sua/pull/44
- Scope: physical interaction and motion of the existing 3D world, not an art-pack replacement.

## Runtime behavior

Vehicles accelerate and brake with rain-dependent stopping distance. Continuous oriented-body sweeps stop the full bus/scooter at static walls, other vehicles and pedestrians, including thin obstacles between frames. Spawn points at the road edges must be clear before recycling a vehicle. Late pedestrian crossings can produce an impact; vehicles stop at contact instead of passing through people.

The bus shelter and its navigation footprint are on the pavement. Tree rows formerly inside the main road are removed from both geometry and colliders. Residents use navigable paths, separate schedules/speeds and local avoidance rather than clock-based position assignment. A hit resident pauses in a seated reaction, then limps temporarily; these background NPC reactions are transient scene state.

Player impacts reduce energy and walking speed. Injury severity/expiry and the daily encounter choice are optional, hydrated fields in existing save v3. Free treatment requires leaving the carriageway, advances game time and reduces injury duration, including at zero cash/energy and at day end. Delivery deadlines continue to use the same game clock. A full night clears these short injuries without migrating or clearing saves.

Daily encounters are seeded from the saved world seed and day: a stalled scooter, marked crossing, or market unloading. Routes/stops differ accordingly. Help/pass is proximity checked and saved once per day; helping costs 8 minutes and 4 energy, adds 2 goodwill. Passing is free. A helped scooter can restart before its normal wait expires.

Imported Walk/Walk_Carry playback scales with actual displacement, freezes stride time when blocked, and crossfades without time warping. A nearby greeting no longer selects a frozen carrying walk. Player speed is 1.8 m/s on dry streets, 1.5 in rain and .9 when tired, halved while injured. Existing GLB character assets and licensing are retained.

Moving scooter wheels rotate with distance, brake lamps respond, and kickstands are retracted. Dynamic wheels/lamps remain outside static mesh merging. A broad phase rejects distant collider pairs before SAT. Notebook pause freezes street simulation. Fullscreen city height uses CSS dynamic viewport units so stale VisualViewport measurements cannot place controls below the screen during resize/rotation.

## Evidence and checks

At runtime commit `d19b5d1d900abeb8bf4ae7c6319331dc5d33d9f6`:
- Core CI success: https://github.com/phung086/ban-tra-sua/actions/runs/39460833457
- 637 Vitest tests in 125 files, 6 node acceptance tests, life design validator, TypeScript and production build passed.
- Lan browser PR regression success: https://github.com/phung086/ban-tra-sua/actions/runs/39460841842
- The physical browser reached real scene impact -> saved injury -> free treatment -> reload, real joystick Walk and exact pause on Three. It detected a stick below the viewport after resizing; this follow-up fixes fullscreen viewport height rather than accepting that failure.

Final exact-head core/browser results are tracked in PR #44. The dedicated workflow runs Three and Babylon with touch input, save/reload, pause and 360×800, 390×844, 844×390, 1280×800 screenshots. Evidence is uploaded as `physical-street-<SHA>`; fixture placement does not call the injury reducer directly. Regression workflows also cover the existing shop/morning flows.

No local execution environment was provided for this session; execution uses GitHub Actions. Software WebGL / touch emulation is not a physical Android/iPhone measurement.

## Limits / review

- Ground-plane collision with oriented bodies, not a full rigid-body/ragdoll engine.
- People keep the existing stylized 3D models; photorealistic models, additional animation clips and scooter riders are still separate art work.
- Town layout remains stable; encounters and walking schedules vary by seed/day.
- NPC injury timing is scene-local; player injury and encounter choices survive reload.
- No claim of physical-device FPS improvement, M1 acceptance, or production release. Review near/far visuals and measure the added physics/wheel draw cost on target devices before release.
- No other AI branch was changed. Shared integration points: App, StreetWorld, cityMap, collision, scene runtime/city/models/peopleAssets/scooter.
