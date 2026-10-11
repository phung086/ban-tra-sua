# Hourly iteration — 2026-10-11 18:57 ICT — manual pour release cue

## Player-facing change
- The live pouring cup now highlights amber when close to target and green in the existing perfect-score tolerance window.
- The hold button also turns green and displays "ĐÚNG MỐC — THẢ TAY" while actively pouring in the correct window.
- Uses existing `pourVerdict` state through CSS `:has()`; no new 3D objects, assets, renderer work, RNG or save fields.
- A small Vitest regression checks the deterministic approaching/release/over-pour windows. The visual CSS is not yet browser-validated.

## Evidence and limitations
- Branch: `codex/pour-control-integration-20261011`, draft PR #25.
- Real production preview script added at `scripts/pour-production-preview.mjs` for 360x800, 390x844, 844x390, 1280x800. It captures actual before/after screenshots when run with Playwright and Vite preview.
- Browser preview CI workflow creation was blocked by connector safety checks. The script has not been executed on production build in this iteration; no screenshot or device result is claimed.
- CI results must be checked against final head SHA. No new renderer FPS/P95/draw-call/memory numbers.
- PR #24 changes the same brewing station and must be reconciled before merge. M1 physical Android/iPhone evidence is still missing.
- Not merged, not released. This is implemented UI code; browser playability remains unverified.

## Next
1. Run production preview with Playwright and inspect before/after screenshots; correct touch and landscape layout.
2. Reconcile PR #24 quick mix and stock rescue with manual pouring without losing either route.
3. Confirm exact-head CI and save/reload, then review PR #25 gates.
