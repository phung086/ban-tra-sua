# Iteration 2026-10-10 06:56 — chibi portrait fallback (PR #20)

## Scope and actual code
Continuing existing draft PR #20 on codex/serve-feedback-coaching-20261010. Customer portraits previously showed a single initial while lazy-loaded WebGL portraits were unavailable. Replaced the initial with a small CSS-only chibi illustration (hair, face, eyes, cheeks, shirt) using each NPC's authored hair/shirt/skin colors. Added a consistent soft frame to portraits, and mood-specific fallback face adjustments for delighted/upset reactions. All graphics are generated from local CSS; no external or unlicensed assets, new meshes or GPU textures.

Changed src/components/ChibiCustomer.tsx, src/main.tsx; created src/styles-chibi-fallback.css and src/components/ChibiPortraitFallback.test.tsx (3 SSR tests).

## Gates and evidence
- Source committed to PR #20; exact-head CI: pending.
- npm ci, npm test, npm run build: CI required, not run locally in this environment (no network clone/npm dependencies).
- Production preview/screenshots at 360x800, 390x844, 844x390, desktop: not available; visual quality is not yet independently validated.
- Existing M1 benchmark is historical Chromium software WebGL (draw-call reduction 51.90%, P95 change -54.84%). No render benchmark this iteration because CSS fallback does not change scene geometry/draw calls. No physical Android 3–4 GB/iPhone measurements; M1 not accepted, M2 locked.
- No playable new episode, no save-schema change, no merge.

## Follow-up
Validate exact-head CI, capture viewport screenshots and check portrait cropping/readability with/without WebGL. Then refine walk/idle and physical tea delivery feel in an isolated change; do not advance M2 without device gate.
