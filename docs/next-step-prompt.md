# Next step: M1.1u — validate near-shop radius 48 against production benchmark

Read `docs/production-roadmap.md`, `docs/iteration-protocol.md`, `docs/iterations/m1-01.md`, `docs/iterations/m1-01s.md`, `docs/iterations/m1-01t.md`, and this file. Check latest remote SHA, branch and exact-SHA CI before editing; do not touch `main` or other AI branches.

The completed production benchmark [#37887123588](https://github.com/phung086/ban-tra-sua/actions/runs/37887123588) on source SHA `97def73` passed all 10/10 gameplay cases and 6 camera sweeps, with overview light draw calls −52.31% and P95 −55.94%, but follow triangles increased +21.83% light/+35.87% balanced and absolute budgets remain far off. M1.1t extended sector16 near-shop culling radius 35→48 **as an experiment**; no performance claim is valid until its new benchmark finishes.

Inspect CI and M1 production workflow on the new SHA. Check raw `results.json`, 40+ screenshots, six settled camera poses, matched 390×844 DPR1 Chromium SwiftShader before/after light/balanced (10s warm-up, 30s sample), all ten craft/delivery smoke cases, NPC, joystick, wall/scooter collision and 360×800 city returns. Compare follow triangles and calls against the prior completed run and require overview light calls down ≥40% with P95 interval increase ≤10%. If the experiment regresses, revert or retune and re-run, without weakening assertions. Explicitly distinguish SwiftShader from real-device performance and investigate continuous-motion pop-in.

Run tests/build and confirm CI green on the **final remote SHA**. Keep M1.1 BLOCKED until absolute mobile budgets and 15-minute Android 3–4GB + iPhone FPS/P95, thermal, RAM, two-finger and gameplay checks are satisfied. No M2, merge or deploy.
