# Iteration 2026-10-10 04:57 — Spoken delivery reactions

PR #20 follow-up: the delivery result now includes a short, authored Vietnamese customer line. Quality below 65 takes precedence over waiting; otherwise a restless/upset service mood produces a time-sensitive response. Eight existing shop customers have distinct voice lines and unknown/neighbor IDs use safe fallback. No RNG, game state or save mutation. The existing chibi portrait receives a subtle CSS-only greeting animation with reduced-motion override.

Files: src/game/customerDeliveryDialogue.ts, src/game/customerDeliveryDialogue.test.ts, src/components/ServeCelebration.tsx, src/App.tsx, src/styles-serve-feedback.css.

Validation: 6 focused Vitest cases added; full npm ci/test/build and CI exact SHA pending at commit time. Production preview at 360x800, 390x844, 844x390 and desktop pending (no browser runner attached to GitHub source in this execution). No physical Android/iPhone measurement. M1 performance gate remains unaccepted, M2 locked. No scene/mesh/material changes or asset licensing changes; do not claim FPS improvement.

Backlog: T1-03 still in_progress; T1-04 blocked by dependency; this is scoped independent gameplay/UI polish on existing PR. No new playable episode, no new district, no migration or release.

Next: confirm CI for final head SHA; inspect delivery card screenshots at all viewports and verify speech bubble does not obscure mobile controls; then improve real 3D idle/walk and NPC interaction after benchmark/device gates.
