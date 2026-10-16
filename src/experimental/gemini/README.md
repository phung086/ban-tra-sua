# Gemini prototypes recovered on 2026-10-16

Source: `faca800598b4b495767cd0f76bbd23950275b1a2`,
`gemini/day-transition-morning-wake-20261014-1130`.
That commit supplied an installer containing 42 text payloads, not an integrated game.
The 41 source/style/test files are extracted here and included in TypeScript and unit checks.
They are **not imported by the live app** and do not increase its runtime bundle.

Compatibility repairs: feedback uses the existing `game/feedback` API (`good`),
toppings use the actual keyed catalog, and `CanonicalNpcId` comes from its defining module.
Original payloads remain in Git history and the safe staging extractor at
`apply-gemini-slice.mjs`; it requires a separate destination and never patches actor poses.

Do not replace the live morning save, movement controller, or animation wholesale.
These prototypes use different NPC identifiers, state schemas and pose parameters.
Integrate one feature at a time with a migration into `GameState`, actual app wiring,
reload tests and browser evidence. The live equivalents currently remain in
`src/game/lifeSim/morning.ts`, `src/game/city*`, `src/components/MovementStick.tsx`,
`src/scene/models.ts`, and existing crafting/finance/decor systems.

The 42nd payload was an hourly workflow that runs an external AI and pushes code.
It remains archived in the extractor, outside `.github/workflows`; no new scheduled
automation was enabled by this merge.
