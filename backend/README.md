# Board Game Hub - Backend

This directory contains the ASP.NET Core 8 Web API that serves as the orchestration layer for the Board Game Hub platform.

## 🏛️ Architecture

The backend is built with **ASP.NET Core 8** and uses **SignalR** for real-time bi-directional communication.

### Core Components
- **`RoomService`**: The central orchestrator for in-memory game rooms. It manages the lifecycle of rooms and player connections.
- **`GameStateManager`**: Runs a high-frequency (50ms) tick loop to broadcast partial state patches (`RoomStatePatch`) to clients, ensuring low-latency updates.
- **`IGameService`**: A plugin interface that allows new games to be integrated into the platform with minimal friction.
- **SignalR Hubs**:
  - `/gamehub`: Handles gameplay logic and room events.
  - `/socialhub`: Manages chat, friend presence, and notifications.

## 🛠️ Local Development

### Prerequisites
- .NET 8 SDK
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

On every push to `main` or `dev`, the backend deployment workflow (`.github/workflows/deploy-backend-render.yml`) does the following **before** triggering Render deployment:

1. Generates a self-contained **EF Core Migration Bundle** (`efbundle`) from all migrations in source.
2. Runs the bundle against the target Supabase database using the branch-appropriate connection string.
3. Only then triggers deployment on Render.

This guarantees the schema is always up-to-date before new code runs. The `efbundle` binary is a transient build artifact — **do not commit it**.

## 🧪 Testing

We use **xUnit** for our test suite. To run all backend tests:
```powershell
dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj
```

### Coverage Tracking
For CI/CD scanning, tests are run with `/p:CollectCoverage=true` to generate OpenCover XML reports. These reports are ingested by the **SonarScanner for .NET** during our centralized GitHub Actions run (`.github/workflows/sonar.yml`). You can find full details about our Unified Monorepo SonarCloud architecture in the [project root testing workflow](../.agent/workflows/testing-workflow.md).

## 🔐 Authentication
The API uses **JWT-based authentication** integrated with **ASP.NET Core Identity**. Tokens are passed via the SignalR `access_token` query parameter during the negotiation phase.
