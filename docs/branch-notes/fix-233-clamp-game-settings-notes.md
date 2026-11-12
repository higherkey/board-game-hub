# Branch notes: fix/233-clamp-game-settings

## Discoveries & Deviations
- `GameSettings.Clamp()` added; called in `RoomService.StartGame` and `UpdateSettings` (hub and admin paths).
- Verified: BoardSize 40000 now yields a 36-letter Babble grid.

## 4a Blockers & Risks
- None.

## 4b Quick Wins
- None.

## 4c Deferred Items
- Frontend settings inputs could mirror the new bounds (min/max) for UX; not required for safety.
