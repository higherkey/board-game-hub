# fix/238-history-per-game

## Discoveries & Deviations
- Game history is now recorded in `RoomService` when a room transitions into `Finished` (`SubmitAction`, `CalculateRoundScores`, `EndGame`), after the room lock is released. `GameHub.EndRound` no longer records; `IGameHistoryService` stays injected for `GetGameHistory`.
- Final review: history is recorded after `MarkDirty`/`NotifyStatsChanged` (not before the broadcast) from a snapshot of the room (code, game type, players and scores) taken under the lock at the finishing transition.
- Known edge case: undo from Finished, then finishing again, records a second session.

## 4a Blockers & Risks
- This PR depends on #235's PR (`fix/235-room-membership-identity`) merging first; both edit `RoomService.SubmitAction` and `GameHub.EndRound`.

## 4b Quick Wins
- None.

## 4c Deferred Items
- Dedupe history on undo-then-refinish (e.g. a per-game session id on the room).
