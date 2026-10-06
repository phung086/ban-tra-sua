# Order Service Flow v4 — Parallel ownership note

Branch: `feat/order-service-flow-v4-sync`
Base: latest `main` containing realtime craft/customer bonds v3.

## Scope owned by this branch

- `src/components/OrderExperience.tsx`
- `src/components/OrderRecallDrill.tsx`
- `src/styles-order-service.css`
- One narrow integration seam in `src/App.tsx`: replace the legacy order ticket with `<OrderExperience />`.

## Intentionally untouched

This branch does not modify:

- `src/game/engine.ts`
- `src/game/types.ts`
- `src/game/storage.ts`
- `src/game/content.ts`
- `src/game/feedback.ts`
- `src/components/CraftGauge.tsx`
- `src/styles-v3.css`
- progression, research, decor, relationships, economy, scoring, save migration, realtime pour/shake logic.

## UX delivered

1. Existing order ticket preserved inside the isolated component.
2. Live recipe readiness: base, size, topping, sugar, ice, fill, shake and seal.
3. Memory Mode hides the ticket without changing score or game state.
4. Coach Mode shows up to three mismatches without auto-correcting the drink.
5. Responsive mobile layout and reduced-motion support.
6. UI state is ephemeral React component state; no save-version impact.
7. Memory Drill quizzes 7 order details, scores recall separately, and reveals mistakes without changing gameplay score.\n8. Focus Practice can immediately re-quiz only the missed details, split into recipe vs technique recall.\n9. Quick Peek reveals the ticket for 3 seconds inside Memory Mode, tracks peek count, and marks true no-peek recall runs.\n10. Per-order Mastery keeps best full-recall and best no-peek scores in ephemeral component state only.\n11. Confidence Calibration lets the player mark how sure each remembered answer feels, then detects overconfidence vs accurate memory after grading.

## Merge guidance

Prefer the synced branch over the earlier `feat/order-service-flow-v4`, which was based on the pre-v3 main commit.

The integration is intentionally narrow so another gameplay branch can cherry-pick or manually port the two new files and the small App ticket replacement without touching game-domain code.
