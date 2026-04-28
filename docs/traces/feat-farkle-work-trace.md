# Planned Work

- **TODO List**:
  - [x] Update `GameType` enum in `Room.cs`.
  - [x] Register `FarkleService` in `Program.cs`.
  - [x] Create `FarkleState.cs` models.
  - [x] Implement `FarkleService.cs` (logic, scoring, turns).
  - [x] Create `FarkleTableComponent` (shared tray, scoreboard).
  - [x] Create `FarkleHandComponent` (selection, actions).
  - [x] Register in `game.registry.ts`.
  - [x] Write unit tests for scoring logic.
  - [x] Implement thread-safe auto-advance logic.
  - [x] Update EF migrations for game seeding.

- **File List**:
  - `backend/BoardGameHub.Api/Models/Room.cs`
  - `backend/BoardGameHub.Api/Program.cs`
  - `backend/BoardGameHub.Api/Models/FarkleState.cs`
  - `backend/BoardGameHub.Api/Services/Games/FarkleService.cs`
  - `backend/BoardGameHub.Tests/Services/Games/FarkleServiceTests.cs`
  - `frontend/src/app/features/games/farkle/` (All files)
  - `frontend/src/app/features/games/game.registry.ts`
  - `backend/BoardGameHub.Api/Migrations/*UpdateFarkleStatus*`

- **Rationale**: Full implementation of Farkle with synced perspective views, standard scoring, and platform-compliant components.

# Completed Work

- **Summary**:
  - Implemented backend `FarkleService` with standard scoring (1s, 5s, 3+ of a kind, straights, pairs) and thread-safe turn management using `IServiceProvider` for scoped lock acquisition.
  - Created `FarkleState` models and updated `AppDbContext` to move Farkle from `Backlog` to `Testing` status.
  - Applied EF migration `UpdateFarkleStatus` to sync the database.
  - Developed a comprehensive unit test suite (`FarkleServiceTests.cs`) with 100% pass rate on scoring combinations.
  - Built `FarkleTableComponent` with a 3D-perspective dice tray, permanent scoring guide, and accessibility landmarks.
  - Built `FarkleHandComponent` with dice selection logic, expandable rules overlay, and full ARIA/keyboard support.
  - Ensured both components comply with the `GameShellInputs` platform contract.
  - Verified stability via multiple rounds of senior peer review and build checks.

# Issues and Out of Scope
- **House Rules**: Advanced scoring variations (e.g., 3-triplets, 4-of-a-kind + pair) were deferred in favor of standard rules for the initial release.
