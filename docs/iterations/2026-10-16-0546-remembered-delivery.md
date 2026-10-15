# Iteration 2026-10-16-0546 — remembered customer delivery

- Baseline main: `36153f6a8bf92c35e454d4fd7966a8935784655d`
- Owner: Codex gameplay adapter on existing draft PR #37; no Gemini branch changes.
- Feature: a customer who explicitly consented to remembering a preference reacts to an actual delivered tea. Wrong base/size/topping/sugar/ice or low score yields actionable feedback; quiet service preserves privacy. Feedback uses the pre-delivery draft, appends a save-v3 story/journal entry once, and grants no extra resources.
- Runtime: `src/game/service.ts` calls `withRememberedDeliveryReaction`; existing `CustomerScene` and `WorldChrome` show the greeting and delivery notice.
- Tests: `src/game/lifeSim/rememberedDelivery.test.ts` covers real delivery, privacy, mismatch, invalid delivery and save/reload. E2E script exercises four viewport sizes but **was not executed**.
- CI: push run 38819720653 and PR run 38819727816 succeeded at `a540e85c5d1d8d4ea348b7b1fb25b2407baf24f3` before this documentation commit.
- Browser 360x800 / 390x844 / 844x390 / desktop: PENDING (no local Playwright dependencies or reachable Git clone).
- Screenshot, console, joystick/camera/collision, full sleep/save/reload and Android/iPhone: PENDING.
- Main mobile orientation CI: FAIL at main `36153f6a`; must not merge/release.
- M1: not accepted; no 3D expansion. No device or performance evidence.
- Next: run production browser smoke and mobile regression, repair any failure, then verify PR CI at the final head SHA.
