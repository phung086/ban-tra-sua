# Next step: M1.1q — verify production camera sweep

Read docs/production-roadmap.md, docs/iteration-protocol.md, docs/iterations/m1-01.md, docs/iterations/m1-01o.md and docs/iterations/m1-01p.md. Check the current remote SHA and its CI before editing.

The code commit 87d2f8bf699a56c54f5c3f0ff28c40f3a42b08ba adds pointer-driven left/right/center camera sweep screenshots and frame traces to the production benchmark. Inspect CI run 37838136089 and benchmark run 37838136175, both pending at handoff. Check benchmark results.json failures, cameraSweeps (expected 6), six images, gameplay assertions and overview/follow light/balanced P95, draw calls and triangles. Never infer success from a running workflow.

If the sweep or any existing gameplay test fails, diagnose, fix or revert and re-run. For successful runs compare same Chromium SwiftShader/390x844/DPR1/10s warm-up/30s sample before and after. Require overview light draw-call reduction >=40% and P95 increase <=10%. Screenshots at discrete poses do not establish continuous-motion pop-in safety; record that limit and improve coverage if needed.

Run npm tests/build or verify CI on the exact pushed SHA and document local limitations. Keep M1.1 BLOCKED until 15-minute Android RAM 3-4GB and iPhone FPS/P95, thermal, memory, two-finger and gameplay evidence. No M2, merge, deploy or other-branch changes.
