# M2 — static instance transform correctness (2026-10-10)

User confirms completing and passing M1 physical/device checks. This is user-provided acceptance, not independently audited hardware evidence; no fabricated device metrics. Start M2 as a small, reversible correctness patch.

## Code
- Static InstancedMesh matrices are expressed in the batch root's local coordinates instead of world coordinates. Root and nested parent translation/rotation remain correct.
- Added Vitest regression that compares the pre-batch world matrices with post-batch instance world matrices.
- No new textures, geometry, city zones, GPU-heavy effects, or increased instance counts.

## Verification and next gate
- CI must run tests/typecheck/build on exact PR SHA; no claim about performance without benchmark.
- Production UI checks at 360x800, 390x844, 844x390 and desktop are still needed when changing visible scenes.
- Measure before/after with identical camera, scene, seed and viewport before accepting the rendering change; the patch is intended to fix correctness, not imply better FPS.
- Follow up with spatially bounded instance batches and per-zone culling, memory disposal after repeated transitions.
