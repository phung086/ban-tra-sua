# Stock rescue integration — 2026-10-10

Mounted the existing StockRescueHint in the live CraftWorkbench at every station. The panel lets players choose a stocked substitute when ingredients run out, with predicted recipe score. Added a guard against sealing via the D hotkey while stock is missing. Inventory and waiting-time consequences remain in the existing stockRescue logic.

Validation pending: npm ci/test/build, production mobile and desktop previews, interaction testing, and CI for exact head. Do not mark playable or released until verified. No renderer changes; previous M1 figures are not a new benchmark.

Follow-up: prevent sealing via button while stock is unavailable, add an end-to-end interaction test, and inspect narrow mobile layouts.
