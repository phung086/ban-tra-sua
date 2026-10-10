# Hourly gameplay iteration — 2026-10-10 20:53 ICT

## Player-visible gameplay delivered in code
- At brewing station "Rót và lắc", players can choose **Pha nhanh** (one tap, skips both timing gauges) or **Pha kỹ** (two manual timing gauges).
- Quick mix intentionally deviates 40 fill points and 60 shake points from the actual order target, so existing scoreDrink technique scoring deducts exactly **12 quality points**; no hidden score override, RNG, or invented ingredients.
- Choosing quick mix shows its predicted sealed score before commitment. The customer patience clock continues. Lower quality flows into the existing real revenue/tips/reputation settlement.
- Quick mix hides the timing gauges until the player explicitly chooses **Pha kỹ lại**; that reset clears technique progress and restores both timing challenges. Sealed cups remain locked.
- Responsive pink/cream choice card and minimum 48px tap target. No new asset, renderer loop or save migration.

## Tests and verification
- Added deterministic gameplay tests for score, revenue, patience and reset, and workbench SSR tests for visible controls.
- Added production-preview browser script and GitHub Actions workflow for 360x800, 390x844, 844x390 and 1280x800, recording before/after PNGs and layout geometry.
- CI and preview need confirmation on exact final SHA. Chromium emulation is **not** a physical phone test.
- No new rendering benchmark; this change is React/UI + existing gameplay rules. Prior M1 measurements are not repeated.
- **Status:** code implemented; validated only after exact-SHA CI; playable only after preview/tap-through; not released.
- M1 owner-confirmed accepted; real-device evidence was not independently audited in this run.
- Backlog T7-02 update was attempted but rejected by tool safety. Keep task in progress and retry in a future cycle.
- Next: inspect preview artifacts and correct any mobile layout issue, then character idle/walk and serving reactions with matched screenshots.
