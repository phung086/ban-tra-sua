# Quick-mix browser validation — 2026-10-10

## Concrete gameplay
Players can skip the two pour/shake timing challenges via **Pha nhanh**, at the cost of exactly 12 quality points through the existing technique score. The action does not reset customer patience, add inventory or change RNG. **Pha kỹ lại** clears the rushed technique and reopens both gauges. Quality affects real revenue/tip/combo settlement.

## Verification on code SHA
- Code SHA: `fc6e034f0571fb196b0cd6665955f6bcead1bdfe`
- CI run 38058440056: SUCCESS, npm ci, 172/172 tests in 35 files, typecheck/build.
- Production-preview run 38058440063: SUCCESS; Chromium headless software WebGL, **not** physical phones.
- Artifact: https://github.com/phung086/ban-tra-sua/actions/runs/38058440063/artifacts/11671903835 (eight component screenshots + report.json).
- Four viewport results:
  - 360x800: tap 52px, copy width 274px, no horizontal overflow, quick/careful toggles pass.
  - 390x844: tap 52px, copy width 304px, no horizontal overflow, quick/careful toggles pass.
  - 844x390: tap 52px, copy width 330px, no horizontal overflow, quick/careful toggles pass.
  - 1280x800: tap 52px, copy width 359px, no horizontal overflow, quick/careful toggles pass.
- Visual inspection: initial preview (run 38057819565) exposed a 46px target because the new CSS was in a stylesheet not imported by production. Loaded a dedicated stylesheet from main.tsx and reran. A subsequent screenshot revealed cramped text on desktop/landscape; stacked copy/action vertically and reran. Final screenshots are readable at phone portrait and desktop; 844x390 is scroll-constrained so the element screenshot is clipped vertically, but the actual button interaction passes.

## Acceptance
- Status: code + automated browser **validated**, not independently physical-device playable, not released.
- No renderer/asset changes: no new draw-call, FPS, memory or M1 benchmark claims.
- M1 owner-confirmed accepted; physical Android/iPhone evidence not independently audited here.
- Canonical backlog T7-02 write attempted but tool safety rejected. Task remains in progress; no false accepted status.
- PR #24 remains draft and stacked on PR #20; no merge without scope gates.
- Next: test actual touch interaction on hardware, then improve chibi walking/idle and serving response.
