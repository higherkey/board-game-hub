# GEMINI.md - Board Game Hub Foundational Mandates

This file defines the core architectural principles, development workflows, and technical standards for the Board Game Hub project. These instructions take precedence over general defaults.

## 1. Project Overview & Architecture

Board Game Hub is a monorepo consisting of an ASP.NET Core backend and an Angular frontend, designed for "Table" (Shared Screen) and "Hand" (Private Device) gameplay.

- **Backend (`/backend`):** ASP.NET Core 8, SignalR for real-time orchestration, EF Core with PostgreSQL.
- **Frontend (`/frontend`):** Angular (Standalone Components). Uses a `GameType` registry to route between Table and Hand views.
- **Real-time Engine:** `RoomService` and `GameStateManager` manage in-memory game state and broadcast partial diffs (`RoomStatePatch`) every 50ms.
- **Game Plugin Model:** New games must implement `IGameService` (backend) and be registered in `game.registry.ts` (frontend).

## 2. Critical Development Workflows

### Git & Source Control (Windows/PowerShell)
- **PowerShell Chaining:** NEVER use `&&` to chain commands. Always use `;`.
- **Commits:** Prefer `git commit -am "message"` for modified tracked files. Use `git add` explicitly for new files.
- **Standards:** All commits and PR titles **MUST** follow **Conventional Commits** (e.g., `feat:`, `fix:`) and use **Imperative Tense** (e.g., `Update`, not `Updated`) for the **entire message** (header and body).
- **Issue Reference:** Link GitHub Issues with `#123` or `fixes #123` where applicable.
- **Enforcement:** PR titles are strictly linted via GitHub Actions.
- **Staging:** Do not stage or commit unless explicitly requested.
- **Feature Tracking**: MANDATORY running trace document in `/docs/traces/` for all **prefixed branches**. **Strictly follow the "Finalization Process" (Section 5) in [.agent/workflows/feature-tracking.md](file:///c:/Programming/board%20game%20hub/.agent/workflows/feature-tracking.md) before any commit.**

### Local Environment
- **Dependencies:** Use `docker compose up -d postgres pgadmin` for the database.
- **Startup:** Use `.\dev-start-dev.ps1` to launch the full development environment with hot reload.
- **Database Migrations:** `db.Database.Migrate()` has been **removed** from `Program.cs`. Migrations are NOT applied at startup. After any model change, apply manually: `backend/migrate-db.ps1`.
- **Backend Tests:** `dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj`
- **Frontend Tests:** `npm --prefix frontend test` (Karma) and `npm --prefix frontend run test:babble` (Playwright).

### SonarQube & Code Quality
- **Scanner vs. API:** Use `sonar-scanner` ONLY for running/uploading analysis.
- **Management:** Use the SonarQube Web API or MCP tools for checking Quality Gates, searching issues, or transitioning issue states.
- **Hotspots:** Security hotspots must be reviewed via the SonarQube UI or IDE; they cannot be resolved via the scanner.

### Deployment
- **Production:** Triggered by pushes to `main`.
- **Workflows:** Located in `.github/workflows/`. Use `gh run list` and `gh run watch` to monitor deployments.
- **Database Migrations (CI/CD):** On every push to `main` or `dev`, the backend workflow automatically builds an EF Core Migration Bundle and applies it to the target database **before** the new container is deployed. Do not commit `efbundle` or `efbundle.exe`. **Never re-add `db.Database.Migrate()` to `Program.cs`.**
- **Secrets:** Never print or log GitHub secrets or environment variables.

## 3. Engineering Standards

- **Table vs. Hand:** Always respect the `Player.IsScreen` flag. Ensure animations and UX are synchronized between the shared Table and private Hand devices.
- **CSS Best Practices:** Avoid the use of `!important` at all costs. Prioritize CSS specificity, modularity, and proper cascading over forced overrides.
- **Surgical Edits:** Prioritize targeted `replace` calls over full-file rewrites.
- **Validation:** Every change requires verification. Run `dotnet build` for backend and `npm run build` (dev config) for frontend. Follow the `.agent/workflows/testing-workflow.md` for standardized test execution and coverage verification.
- **Peer Review:** Follow the full audit sequence (Code, UX, Accessibility, Sonar, Build) defined in `.agent/workflows/peer-review.md`. This includes a mandatory Test Quality Audit.

## 4. Tool-Specific Instructions

- **Backend Build:** `dotnet build backend/BoardGameHub.Api/BoardGameHub.Api.csproj`
- **Frontend Build:** `npm run build -- --configuration=development`
- **GitHub CLI:** Use `gh` for CI/CD context and issue management, but NOT for SonarQube operations.
