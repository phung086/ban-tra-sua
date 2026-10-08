# M1.1c — light mobile rendering budget, pinned before/after verification

Date: 2026-10-08. Working branch: `codex/m1-benchmark-gate-isolated`. Reference source (pre-optimization for this branch): `79f596d714ea3ebdbcf85878ccdd9e3675d7b562`. Baseline sector size 16 is produced from its `src/scene/city.ts` sector-32 code with exactly one parameter change to 16.

## Evidence recovered from existing production benchmark

Completed upstream GitHub Actions run: https://github.com/phung086/ban-tra-sua/actions/runs/37729659109 (source SHA `f286a839a959dcad485cba6ccaa643189d3b1136`). This is a **headless Chromium SwiftShader** comparison, not a device benchmark.

| Overview 390×844 | Sector 16 light | Sector 32 light | Sector 16 balanced | Sector 32 balanced |
| --- | ---: | ---: | ---: | ---: |
| Draw calls mean | 4002.09 | 2984 | 4098 | 2984 |
| Triangles mean | 2,199,439.22 | 2,368,852 | 2,252,226 | 2,368,852 |
| Frame interval P50 (ms) | 1383.3 | 1383.2 | 1383.3 | 1400 |
| Frame interval P95 (ms) | 1433.3 | 2549.9 | 2533.2 | 2566.6 |
| CPU simulation P50/P95 (ms) | 0.4/0.4 | 0.4/0.4 | 0.4/0.5 | 0.3/0.4 |
| CPU render submission P50/P95 (ms) | 26.3/36.8 | 18.8/21.8 | 23.1/26.9 | 19.3/25.3 |
| WebGL memory geometries / textures | 1298 / 213 | 841 / 208 | 1307 / 213 | 854 / 215 |
| Scene skeletons | 68 | 68 | 68 | 68 |

Light overview sector16→32 reduced draw calls by **25.44%** (below 40%) and **increased P95 by 77.9%** (above +10%). The earlier script merely logged this failure but emitted exit code zero; thus upstream benchmark success does **not** imply acceptance. Frames >100ms comprised >95% of light samples on SwiftShader; absolute frame numbers are unsuitable as mobile FPS.

The old run recorded smoke success for joystick, camera, notebook, brew/deliver on all before/after viewports (360×800, 390×844, 844×390 and 1280×800). Archived screenshots available in run artifacts; visual pixel-level review has not been performed in this environment. Collision behavior is covered separately by `src/game/collision.test.ts`.

## Code changed on isolated branch

1. Reverted `mergeRigid(...,'city-static',32)` to sector **16** due measured P95 regression and increase in triangles.
2. Kept renderer shadows enabled for balanced/high. The low-end **light** preset skips real-time directional shadow-map passes to reduce renderer submission and GPU/software raster workload; scene contact/blob shadows remain. This is an intentional visual trade-off that must be checked in before/after screenshots and on real devices.
3. Pinned before build's `city.ts`, `batching.ts`, `threeRenderer.ts` to source `79f596d...` (city parameter changed to 16), then restored HEAD for optimized after build. This prevents newly introduced optimizations from silently contaminating the baseline.
4. Benchmark script verifies light/balanced renderer shadow-map state in both variants. Paired 390×844 follow/overview run 10s warm-up and 30s sample per mode, include P50/P95 simulation/render submission/frame, calls, triangles, skeletons, geometry/texture and heap if supported. Four viewports get production smoke and before/after image capture.
5. Fixed benchmark gate to fail on <40% light overview draw-call reduction or >10% P95 growth, plus missing comparable results and smoke failures; `m1-artifacts/gate.json` is the authoritative machine-readable result.

## Verification and limits

- `npm ci`, `npm test`, `npm run build` are executed by GitHub Actions CI for the final SHA. Do not substitute a parent-SHA CI result.
- New production Playwright benchmark CI must be **completed**, reviewed, and pass the explicit gate on its own SHA before claiming acceptance.
- CPU simulation and submission timings are **not** GPU time; `renderer.info.render.calls` includes refresh shadow passes where enabled. No breakdown into main/shadow calls is currently available. GPU time unsupported.
- Playwright uses Chromium with SwiftShader rather than an Android 3–4GB or physical iPhone. No physical multitouch, thermal or memory-soak evidence yet.
- This workspace cannot `git clone` GitHub because of DNS, so browser/device manipulation is delegated to Actions; screenshots were archived by the runner but not directly reviewed here.
- Reversion to sector16 preserves existing collision, movement, NPC data and brew/delivery logic unchanged. Browser smoke and CI remain necessary checks, not assumptions.

## Gate verdict

**M1.1c not accepted until the new workflow artifacts and exact SHA results are inspected; do not start M2.** Even if automated SwiftShader gate passes, physical device acceptance remains pending under `docs/production-roadmap.md`.

## Next targeted work if light gate still fails

Profile the remaining overview draw-call workload by shadow pass, material and scene region; optimize by static material-aware instancing and granular frustum culling while preserving collider and interaction objects. Repeat pinned-baseline comparisons on the identical viewport/camera. Never restore sector32 solely because it reduces calls; its old headless P95 regression is measured.
