# Next step: M1.1n — reproduce follow-culling regression

Read roadmap, iteration protocol, and [M1.1m benchmark](iterations/m1-01m.md). Check remote SHA and CI before edits. On d2e7f6a, overview light passed relative gate (-58.07% calls, -52.90% P95); follow triangles increased +41.42% light/+42.46% balanced and follow P95 increased +10.87%/+51.35%.

Try controlled sector24 or finer near-camera batching, measure before/after production Chromium 390x844 DPR1 light/balanced, inspect moving-camera images/pop-in. Keep overview light calls reduction >=40% and P95 <=+10%; otherwise optimize or revert. Preserve joystick/camera, NPC, wall/vehicle collision, city return and 10/10 craft/delivery. Run tests/build and verify CI/benchmark on exact pushed SHA. Code writes were blocked this turn; do not claim unpushed work.

M1.1 NOT ACCEPTED: real Android 3-4GB and iPhone 15-minute FPS/P95, multitouch, memory and thermal tests missing. No M2/merge/deploy.
