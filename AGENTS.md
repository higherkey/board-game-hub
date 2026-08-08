# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository overview
- Monorepo with:
  - `frontend/`: Angular app (standalone components) for gameplay UI, lobby/social/admin pages, and SignalR/WebRTC client flows.
  - `backend/`: ASP.NET Core 8 API + SignalR hubs + in-memory room/game orchestration + EF Core/Postgres persistence.
- Local database dependencies are defined in `docker-compose.yml` (`postgres`, `pgadmin`).

## Common development commands
Run commands from repo root unless noted.

### Start local dependencies and app
- Start DB + pgAdmin only:
  - `docker compose up -d postgres pgadmin`
- Start full dev environment (PowerShell script; opens backend + frontend hot reload windows):
  - `.\dev-start-dev.ps1`
- Start containerized “prod-like” local environment:
  - `.\dev-start-prod.ps1`

### Backend (.NET)
- Build solution:
  - `dotnet build backend/BoardGameHub.sln`
- Run API (with hot reload):
  - `dotnet watch run --project backend/BoardGameHub.Api`
- Run all backend tests:
  - `dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj`
- Run a single backend test (xUnit filter):
  - `dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj --filter "FullyQualifiedName~GameHubTests"`
  - Replace `GameHubTests` with a class/method substring (for example `FullyQualifiedName~GameHubTests.JoinRoom`).

### Database Migrations
- **IMPORTANT**: `db.Database.Migrate()` has been removed from `Program.cs`. Migrations are **NOT** applied automatically at API startup.
- Apply migrations locally (after any model change):
  - `backend/migrate-db.ps1`
- Add a new migration:
  - `dotnet ef migrations add <MigrationName> --project backend/BoardGameHub.Api`
- **CI/CD**: On every push to `main` or `dev`, `.github/workflows/deploy-backend-azure.yml` automatically builds an EF Core Migration Bundle and runs it against the target database **before** the new container is deployed. Do not commit `efbundle` or `efbundle.exe` — these are build artifacts.

### Frontend (Angular)
- Install dependencies:
  - `npm --prefix frontend install`
- Run dev server:
  - `npm --prefix frontend start`
- Build:
  - `npm --prefix frontend run build`
- Watch build:
  - `npm --prefix frontend run watch`
- Run unit tests (Karma):
  - `npm --prefix frontend test`
- Run a single frontend unit spec:
  - `npm --prefix frontend test -- --include src/app/path/to/file.component.spec.ts`

### Playwright (frontend e2e-style game tests)
- Run configured Playwright suite:
  - `npm --prefix frontend run test:babble`
- Run Playwright UI mode:
  - `npm --prefix frontend run test:babble:ui`
- Run a single Playwright file:
  - `npm --prefix frontend exec playwright test tests/example.spec.ts`

### Linting/status notes
- No dedicated lint script is defined in `frontend/package.json`.
- No standalone lint command is defined at repository root for backend; use build/tests + Sonar workflow for quality checks.

## Architecture: big picture

### Request and realtime flow
- `backend/BoardGameHub.Api/Program.cs` wires the app: controllers, Identity/JWT auth, EF Core, CORS, static frontend hosting, and SignalR hubs (`/gamehub`, `/socialhub`, `/adminhub`).
- `frontend/src/app/services/signalr.service.ts` is the central client transport layer and source of truth for room/player/game streams.
- `backend/BoardGameHub.Api/Hubs/GameHub.cs` exposes gameplay/lobby methods and forwards actions to `IRoomService`.

### Room/game state engine
- `RoomService` (`backend/BoardGameHub.Api/Services/RoomService.cs`) is the core orchestrator:
  - Manages in-memory rooms and connection→room mapping.
  - Handles room lifecycle/reconnect behavior.
  - Routes actions to the game-specific service selected by `Room.GameType`.
- `GameStateManager` (`backend/BoardGameHub.Api/Services/GameStateManager.cs`) runs a 50ms tick loop and broadcasts `RoomStatePatch` diffs instead of full state when possible.
- `StateDiffService` + `Room.DirtyMembers` drive partial state updates; game actions usually mark `GameData`, `RoundScores`, `PlayerAnswers`, and `Players` dirty.

### Game plugin model
- `IGameService` (`backend/BoardGameHub.Api/Services/IGameService.cs`) defines the per-game contract (`StartRound`, `HandleAction`, `EndRound`, `DeserializeState`).
- `Program.cs` registers many `IGameService` implementations as singletons.
- New game integration generally requires:
  1. Backend service implementation + DI registration.
  2. Frontend component wiring in `frontend/src/app/features/games/game.registry.ts`.
  3. `GameType` and/or seeded metadata alignment in backend models/data.

### Table vs Hand platform concept
- Canonical terminology is in `docs/platform-glossary.md`.
- Backend role flag is `Player.IsScreen` (`backend/BoardGameHub.Api/Models/Room.cs`).
- Frontend role routing lives in `GameRoomComponent` + `GAME_REGISTRY`:
  - If a game has both `hostComponent` and `playerComponent`, selection is based on `isScreen` (Table vs Hand), not simply host/non-host.

### Persistence boundary
- Persistent data (users, friendships, chat, game history, game definitions) is in EF Core `AppDbContext` (`backend/BoardGameHub.Api/Data/AppDbContext.cs`).
- Active room/game runtime state is in-memory (`RoomService`/`GameStateManager`) and not fully persisted between process restarts.
- **Database migrations are NOT applied at startup.** They are applied out-of-band via `backend/migrate-db.ps1` (locally) or via an EF Core Migration Bundle in CI/CD (see `deploy-backend-azure.yml`). Never re-add `db.Database.Migrate()` to `Program.cs`.

## Engineering Standards to honor
- **Table vs. Hand:** Always respect the `Player.IsScreen` flag. Ensure animations and UX are synchronized between the shared Table and private Hand devices.
- **Surgical Edits:** Prioritize targeted `replace` calls over full-file rewrites.

## Existing AI/workflow guidance to honor
- `.cursor/rules/git-powershell.mdc` + `.agent/workflows/git-commands.md`:
  - In PowerShell, chain commands with `;` (not `&&`).
  - Prefer `git commit -am` for tracked-file-only commits; use `git add` first for new files.
  - **Commit/PR Standards**: Follow **Conventional Commits** (e.g., `feat:`, `fix:`) and use **Imperative Tense** (e.g., `Update`, not `Updated`) for the **entire message** (header and body).
  - **Issue Reference**: Link GitHub Issues with `#123` or `fixes #123` where applicable.
  - **GitHub Enforcement**: PR titles are strictly linted via `.github/workflows/lint-pr.yml`.
- `.cursor/rules/sonarqube-workflow.mdc` + `.agent/workflows/sonarqube-review.md`:
  - Use `sonar-scanner` only to run/upload analysis.
  - Use Sonar Web API/MCP/UI for gates/issues/hotspots/transitions.
  - Use `gh` for GitHub/CI context, not as a Sonar client.
- `.cursor/agents/deploy.md`:
  - Production deployments are expected from pushes to `main` via workflows in `.github/workflows/`.
  - Use `gh run list/watch` to inspect deployment runs when needed.
- `.agent/workflows/peer-review.md`:
  - Defines a full peer-review sequence (code/UX/accessibility/Sonar/build verification) for deep audit tasks.
- `.agent/workflows/testing-workflow.md`:
  - Dictates the monorepo approach to unit testing, execution verification, and coverage requirements.
- `.agent/workflows/feature-tracking.md`:
  - **MANDATORY**: Running trace document (`/docs/traces/`) required for all work on **prefixed branches** (e.g., `feat/`, `fix/`, `chore/`).
