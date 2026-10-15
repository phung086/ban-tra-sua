# Iteration 2026-10-16 06:37 ICT — returning customer service memory

- Main baseline: `36153f6a8bf92c35e454d4fd7966a8935784655d`.
- Codex-owned branch: `codex/life-review-repair-20261015-0744`; draft PR #37. No changes to Gemini/other agent branches.
- Runtime: actual `deliverDrink` -> remembered NPC feedback -> saved `storyLog` -> next-day `CustomerScene` shows the previous service reaction for the same customer. Incorrect fill/shake now receives specific feedback even with a high overall score; minor deviations are tolerated. No additional rewards or recipe mutation.
- Changed gameplay: `src/game/lifeSim/rememberedDelivery.ts`, `src/components/CustomerScene.tsx`, `src/components/life/review-care.css`.
- Changed tests: `src/game/lifeSim/rememberedDelivery.test.ts`, `src/game/lifeSim/rememberedCustomer.ui.test.tsx`.
- Feature commit: `77b7f144c5df436f0136baf485b0f4ca3c65607a`.
- Exact-feature-SHA CI: push https://github.com/phung086/ban-tra-sua/actions/runs/38825059553 and PR https://github.com/phung086/ban-tra-sua/actions/runs/38825068107. Both SUCCESS: 139/139 tests, 29 test files, TypeScript/build passed.
- Save: v3 unchanged; regression checks service memory after reload and on later day. Full wake/sleep/browser journey remains unverified.
- Browser: 360x800, 390x844, 844x390, 1280x800, screenshots, console and physical Android/iPhone PENDING (no available Playwright runner in this run).
- Main: CI success at same main SHA; mobile orientation workflow FAILURE https://github.com/phung086/ban-tra-sua/actions/runs/38156257648.
- M1: not accepted; no heavy 3D/render changes. P95 and draw-call acceptance PENDING.
- Release: NOT merge-ready; PR remains draft. Next: run real browser smoke, fix mobile regression, test sleep/save/reload and controls on devices.
