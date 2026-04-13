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
- [x] Resolve SonarQube PR #121 Quality Gate Failures.
- [x] Perform Finalization Process (Parity Check, Commit, PR).

### File List
- `frontend/src/app/features/game-room/game-room.component.ts` (Modified)
- `frontend/src/app/features/game-room/game-room.component.html` (Modified)
- `frontend/src/app/features/game-room/game-room.component.spec.ts` (Modified)
- `frontend/src/app/features/game-room/components/room-entry/` (New)
- `frontend/src/app/features/game-room/components/room-header/` (New)
- `frontend/src/app/features/game-room/components/room-sidebar/` (New)
- `frontend/src/app/features/game-room/components/undo-toast/` (New)
- `frontend/src/app/features/game-room/services/game-room-state.service.ts` (New)
- `frontend/src/app/features/game-room/services/game-room-state.service.spec.ts` (New)
- `frontend/karma.conf.js` (Modified for coverage)
- `backend/BoardGameHub.Tests/` (Updated test safety)

### Rationale
- Decouple massive representation logic from `GameRoomComponent` to improve maintainability.
- Transition `GameRoomComponent` from a "God Object" into a clean layout orchestrator.
- Fix severe memory leaks identified during peer review caused by unmanaged RxJS subscriptions.
- Standardize null-safe access patterns in backend game service tests.

---

## 2. In Progress Work
- Work completed. Finalizing PR.

---

## 3. Completed Work

### Summary
- **UI Decoupling**: Extracted `RoomHeader`, `RoomSidebar`, and `RoomEntry` into standalone components.
- **Orchestration Decoupling**: Created `GameRoomStateService` to act as a proper state aggregator and facade, safely managing SignalR subscriptions using `takeUntilDestroyed()`.
- **Memory Leak Fix**: Removed rampant `.subscribe()` blocks from `GameRoomComponent`.
- **Test Integrity**: Audited and fixed all `CS86xx` warnings in the backend test suite. Updated frontend specs to 100% success (272 tests).
- **Quality Gate Remediation**: 
    - Resolved Reliability failure by awaiting async state updates.
    - Resolved Maintainability failures by removing empty lifecycle methods and unused imports.
    - **Coverage Fix**: Configured `lcovonly` reporter in `karma.conf.js` to fix the 0% coverage report failure on SonarCloud.
    - **Accessibility Fix**: Removed redundant `role="document"` from `RoomHeaderComponent.html` to resolve immediate semantic HTML warnings.

### Revised Rationale
- The "God Object" issue was resolved across the view, state management, and test suites. The addition of proper LCOV instrumentation ensures that future refactors will be correctly measured by the Quality Gate.

---

## 4. Issues and Out of Scope

- **4a) Potential Blockers**
  - [x] **0% Coverage on New Code**: Missing LCOV reporter in `karma.conf.js` was preventing SonarCloud from ingesting reporting data. (Resolved by adding `lcovonly`).

- **4b) Opportunities**
  - [x] **Native HTML <dialog>**: Accessibility warning on Room Header suggests using semantic `<dialog>`. Due to native API requirements (.showModal()), this was deferred to a dedicated sub-issue ##124 (linked to Parent #105).
  - [x] **Redundant Accessibility Roles**: Removed `role="document"` from Room Header for Sonar compliance. (Resolved).
