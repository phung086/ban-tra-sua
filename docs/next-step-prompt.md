# Next step: M1.1d benchmark triage

M1 remains unaccepted. Run 37742095256 failed: four overview screenshot timeouts before sampling, city-return timeouts, and one delivery timeout. Follow light P95 rose from 1050 to 1650 ms in SwiftShader. Read docs/iterations/m1-01.md.

Start from the latest remote SHA on codex/mobile-beta-foundation and verify CI. Inspect the new benchmark artifact, compare production light/balanced before and after with identical viewport and browser. Verify calls reduction >=40% and overview P95 increase <=10%. Inspect screenshots and validate joystick, camera, NPC, collision, city return, crafting and delivery. If any gate fails, optimize or revert and rerun. Test/build/commit/push and confirm CI on the exact final SHA. Android and iPhone physical-device tests remain required. Do not merge, deploy, change other branches, or advance M2.
