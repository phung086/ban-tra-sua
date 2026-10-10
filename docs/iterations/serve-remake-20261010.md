# Hourly gameplay iteration — 2026-10-10 15:59 ICT

## Product change
- Player must commit the recipe when sealing a cup; sealed cups cannot be edited without consequences.
- A new in-game option beside the craft workbench lets the player discard the sealed cup and restart the order.
- Remake consumes actual ingredients and cup, increases daily cost/waste and lifetime waste, but keeps the order active and the real customer patience clock running.
- UI displays estimated recipe score, cost in VND and the decision; 48px minimum tap target and visible focus ring.
- No new 3D assets, render loops, save fields, or RNG.

## Branch and validation
- Based on PR #20 head 64ef3932c350bc5ed3232619bb31b394226888f7, separate branch codex/serve-remake-consequences-20261010.
- New regression case in src/game/service.test.ts checks waste/cost and sealed recipe lock.
- Run npm ci, npm test, npm run build via CI at exact final SHA; screenshots at 360x800, 390x844, 844x390 and desktop remain required.
- GitHub PR creation and backlog write were rejected by connector safety checks. Do not merge the branch or call the change playable until PR and preview gates are met.
- M1: user attested physical testing passed; not independently audited in this iteration. Previous CI software-WebGL benchmark is not a device result.
- Next: verify CI and production preview; review lock/unlock UX, mobile layout and low-stock softlock; then iterate on service consequences.
