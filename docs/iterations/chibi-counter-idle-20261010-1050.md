# Counter chibi idle + live patience face — 2026-10-10 10:50 ICT

## Change
- The active customer's portrait now receives the same patience-derived mood as the queue status. Waiting longer visibly changes the fallback mouth from cheerful to flat/frowning; delivered portraits also receive mood directly.
- Small CSS-only idle/breathing and blinking for the active counter portrait. All motion is disabled for prefers-reduced-motion and the in-game motion-off preference.
- No new 3D meshes, textures, imported assets, save fields, RNG or economy changes.

## Validation
- Four deterministic React server-render tests cover live impatient/fresh customer mood and mood propagation.
- npm ci / npm test / npm run build: await exact-head CI.
- Production preview 360x800, 390x844, 844x390, desktop: NOT RUN (local GitHub DNS unavailable).
- Screenshot comparison, physical Android/iPhone, and M1 acceptance: NOT VERIFIED.
- Episode playable: none. M2 blocked until M1 device gate.

## Next
Review PR #20 mobile visuals, collect screenshots and ensure queue/joystick unobstructed; then improve real-world character walk/idle only within measured render budget.
