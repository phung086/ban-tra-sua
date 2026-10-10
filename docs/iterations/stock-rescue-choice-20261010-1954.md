# Gameplay iteration — 2026-10-10 19:54 ICT

## Player-visible change
- Previously a depleted tea base forced the first unlocked stocked alternative.
- Now the brewing workbench presents up to three real stocked tea-base choices, each showing the tea name and predicted recipe score. Options are ordered by predicted quality with stable tie order.
- Selecting an option updates only the recipe. No ingredients are granted, inventory is not debited until delivery, and the original customer patience clock continues.
- If no base is available, the existing restock message remains. Single-option rescue still works for cups, toppings, sugar and ice.
- No new 3D assets, render-loop work or save schema changes.

## Code and validation
- src/game/stockRescue.ts; src/components/StockRescueHint.tsx
- Two deterministic gameplay tests and one SSR UI test added.
- CI/npm ci/test/build at exact PR head must be checked before validation; no performance or visual quality claim is made without preview.
- 360x800, 390x844, 844x390 and desktop production previews are outstanding; no screenshots captured this run.
- M1 acceptance remains owner-attested, not independently measured on physical devices in this run.
- Planned -> code implemented; automated validated only after exact-head CI; playable requires tap-through preview; released requires merge and main CI.
- Next: preview on mobile, test alternative buttons end-to-end, refine NPC delivery reaction and movement.
