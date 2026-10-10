# Iteration — Live NPC counter dialogue (2026-10-10 12:56 Asia/Saigon)

## Goal and scope
Improve the *observable* feeling of a living tea shop. Eight existing NPCs now speak authored lines while waiting at the counter, grounded in their occupations and schedules. Their lines evolve from arrival to patience loss using the existing service clock and mood thresholds. Unknown NPCs have a readable fallback.

## Code and tests
- `src/game/customerWaitingDialogue.ts`: pure, deterministic lines by customer ID and service mood. No random rolls, new save fields, new timers, or asset imports.
- `src/components/CustomerQueueStatus.tsx`: replaces generic patience status text with the current customer's spoken line, reusing the existing visible queue panel; `aria-live="off"` prevents a screen reader announcement every second.
- `src/game/customerWaitingDialogue.test.ts`: 5 cases (authored schedules, escalation, moods, fallback, deterministic output).
- `src/components/CustomerQueueDialogue.test.tsx`: 3 cases (arrival, upset, no current order).
- `src/components/CustomerScene.tsx` remains unchanged: an attempted redundant dialogue insertion was blocked by connector safety checks; integration through the existing queue status panel succeeded instead.

## Gates / evidence
- Base `main`: `a4aeec3746a1fec7c9cf7222530280f6f820cc83`.
- PR #16: merged; PR #20: open draft, PR #21: open draft stacked on PR #20.
- Prior PR #21 HEAD `4795d753c8eb6af4ccf5392418c01502191db1db`: CI push run 38025972058 SUCCESS.
- New code HEAD before documentation: `9a3da6b94a908fbbd082924f42994a107bed8249`; exact final SHA CI is pending.
- Local `npm ci` / `npm test` / `npm run build`: **not run**. Local git clone blocked: DNS cannot resolve github.com. CI is the validation path.
- Production preview at 360x800, 390x844, 844x390, desktop: **not verified**. No before/after screenshots. No player playtest.
- M1 historical software WebGL benchmark: draw calls -51.90%, P95 -54.84%; physical Android 3–4GB/iPhone gates **not met**. No new render benchmark: this iteration changes only existing React text content.
- Backlog JSON update attempted but blocked by connector safety check. Do not mark accepted.
- Status: `planned` -> `implemented/pending CI`; not visually validated, not independently playable as a new episode, not released.

## Next
Verify CI on exact final SHA, run mobile production previews and screenshot comparisons on a runner with browser access, confirm dialogue doesn't crowd the landscape counter, then pursue chibi walking/idle proportions and interaction consequences. Do not merge #20/#21 without scope gates; do not unlock M2.
