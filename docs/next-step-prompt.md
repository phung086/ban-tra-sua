# Next step: M1.1aa — verify radius35 full production gameplay

Read docs/production-roadmap.md, docs/iteration-protocol.md, docs/iterations/m1-01.md, docs/iterations/m1-01z.md and this file. Check newest remote SHA, exact-SHA CI and branch state before edits. Preserve main and other branches.

Same-SHA A/B #37922144148 showed radius42 vs35: follow triangles -9.10% light/-11.45% balanced, overview light calls +6.80%, P95 +94.65%. A/B #37922144131 showed near12 vs16 overview light P95 +89.38%, and a follow-light screenshot had different player orientation. Both are noisy single-run SwiftShader data, not real-device FPS. The branch provisionally changes radius42 to radius35, keeping near sector12 and distant sector32, and updates both A/B workflows.

First verify new exact-SHA CI, full M1 production benchmark and both A/B workflows. Inspect results.json, matched screenshots, six camera poses, motion sweep, NPC dialogue, joystick, wall/scooter collision, return-to-shop and all ten craft/delivery cases. Require overview light calls decrease >=40%, P95 interval increase <=10%, no failures and valid screenshots. If regression or workflow failure occurs, diagnose and fix/revert; do not weaken assertions or claim mobile FPS from software renderer.

M1.1 remains BLOCKED until absolute budgets and physical Android RAM 3-4GB and iPhone 15-minute FPS/P95, memory, thermal, two-finger and gameplay checks. No M2, merge or deploy.
