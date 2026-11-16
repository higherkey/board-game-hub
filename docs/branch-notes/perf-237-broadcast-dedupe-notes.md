# perf/237-broadcast-dedupe notes

## Discoveries & Deviations
- `MarkDirty` now writes member, then sets `_dirtyRooms`, then writes the channel; `ProcessRoomUpdateAsync` returns early when the flag was already consumed. A pass with the flag set but no members still does a full diff. `TrackRoom` ("ALL") still forces a baseline.
- Three duplicated `RoomSnapshot` initializers replaced by `BuildSnapshot(Room)`.
- Reflection fallback removed after checking every production MarkDirty caller: only Players remains a named member and is in the accessor map; every other call requests ALL. Unknown members are skipped with a Debug log.
- Removed unused `BabbleService` / `DeepfakeGameService` concrete DI registrations (grep: nothing resolves them from DI; tests construct them with `new`).
- Existing test `..._WhenNoBaselineSnapshot_OnPartialDiff` seeded `DirtyMembers` directly without the flag; it now calls `MarkDirty`.
- Refresh onto origin/dev f289a45, including #249 settings/auth bounds and #251 membership/identity guards; preserve the under-lock membership recheck in SubmitAction.
- `SubmitAction` uses one full `MarkDirty(room.Code)` because game actions may change any Room field (including `RoundEndTime`, `RoundNumber`, and state). A failed pass invalidates its potentially unsent cached baseline and re-flags `ALL`; retry cannot suppress an unsent full or partial patch. The channel consumer makes at most three attempts per notification, waiting 100ms between recoverable failures; it uses no new dirty marks/revisions or detached tasks. Cancellation propagates, untracked rooms stop retrying, and exhausted rooms retain dirty state until another external notification.

## 4a Blockers & Risks
- Fresh adversarial review and scoped retry re-review pass with no remaining actionable findings; combined real SignalR verification remains with the parent batch. This branch targets a draft PR into dev and stops for review; no merge/deploy.
- Windows test runner requires generated, ignored runtimeconfig option MSTest.EnableParentProcessQuery=false; no project/runtime config change committed.

## 4b Quick Wins
- Deterministic identical five-mark measurement against origin/dev: broadcast calls 2 -> 1; persistence saves 5 -> 1; persistence serialization 5 -> 1; GameData serialization reads 5 -> 1. Counts only; no latency/allocation claim.
- Add full/partial failed-send retry, serialization failure with a concurrent later mark, and mark-during-send regressions without sleeps. Hosted-loop tests prove automatic retry without another mark, a three-attempt persistent-failure budget with healthy-room progress, and clean shutdown during a send.
- Real game-service action regressions assert Pictophone timer reset and explicit null at Reveal, Universal Translator PICK_WORD Day timer, and exact RoundEndTime/RoundNumber values.
- Build passes with zero warnings/errors; focused tests 82/82 and complete backend suite 570/570 pass (zero skipped).

## 4c Deferred Items
- Undo/history capture behavior stays unchanged; issue #238 owns history write reduction and any future successful-action history hook, including rejection semantics.
- Parent will run combined real three-client FourInARow SignalR and Pictophone/Universal Translator timer verification after branch commits. Unit game-service regressions do not establish browser/physical-device correctness.
