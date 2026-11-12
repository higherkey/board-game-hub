# Branch Notes: perf/113-bounded-undo-history

## 1. Discoveries & Deviations
- Resolve #113 from origin/dev using a ten-slot UndoHistory ring; RoomService no longer rebuilds a Stack after each overflow. Push/eviction/Pop are O(1), with newest-first enumeration and released references on Pop/Clear.
- Persistence contract: StateHistory remains JsonIgnore and absent from RoomStateEnvelope; rehydrated histories remain empty.
- Active branch audit: no #113/undo-history commits; Yacht changes only unrelated Room settings/enum and RoomService timer sections, while render-port/dependency branches do not overlap undo behavior.
- Automated verification: /tmp/review-dotnet/dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj --no-restore: 375 passed, zero failed/skipped; focused regressions 4/4. Confirm RED first (35 retained snapshots vs expected 10). No manual verification required.
- Build: dotnet build backend/BoardGameHub.sln --no-restore -m:1 passes; API project build passes without warnings. Adversarial review passes with no actionable defects.
- Release microbenchmark, one million overflow pushes after warmup: Stack rebuild 329.21ms / 688,000,040 allocated bytes; ring 2.83ms / 40 bytes (Stopwatch), excluding JSON serialization. Timing is indicative; allocation reduction is deterministic.

## 2. Blockers & Risks (4a)
- No implementation blockers. Existing dependency warning NU1903 (SignalR.Common), obsolete Npgsql TrustServerCertificate warnings, and xUnit1031 are unchanged.
- Default parallel solution build exits with no error diagnostics in this environment; single-worker solution build passes.
- Remote Sonar/CI verification belongs to the publishing gate; local runtime tests pass.

## 3. Quick Wins (4b)
- Included overflow/wraparound/newest-first/empty-Pop/undo-then-push/Clear regressions, real SubmitAction/RequestUndo round restoration, and snapshot/persistence exclusion checks.

## 4. Deferred Items (4c)
- None.
