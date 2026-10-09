# Iteration — Serve feedback coaching (2026-10-10)

## User-visible change
After a drink is served, the existing result notice includes one actionable Vietnamese preparation tip. The deterministic coach compares the actual draft to the customer's requested tea, topping, size, sugar, ice, fill, shake, and seal. It selects the largest lost scoring component, without altering score, payments, saves, RNG or rendering.

## Safety and test gates
- Five Vitest cases added in src/game/drinkFeedback.test.ts.
- Gameplay surface: serveCurrentDrink notice only; no scene/asset changes.
- npm ci / npm test / npm run build: pending CI verification.
- Preview (360x800, 390x844, 844x390, desktop): not yet verified.
- Physical Android/iPhone: not tested. M1 remains unaccepted; no M2.
- This is a small gameplay polish change, not a new playable episode.

## Next
Validate CI for exact head SHA, review mobile notice readability, address feedback timing, then iterate on visual character polish without changing restricted AI branches.
