# Next step: M1.1o — verify near-shop culling

Read docs/production-roadmap.md, docs/iteration-protocol.md, docs/iterations/m1-01m.md and docs/iterations/m1-01n.md. Check remote SHA and CI first.

Code SHA ff2b811e2c6381f1023e164c09d1d9e071eb1900 adds near-shop sector16 batching within radius35 to sector32. CI #37829826681 passed. Benchmark #37829826752 was in progress at handoff. Inspect completed workflow, results.json, 34 images and gameplay logs before making any performance claims.

Compare same-run production Chromium SwiftShader 390x844 DPR1, light/balanced, warm-up 10s, sample 30s. Gate: overview light draw calls decrease >=40%, interval P95 increase <=10%. Inspect follow triangles/P95 and moving-camera culling, joystick/camera, wall/scooter collision, NPC and craft/delivery. If regressions occur, optimize or revert and remeasure. Add moving-camera screenshot/trace smoke after evaluating this run.

Run tests/build and verify CI green on exact pushed SHA; document local execution limits. M1.1 NOT ACCEPTED without 15-minute Android 3-4GB and iPhone FPS/P95, thermal, memory and multitouch evidence. No M2, merge or deploy. Preserve main and other AI branches.
