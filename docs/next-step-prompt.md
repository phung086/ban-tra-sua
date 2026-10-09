# Next step: M1.1z — verify radius35 vs radius42 A/B

Read docs/production-roadmap.md, docs/iteration-protocol.md, docs/iterations/m1-01.md, docs/iterations/m1-01y.md and this file. Verify newest remote SHA, branch and exact-SHA CI before edits; leave main and other AI branches unchanged.

Controlled near12-vs16 A/B #37915935639 on SHA 1af1736 succeeded: near12 reduced follow triangles by 9.32% light and 6.85% balanced, with follow P95 -6.90% light and +0.01% balanced. Light overview calls rose 2.70%. Eight matched images were inspected, but these are single-run SwiftShader measurements, not mobile FPS.

New workflow .github/workflows/m1-radius-ab.yml compares near radius35 vs42, keeping near sector12 and distant sector32 fixed. Inspect CI, the new radius A/B, and near-sector A/B on exact SHA; download artifacts and verify eight 390x844 PNG, eight rows, no failures, P95, draw calls, triangles and frame counts. If radius42 regresses, retune or revert with evidence. If scene code changes, run tests/build and full production benchmark (overview-light >=40% fewer calls, P95 increase <=10%, all gameplay smoke, images and camera sweeps), commit/push and confirm CI on final SHA.

M1.1 stays blocked by absolute mobile budgets and 15-minute Android RAM 3-4GB and iPhone real-device tests (FPS/P95, memory, thermal, two-finger, NPC/collision/joystick/camera/craft/delivery). No M2, merge or deploy.
