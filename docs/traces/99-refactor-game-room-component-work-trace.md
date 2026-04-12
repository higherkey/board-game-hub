# Work Trace - 99-refactor-game-room-component

## 1. Planned Work

### TODO List
- [x] Extract `RoomEntryComponent` logic and template.
- [x] Extract `RoomHeaderComponent` (Desktop/Mobile navigation and room info).
- [x] Extract `RoomSidebarComponent` (Player list, role switching, host controls).
- [x] Implement `UndoToastComponent` for voting overlays.
- [x] Move SignalR state subscriptions out of `GameRoomComponent` into a dedicated `GameRoomStateService`.
- [x] Simplify `GameRoomComponent` to serve solely as a high-level UI layout orchestrator, eliminating memory leaks.
- [x] Resolve backend test nullability warnings (`CS8600`, `CS8602`, `CS8625`).
- [ ] Perform Finalization Process (Parity Check, Commit, PR).

### File List
- `frontend/src/app/features/game-room/game-room.component.ts` (Modified)
- `frontend/src/app/features/game-room/game-room.component.html` (Modified)
- `frontend/src/app/features/game-room/game-room.component.spec.ts` (Modified)
- `frontend/src/app/features/game-room/components/room-entry/` (New)
- `frontend/src/app/features/game-room/components/room-header/` (New)
- `frontend/src/app/features/game-room/components/room-sidebar/` (New)
- `frontend/src/app/features/game-room/components/undo-toast/` (New)
- `frontend/src/app/features/game-room/services/game-room-state.service.ts` (New)
- `backend/BoardGameHub.Tests/` (Updated test safety)

### Rationale
- Decouple massive representation logic from `GameRoomComponent` to improve maintainability.
- Transition `GameRoomComponent` from a "God Object" into a clean layout orchestrator.
- Fix severe memory leaks identified during peer review caused by unmanaged RxJS subscriptions.
- Standardize null-safe access patterns in backend game service tests.

---

## 2. In Progress Work
- Finalizing commit and PR preparation.

---

## 3. Completed Work

### Summary
- **UI Decoupling**: Extracted `RoomHeader`, `RoomSidebar`, and `RoomEntry` into standalone components.
- **Orchestration Decoupling**: Created `GameRoomStateService` to act as a proper state aggregator and facade, safely managing SignalR subscriptions using `takeUntilDestroyed()`.
- **Memory Leak Fix**: Removed rampant `.subscribe()` blocks from `GameRoomComponent` that were duplicating upon lobby reentry. The component now securely binds strictly to the `GameRoomStateService` observables.
- **Test Integrity**: Audited and fixed all `CS86xx` warnings in the backend test suite encountered during build verification, and updated frontend specs to use `mockStateService`.
- **Merge & Sync**: Synchronized with `origin/dev`, resolving complex test-level merge conflicts.
- **Verified**: Confirmed all backend tests (216/216) and frontend tests (239/239) pass perfectly. Playwright is skipped due to environment constraints.

### Revised Rationale
- The "God Object" issue extended to the test suite and to memory management. By addressing the orchestration logic and null-casing globally, we have vastly improved the long-term integrity of the Board Game Hub lobby flow.

---

## 4. Issues and Out of Scope

- **4a) Potential Blockers**
  - [x] Karma tests hanging on `fakeAsync` + `ConfirmService`. (Resolved by proper mocking and lifecycle usage in the unit test).

- **4b) Opportunities**
  - [x] **State Service**: The orchestrator was still handling too many Service-to-Observable mappings. Moving these to a `GameRoomStateService` successfully allowed the component to focus solely on the view. This is now fully realized.
