# Stock rescue seal/pickup — 2026-10-10 18:52 ICT

## Visible gameplay change
- The brewing workbench now disables mouse/touch sealing when ingredients for the selected drink are missing, matching the existing D-key guard.
- Pickup stays disabled until the rescued drink is sealed and ingredients are available.
- A visible status message directs the player to choose "Cứu đơn" or restock.
- Engine updateDraft now rejects a seal request for a depleted recipe, so alternative call paths cannot bypass the UI.
- The same queued customer, inventory and patience clock are retained; no new RNG, timer, asset or 3D draw calls.

## Evidence
- Added SSR workbench tests for shortage, rescue and seal/pickup recovery, plus a direct engine boundary test.
- CI SUCCESS at f6698ec771b0ac177142671499625687df4351eb: https://github.com/phung086/ban-tra-sua/actions/runs/38050072645 (npm ci, npm test, typecheck/build).
- Production preview 360x800, 390x844, 844x390 and desktop: NOT RUN; no before/after screenshots. Do not call playable/released.
- M1: owner attested acceptance; physical-device evidence not independently audited. M2 branch separate.
- Blocker: production screenshot automation tool write rejected; local git cannot resolve github.com. Keep PR draft.

## Next
- Run production Playwright preview on the exact PR head at four viewports and manually test the stock rescue tap flow; fix any layout/collision issue.
- Once scope gates pass, review stacked PR #20 -> #24 before merging; confirm main CI at merged SHA.
