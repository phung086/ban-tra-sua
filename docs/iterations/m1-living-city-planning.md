# M1 planning-only addendum — Living City game bible (08/10/2026)

## Source and scope

- **Start branch:** `codex/mobile-beta-foundation`
- **Source remote SHA verified before writing:** `5afb612f8fa180f718e093facb26df6a3dcaea4d`.
- **Previous exact-SHA CI:** [#37791154782](https://github.com/phung086/ban-tra-sua/actions/runs/37791154782) — `success`.
- **Benchmark M1 browser on code SHA 1d664a87:** [#37790199266](https://github.com/phung086/ban-tra-sua/actions/runs/37790199266) — **`in_progress` at initial check**. Its result and NPC/wall smoke must be reviewed separately before any M1.1 acceptance assertion.
- **Work type:** documentation only, long-horizon system/creative planning requested by project owner. **No runtime/benchmark/test scripts/assets intentionally modified.** No M1.1 behavior claim is derived from this doc iteration.

## Deliverables

- `docs/game-design/README.md`: product pillars, canonical daily-life loop, current-versus-target separation.
- `docs/game-design/life-systems.md`: calendar/routines/shop/customer needs, market and cooking, bills/price-model/money ledger, healthcare, friend group and transparent split bill, soft failures.
- `docs/game-design/story-and-days.md`: coherent 30-day chapter/story outline, NPC placeholders distinguished from existing cast, authored daily events with bounded deterministic variety, future day-pack model.
- `docs/game-design/world-and-performance.md`: zones, neighboring city/seaside, streaming/LOD/asset/collision/vehicle/NPC animation, mobile render budgets, real-device test matrix.
- `docs/game-design/data-and-save-contract.md`: typed condition/effect/beat/day contract, sample day JSON, seed & exactly-once ledger, save v3 compatibility and future v4 migration, validator/tests.
- `docs/game-design/ai-delivery-playbook.md`: dependency-ordered epics LC-00..LC-09, AI roles/nonoverlap, per-day acceptance, one-day-at-a-time loop, evidence and branch safety.
- Cross-references in `README.md`, `docs/production-roadmap.md`, `docs/iteration-protocol.md`, `docs/next-step-prompt.md`, **without changing active M1.1 prompt and gate**.

## Verification contract / limitations

Docs-only work does **not** demonstrate game functionality or performance gains. No valid before/after performance data can be attributed to these docs. Review markdown links/relative refs and content completeness; run `npm test` / `npm run build` if working checkout can be obtained, else report unavailable and rely on exact-SHA CI after push, without claiming local runs. Check no unintended files/branches touched.

M1.1 remains **NOT ACCEPTED** until same-config production benchmark, NPC/vehicle/wall/joystick/camera/craft-delivery integrity, acceptable regression, images and actual Android RAM 3–4GB and iPhone 15-minute multitouch/FPS/thermal evidence satisfy roadmap. No M2, merge or deploy.

## Next active task (unchanged)

The only active implementation prompt remains [`docs/next-step-prompt.md`](../next-step-prompt.md), **M1.1i**: inspect benchmark #37790199266 artifacts/logs, diagnose failures or regression, rerun before/after and complete gameplay smoke. Do not start day engine or LC feature work before the mandated gates.
