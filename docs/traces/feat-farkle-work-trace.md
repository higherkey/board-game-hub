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
  - [x] Implement high-fidelity 3D CSS dice (polished plastic, recessed pips).
  - [x] Add player seating indicators with avatar highlighting.
  - [x] Remove timer UI and logic from Farkle (set as NotApplicable).
  - [x] Implement "Edge-of-Table" POV perspective for Hand view (50% baseline).
  - [x] Create strategic roadmap for future 3D research (#137).

- **File List**:
  - `backend/BoardGameHub.Api/Models/Room.cs`
  - `backend/BoardGameHub.Api/Program.cs`
  - `backend/BoardGameHub.Api/Models/FarkleState.cs`
  - `backend/BoardGameHub.Api/Services/Games/FarkleService.cs`
  - `backend/BoardGameHub.Tests/Services/Games/FarkleServiceTests.cs`
  - `frontend/src/app/features/games/farkle/` (All files)
  - `frontend/src/app/features/games/game.registry.ts`
  - `frontend/src/app/features/game-room/components/host-settings/host-settings.component.html`

- **Rationale**: Full implementation of Farkle with synced 3D perspective views, standard scoring, and platform-compliant components. Refined for "Better CSS 3D" visuals (zero-gap, correct geometry) and immersive POV gameplay.

# Completed Work

- **Summary**:
  - **Core Logic**: Implemented `FarkleService` with full scoring rules (1s, 5s, combinations, straights) and thread-safe turn management.
  - **Visual Overhaul**: Developed "Better CSS 3D" dice with **polished plastic material**, **recessed pips**, and **corrected geometry** (Opposite sides = 7).
  - **Perspective & POV**: Created an immersive "Edge-of-Table" POV for the Hand view with a **50% screen baseline**, extending the table surface past the top of the screen.
  - **Spatial Shared Screen**: Updated the Table view with a structured 3x2 dice tray and spatial "Player Seats" with active highlighting.
  - **UX/Cleanup**: Removed the timer for Farkle, fixed scoring aid contrast (white-on-navy), and implemented scrollable rules containers for mobile.
  - **Quality Assurance**: 15 backend tests and 11 frontend tests (FarkleTable/FarkleHand) passing 100%.

# Issues and Out of Scope

- **4a) Potential Blockers**:
  - *None discovered*. All identified visual and logic issues were resolved during refinement.

- **4b) Opportunities / Sub-Issues**:
  - **Three.js Research (#137)**: Research high-fidelity WebGL/Three.js rendering for future physics-based rolling. (Deferred to Milestone 4).
  - **AFK Timer**: Implementation of a global AFK timer for non-timed games. (Backlog).
  - **House Rules Config**: Allow host to toggle specific scoring variants (e.g., "Must roll 500 to get on the board"). (Backlog).
