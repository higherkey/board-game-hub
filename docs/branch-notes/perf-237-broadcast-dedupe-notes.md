# perf/237-broadcast-dedupe notes

## Discoveries & Deviations
- `MarkDirty` now writes member, then sets `_dirtyRooms`, then writes the channel; `ProcessRoomUpdateAsync` returns early when the flag was already consumed. A pass with the flag set but no members still does a full diff. `TrackRoom` ("ALL") still forces a baseline.
- Three duplicated `RoomSnapshot` initializers replaced by `BuildSnapshot(Room)`.
- Reflection fallback removed. Member names passed to `MarkDirty` in `backend/BoardGameHub.Api` (all in `_propertyAccessors`): `Players`, `GameData`, `RoundScores`, `PlayerAnswers`, `State` (via `nameof(Room.State)`); every other call passes no member ("ALL"). Unknown members are skipped with a Debug log.
- Removed unused `BabbleService` / `DeepfakeGameService` concrete DI registrations (grep: nothing resolves them from DI; tests construct them with `new`).
- Existing test `..._WhenNoBaselineSnapshot_OnPartialDiff` seeded `DirtyMembers` directly without the flag; it now calls `MarkDirty`.
- Test count 467 -> 469 (two new tests).

## 4a Blockers & Risks
- None.

## 4b Quick Wins
- None.

## 4c Deferred Items
- Playwright `four-in-a-row-realtime.spec.ts` not run: `frontend/playwright.config.ts` has `webServer` commented out, so it needs manually started backend and frontend servers.
