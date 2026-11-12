# Branch Notes: feat/four-in-a-row

## 1. Discoveries & Deviations
- Complete #19: authoritative drops, wins/draws, reconnect support, Table/Hand UI, catalog metadata and tests.
- Integrate latest origin/dev (bounded undo history); leave Yacht and other active PRs untouched.
- Verify 401 backend tests, 100% FourInARowGameService line/branch coverage, production frontend build, 8 component specs in a temporary JIT/JSDOM runner, and a real three-client SignalR match/restart/lobby flow.
- Generate and inspect PostgreSQL promotion SQL through EF tooling; no database changes applied.
- Independent adversarial review: fix invalid-player-count partial start, then pass re-review. Re-review after integration also catches score inflation on undo/replay; restore snapshot totals and cover the full lifecycle.

## 2. Blockers & Risks (4a)
- Chromium cannot start because this environment denies its Unix socket; cloud browser cannot reach local workspace. Full Karma/browser suite and responsive visual QA remain unverified. Temporary DOM runner passes all 8 game specs; its zero-test Karma attempt is not counted as verification.
- Remote CI/Sonar checks pending publication. Existing package/advisory and obsolete-API warnings remain tracked in #225.

## 3. Quick Wins (4b)
- Replace host-based role routing with IsScreen-based Table/Hand routing.
- Reject invalid player counts before RoomService changes state, rounds or scores; add regression tests.
- Restore score totals on undo while preserving live player objects, preventing win/replay inflation.
- Discard connection-bound undo history on reconnect; fresh moves remain undoable, avoiding stale turn IDs.

## 4. Deferred Items (4c)
- None identified.
