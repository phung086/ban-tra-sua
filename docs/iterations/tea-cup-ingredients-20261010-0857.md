# Iteration — Ingredient-aware tea cup, 2026-10-10 08:57 ICT

## Baseline and scope
- Main SHA: `a4aeec3746a1fec7c9cf7222530280f6f820cc83` (main CI run 37964739574 checked out this exact SHA and succeeded).
- Continued own draft PR #20, branch `codex/serve-feedback-coaching-20261010`, baseline branch head `34f3957825d727c2f6e9ce5126fa2687985dd944`.
- Change: the live tea cup now visually depicts the selected ice quantity (0–3 light CSS cubes) and topping (pearls, pudding, jelly, aloe, mochi or foam), and shows the topping name in the recipe readout. The liquid still responds to tea base and fill. This is direct player-facing feedback during mixing.
- New assets: none. New WebGL meshes/districts/render loop: none. Save schema, scores, prices, RNG: unchanged.
- Files: `src/components/DrinkCup.tsx`, `src/styles-tea-cup.css`, `src/components/TeaCupVisual.test.tsx`.
- Three Vitest assertions cover pearls, foam and ice levels. Existing DrinkCup tests also remain.

## Verification
- GitHub Actions: PR #20 CI run #461 (38015265728), queued when report prepared. Final head SHA must be verified again after this report commit.
- Local npm ci / npm test / npm run build: not executed; GitHub host cannot be resolved from current local runtime. Rely on CI when it completes, not unverified local claims.
- Production preview 360x800, 390x844, 844x390, 1280x800: not executed; no current before/after screenshots. Visual aesthetics and overlap NOT ACCEPTED.
- Android RAM 3–4 GB and iPhone: NOT TESTED.
- M1 separate run 37928850991: light overview software-WebGL draw calls 3178.83 -> 1529 (-51.90%), P95 4133.1 -> 1866.6ms (-54.84%). Absolute P95 remains unacceptable; no physical device acceptance, so M1 is not accepted and M2 remains blocked.
- No episode newly playable or released; PR remains draft, not merged.

## Next
1. Confirm CI on final PR head SHA; fix failures before new work.
2. Run production preview at four viewports and capture matching before/after shots when browser runner available.
3. Improve visible preparation feedback and chibi idle/walk quality after checking interaction overlap.
4. Keep T1-03 core validator in progress; do not mark T1-04 dependencies ready or invent acceptance.
