# Iteration — 2026-10-19 09:40 Asia/Ho_Chi_Minh

Starting main SHA: `e1b3bda53dac08a0689dbbfd8fb9ff3cd01566fa`.
Branch: `codex/life-neighbor-ha-breakfast-20261019-0940`.
Scope: optional neighbor Hà meal when morning satiety < 60; help (12 min, 3 energy, +25 satiety, +1 goodwill) or chat (4 min, no money). NPC recalls yesterday. Choice idempotent in existing v3 story choice ledger and reloadable without migration.
Owner: codex isolated vertical slice (A02 needs / A07 UI / A08 QA adapter). No edits to Gemini or world renderer.
Runtime: `neighborHa.ts` + `NeighborHaPanel.tsx` integrated into `MorningRoutine.tsx` before the morning market.
Unit: `src/game/lifeSim/neighborHa.test.tsx` includes free fallback, time/energy, save/reload and next-day memory.
Browser: `scripts/neighbor-ha-browser-smoke.mjs` covers 360x800, 390x844, 844x390 and 1280x800 with screenshots/console; standalone until runner verified.
Acceptance: CI exact SHA PENDING; npm test/build PENDING; browser PENDING; physical Android/iPhone NOT TESTED; M1 gate NOT ACCEPTED.
Risk: MorningRoutine overlaps an open codex PR; do not merge until conflict resolution and complete regressions. No 3D assets or render changes.
Next: verify branch CI and browser, check PR #39 and all P0/P1 gates before merge.
