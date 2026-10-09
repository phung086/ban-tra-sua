# Next step: M1.1r — verify settled camera sweep and follow regression

Read `docs/production-roadmap.md`, `docs/iteration-protocol.md`, `docs/iterations/m1-01.md`, `docs/iterations/m1-01q.md`, and this file. Check the latest remote SHA and CI before editing; preserve `main` and all other branches.

The M1.1q change makes pointer-driven camera sweeps wait for actual rendered follow-camera pose convergence and at least three fresh frames, with expected yaw assertions. It is a benchmark-only change; do not claim its correctness before checking the production workflow on its exact code SHA.

Inspect new CI and M1 benchmark status, job logs, `results.json`, six camera screenshots and cameraFocus/camera coordinates. Confirm every left/right/center pose converges for before and after, and review screenshots at the matched viewport. If any timeout or visual/collision regression occurs, fix or revert; keep failures visible.

Re-measure same Chromium SwiftShader, viewport 390×844, DPR1, light/balanced, 10s warm-up and 30s sample: require >=40% overview-light draw-call reduction and <=10% P95 interval increase, with NPC, joystick, camera, wall/vehicle collision and all craft/delivery smoke. Investigate follow-light P95 (+48.47%) and triangles (+33.46%) from prior run, and continuous-motion pop-in. Do not infer mobile FPS from SwiftShader.

Run tests/build and confirm CI green on the **exact remote SHA** after any commit. Keep M1.1 BLOCKED until 15-minute Android RAM 3–4GB and iPhone FPS/P95, thermal, memory, two-finger and gameplay checks, as well as roadmap absolute mobile budgets. No M2, merge or deploy.
