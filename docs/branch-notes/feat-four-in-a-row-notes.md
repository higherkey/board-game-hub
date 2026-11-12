# Branch Notes: feat/four-in-a-row

## 1. Discoveries & Deviations
- Complete #19: authoritative drops, wins/draws, reconnect support, Table/Hand UI, catalog metadata and tests.
- Integrate origin/dev including bounded undo history and merged Yacht; retain its score restoration, untimed deadlines, TotalRounds support and snapshot reconnect rebinding. Resolve the overlapping score-restore hunk in favor of dev.
- Verify 456 backend tests, 100% FourInARowGameService line/branch coverage, production frontend build, 8 component specs in a temporary JIT/JSDOM runner, and a real three-client SignalR match/restart/lobby flow.
- Generate and inspect PostgreSQL promotion SQL through EF tooling; no database changes applied.
- Independent adversarial review: fix invalid-player-count partial start, then pass re-review. Integrated re-review passes; retain the merged Yacht snapshot-total/reconnect fixes and cover the Four in a Row lifecycle.

## 2. Blockers & Risks (4a)
- Chromium cannot start because this environment denies its Unix socket; cloud browser cannot reach local workspace. Full Karma/browser suite and responsive visual QA remain unverified. Temporary DOM runner passes all 8 game specs; its zero-test Karma attempt is not counted as verification.
- Remote CI/Sonar checks pending publication. Existing package/advisory and obsolete-API warnings remain tracked in #225.

## 3. Quick Wins (4b)
- Replace host-based role routing with IsScreen-based Table/Hand routing.
- Reject invalid player counts before RoomService changes state, rounds or scores; add regression tests.
- Retain shared score restoration on undo and cover win/replay inflation with Four in a Row regressions.
- Reuse shared snapshot reconnect rebinding to preserve undo history and current seat IDs; add win/reconnect/undo/replay regression.

## 4. Deferred Items (4c)
- None identified.
