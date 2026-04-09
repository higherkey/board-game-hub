# fix/83-room-service-locking Work Trace

## 1) Planned Work
- **TODO List**:
    - [x] Move state mutations in `RoomService.StartGame` (#83) inside the `StateLock` block.
    - [x] Move `SaveState` call in `RoomService.SubmitAction` (#84) inside the `StateLock` block.
    - [x] Rename `SaveState` to `SaveStateLocked` and ensure it's thread-safe (expects lock).
    - [x] Audit `RoomService` for other "mutation-before-lock" patterns.
    - [x] Replace `Room.DirtyMembers` (#85) with `ConcurrentDictionary<string, byte>`.
    - [x] Update `GameStateManager.MarkDirty` and `GameTick` for #85.
    - [x] Verify `RequestUndo`, `SubmitUndoVote`, and `PerformUndo` use the lock.
    - [x] Update `IRoomService.cs` and `GameHub.cs` for async Undo support.
    - [x] Implement additional concurrency stress tests for `GameStateManager`.
    - [x] Implement additional serialization tests for `RoomService` (`StartGame`, `Undo`).
    - [x] Update `GEMINI.md` workflow baseline.
    - [x] Final Audit & Verification.
- **File List**:
    - `GEMINI.md`: Updated workflow baseline.
    - `backend/BoardGameHub.Api/Services/RoomService.cs`: Fixed locking in `StartGame`, `SubmitAction`, and Undo methods.
    - `backend/BoardGameHub.Api/Models/Room.cs`: Updated `DirtyMembers` to `ConcurrentDictionary`.
    - `backend/BoardGameHub.Api/Services/GameStateManager.cs`: Updated for thread-safe field tracking.
    - `backend/BoardGameHub.Api/Services/IRoomService.cs`: Migrated Undo methods to Task-returning.
    - `backend/BoardGameHub.Api/Hubs/GameHub.cs`: Added `await` for async room service calls.
    - `backend/BoardGameHub.Tests/Hubs/GameHubTests.cs`: Fixed mock signatures.
    - `backend/BoardGameHub.Tests/Services/Core/RoomServiceTests.cs`: Added concurrency/serialization tests.
    - `backend/BoardGameHub.Tests/Services/GameStateManagerTests.cs`: Added stress tests for `DirtyMembers`.
- **Rationale**: 
    - `RoomService.cs`: Resolves P0 race conditions where state is modified while other threads (like the 50ms pulse) might be reading it (Fix #83, #84).
    - `Room.cs` & `GameStateManager.cs`: Fixes thread-safety issues with field tracking to prevent crashes during concurrent updates (Fix #85).

## 2) In Progress Work
- None.

## 3) Completed Work
- **Locking Consolidation**: Moved all critical game state mutations in `RoomService` inside `StateLock` blocks.
- **Thread-Safe Field Tracking**: Replaced `HashSet` with `ConcurrentDictionary` for `Room.DirtyMembers`, eliminating race conditions in the high-frequency sync loop.
- **Async Undo Migration**: Refactored `RequestUndo` and `SubmitUndoVote` to be async, allowing for non-blocking `StateLock` acquisition and fixing gaps where mutations happened outside locks.
- **Robust Testing**: Added 4 new concurrency/stress tests to verify that these fixes hold up under high-load simultaneous access.
- **Workflow Baseline**: Hardened `GEMINI.md` to prevent future unauthorized commits by mandating-final audit reviews.
- **Verification**: Verified via `dotnet build` and success of 216/216 backend tests.

## 4) Issues and Out of Scope
- **4a) Potential Blockers**:
    - None.
- **4b) Opportunities**:
    - The `StateLock` pattern is robust but requires discipline. Consider a wrapper or decorator for `IGameService` methods to ensure locking is always handled at the `RoomService` entry point.
