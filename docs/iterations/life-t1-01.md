# T1-01 — Deterministic random streams for life-sim events

Date: 2026-10-08. Branch: `codex/life-t1-01-seeded-rng`, derived from validated main SHA `feabcfa6bb859ce11a3f4b061e3956ac2e06f2b7`.

## Implementation
- `src/game/lifeSim/rng.ts`: explicit versioned seeded hash and Mulberry32 PRNG. Stream keys contain worldSeed + gameDay + subsystem channel + slot, so cosmetic traffic consumes a separate random stream from payer, weather and story beats.
- `src/game/lifeSim/rng.test.ts`: identical replay, day/slot differentiation, substream independence, input validation, weighted choice zero-weight exclusion.
- No changes to existing game state, saved data, Three.js scene, NPC pathfinding or gameplay. This is a pure foundational utility; **day planner, social events, health and Day 1 playable are NOT YET INTEGRATED**.

## Acceptance / safeguards
- `npm test` (Vitest + life design graph validator), `npm run build`: GitHub Actions on exact final head SHA; state pending until confirmed.
- Existing save v3 untouched. New PR may merge if CI and unit tests pass because no runtime scene changes; M1 perf gate stays blocked separately.
- No browser preview or real device FPS claim because runtime gameplay/render paths are unchanged.
- Next: T1-02 calendar + wake/sleep/day-plan persistence adapter, then T1-03 schema validator and T1-04 reducer. The next agent should read `docs/life-sim/README.md` first.

## Existing blockers
- M1 light overview 40% draw-call and +10% P95 acceptance **not yet achieved/confirmed on real devices**.
- Android 3–4GB, iPhone, physical animation/mesh, true open-city districts and 30 playable episodes remain pending, unrelated to this pure RNG utility.
