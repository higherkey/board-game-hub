# Branch notes: fix/235-room-membership-identity

## Discoveries & Deviations
- No pre-existing test needed changes. `PlayerSessionRebindTests` and all other existing tests pass unmodified (guest ids are only namespaced at the hub layer; `RoomService` stores whatever it is given).
- New test files: `GameHubIdentityTests`, `RoomServiceMembershipTests`, `PlayerIdentityPersistenceTests`; one new spec case in `room-sidebar.component.spec.ts`.
- `RequestUndo` keeps its player lookup (it needs the player's name and host flag, and Table-screen players are already allowed); `IsRoomMember` is not added there because it would be redundant.
- `SubmitUndoVote`: zero eligible voters (no connected Hands) closes the vote as Failed for any room member; otherwise non-eligible voters (Tables, disconnected) are ignored.
- `Player.UserId` is `[JsonIgnore]`: undo snapshots only restore `Score`, and persistence uses `PersistedPlayer`, so nothing reads it back from JSON. Round trip verified by test.
- Hub group names use `Trim().ToUpperInvariant()`; `JoinRoom` stores `room.Code` in the connection map.

## 4a Blockers & Risks
- Clients that previously relied on `userId` in room payloads must use `isRegistered` (frontend updated).
- Existing persisted guest seats hold raw (un-prefixed) ids; they still reconnect via SessionId.

## 4b Quick Wins
- None.

## 4c Deferred Items
- Game-specific hub methods still forward `roomCode` as-is to `RoomService`, which uppercases but does not trim.
