# M1.1ae — QI-05 ABBA artifacts and Vitest CI integration (10/10/2026)

## Preflight
- Target: `codex/mobile-beta-foundation`, remote HEAD before edit `1b98d070abc0524f131e481769275bc13e2ee6fd`.
- Existing CI #38012323460 **failure** on exactly this SHA: gameplay test step failed after Vitest collected `scripts/m1-ab-statistics.test.mjs` using `node:test`. Later steps skipped; no full build on that SHA.
- Controlled A/B runs on same SHA: radius #38012323482 **success**, near-sector #38012323511 **success**.
- `main` remains `a4aeec3746a1fec7c9cf7222530280f6f820cc83`; no main/other branch writes.

## Task QI-05 evidence read directly from GitHub artifacts
Both archives contain exactly 16 PNGs at 390×844 and `results.json` with 16 records, 8 ordered variant runs, 4 paired comparisons, 0 failures. Source SHA matches `1b98d070abc0524f131e481769275bc13e2ee6fd`; 10s warmup, 30s sample, Chromium SwiftShader, DPR1, light/balanced, follow/overview. PNGs were opened/decoded and checked for dimensions and non-blank pixels. Follow frames for A/B happen to be pixel-identical in this fixture; overview A/B pixel differences are very small; this does **not** prove moving-camera quality, pop-in absence, or gameplay.

### Medians, candidate relative to control (two matched pairs per quality/mode)
| A/B | Quality / view | Calls | Triangles | P95 | P95 paired range |
| --- | --- | ---: | ---: | ---: | ---: |
| radius35 vs radius42 | light / follow | +1.86% | +13.65% | −4.60% | −38.46..+29.27% |
| radius35 vs radius42 | light / overview | **−6.37%** | +6.47% | −19.73% | −45.18..+5.73% |
| radius35 vs radius42 | balanced / follow | +0.60% | +11.56% | +7.49% | +1.95..+13.03% |
| radius35 vs radius42 | balanced / overview | −6.67% | +4.73% | −4.32% | −8.64..0.00% |
| near12 vs near16 (radius35) | light / follow | −1.65% | **−8.04%** | −0.93% | −3.88..+2.01% |
| near12 vs near16 (radius35) | light / overview | +2.14% | −0.08% | −0.79% | −1.58..0.00% |
| near12 vs near16 (radius35) | balanced / follow | −1.60% | −7.60% | −4.74% | −5.66..−3.81% |
| near12 vs near16 (radius35) | balanced / overview | +5.29% | +2.84% | −1.74% | −3.83..+0.35% |

**Interpretation:** radius35 reduces overview calls but increases follow triangles; near12 improves follow triangles but increases overview calls. Radius light P95 pairs disagree sharply, and samples contain only ~23–79 frames/30s. Do not select a new geometry variant based on one median or equate SwiftShader with phone GPU. Keep runtime geometry unchanged this iteration.

## Concrete code correction
- `scripts/m1-ab-statistics.test.mjs`: import `test` from `vitest` instead of `node:test`, retaining all 7 assertions.
- CI and both A/B workflows: run dedicated test with `npx vitest run scripts/m1-ab-statistics.test.mjs`, consistent with `npm test` and package dependencies.
- `docs/next-step-prompt.md`: hand off a single QI-03 next task after QI-05.
- No game scene/asset/physics/gameplay/save changes. No performance or visual improvement claimed.

## Verification and blockers
- Prior 7 Node test assertions passed before migration; this iteration relies on **new exact-SHA CI** to verify Vitest and full `npm test`/build. No local full checkout due to DNS failure for github.com; do not claim local build.
- New A/B workflows on CI-fix commit may rerun because workflow paths change; if pending, report pending.
- Old production benchmark #37928850991 was on SHA `1124fa3`, not a new QI-05 gameplay measurement.
- M1.1 **NOT ACCEPTED**: absolute mobile budgets unproven; no Android 3–4GB/iPhone 15-minute real-device FPS/P95/memory/thermal/two-finger evidence.
- Next one task: **QI-03** full production before/after + moving-camera/gameplay smoke, fix/revert only after valid evidence. No M2/merge/deploy.
