# Board Game Hub - Backend

This directory contains the ASP.NET Core 10 Web API that serves as the orchestration layer for the Board Game Hub platform.

## 🏛️ Architecture

The backend is built with **ASP.NET Core 10** and uses **SignalR** for real-time bi-directional communication.

### Core Components (Basics)
- **`RoomService`**: Central orchestrator for in-memory game rooms, player connection lifecycles, and game state routing.
- **`GameStateManager`**: Event-driven `Channel<string>` consumer (`IHostedService`) broadcasting partial state patches (`RoomStatePatch`) over SignalR with zero reflection ($O(1)$ compiled `FrozenDictionary` property accessors).
- **`Player.IsScreen` (Table vs. Hand)**: Wire model distinguishing shared display screens (`IsScreen = true`) from private mobile controllers (`IsScreen = false`). The hub method `ChangeRole(isScreen)` enables live role switching without rejoining. For details, see [Platform Glossary](../docs/platform-glossary.md).
- **`IGameService`**: Extensible plugin interface for individual games (`StartRound`, `HandleAction`, `EndRound`). Games compose frontend spatial archetypes defined in [Game Archetypes & Spatial Hierarchy](../docs/game-archetypes-and-spatial-hierarchy.md).
- **SignalR Hubs**:
  - `/gamehub`: Gameplay actions, room lifecycle, and live state patches.
  - `/socialhub`: Direct messaging, friend presence, and room invites.
  - `/adminhub`: Metrics, room inspection, and broadcast commands.

## 🛠️ Local Development

### Prerequisites
- .NET 10 SDK
- Docker (for PostgreSQL)

### Setup
1. **Start Database**: From the root directory, run:
   ```powershell
   docker compose up -d postgres pgadmin
   ```
2. **Apply Migrations**: Migrations are **not** applied automatically at startup. Run the migration script manually after any model change:
   ```powershell
   .\backend\migrate-db.ps1
   ```
3. **Run API**:
   ```powershell
   dotnet watch run --project backend/BoardGameHub.Api
   ```

## 🗄️ Database Migrations

> **Important for contributors and agents alike.**

Migrations are managed **out-of-band** from the API startup process.

| Context | Command |
|---|---|
| Add a new migration | `dotnet ef migrations add <Name> --project backend/BoardGameHub.Api` |
| Apply locally | `.\backend\migrate-db.ps1` |
| Apply in CI/CD | Automatic — see below |

### How CI/CD applies migrations

On every push to `main`, `staging`, or `dev`, the backend deployment workflow (`.github/workflows/deploy-backend-render.yml`) does the following **before** triggering Render deployment:

1. Generates a self-contained **EF Core Migration Bundle** (`efbundle`) from all migrations in source.
2. Runs the bundle against the branch's database: Supabase for `main` and `staging` (`SUPABASE_CONNECTION_STRING_PROD` / `_STAGING`), Neon for `dev` (`NEON_CONNECTION_STRING_DEV`).
3. Updates only Render's database connection variable to use that same target, then deploys the tested commit.
4. Waits for Render to become live and verifies both `/health` and the database-backed `/api/games` route.

Missing database secrets fail deployment; staging never falls back to the dev database. `RENDER_API_KEY` is required for configuration alignment and deploy verification.

This guarantees the schema is always up-to-date before new code runs. The `efbundle` binary is a transient build artifact — **do not commit it**.

## 🧪 Testing

### Bundled public game catalogue

The frontend bundles a versioned snapshot of the canonical `GameDefinition` seed metadata so first-time visitors can browse while the API starts or is unavailable. Release builds scope the browser cache to their configured API URL; each tier receives the metadata in its checked-out source revision.

After changing game seed metadata, regenerate and commit the snapshot:

```powershell
npm --prefix frontend run catalogue:generate
npm --prefix frontend run catalogue:check
```

The exporter reads the EF design-time model directly without starting the API, opening database connections, or requiring secrets. Frontend CI rejects a snapshot that differs from the model. Ordinary frontend builds use the committed snapshot and require no database, API or .NET runtime. Successful background refreshes replace browsing data; room creation and gameplay remain authoritative on the backend.

We use **xUnit** for our test suite. To run all backend tests:
```powershell
dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj
```

### Coverage Tracking
For CI/CD scanning, tests are run with `/p:CollectCoverage=true` to generate OpenCover XML reports. These reports are ingested by the **SonarScanner for .NET** during our centralized GitHub Actions run (`.github/workflows/sonar.yml`). You can find full details about our Unified Monorepo SonarCloud architecture in the [project root testing workflow](../.agent/workflows/testing-workflow.md).

## 🔐 Authentication
The API uses **JWT-based authentication** integrated with **ASP.NET Core Identity**. Tokens are passed via the SignalR `access_token` query parameter during the negotiation phase.

### Admin account
The admin user is seeded only when `Admin__Email` and `Admin__Password` are provided through environment variables or `dotnet user-secrets`. If either is missing, the Admin role is still created but no admin user is seeded. For local development:

```
dotnet user-secrets set "Admin:Email" "you@example.com" --project backend/BoardGameHub.Api
dotnet user-secrets set "Admin:Password" "<choose-a-strong-password>" --project backend/BoardGameHub.Api
```

On Render, set both `Admin__Email` and `Admin__Password` for each service (prod, dev and staging). These values create a missing account; changing the environment password does **not** rotate the password of an existing stored account.

Before deployment, an authorized operator must reset any existing admin account that used the former committed password through ASP.NET Core Identity (`UserManager.GeneratePasswordResetTokenAsync` and `ResetPasswordAsync`), then verify the old password is rejected. Check that account's `LockoutEnabled` through `UserManager.GetLockoutEnabledAsync` and, if needed, enable it with `SetLockoutEnabledAsync`. This is an operational gate; startup does not reset existing passwords or globally change existing accounts' lockout settings. Password reset does not invalidate previously issued stateless JWTs: they remain valid until expiry unless a signing-key rotation is planned through the authentication rollout (#218).

Login attempts are locked out for 15 minutes after 5 consecutive failures.
