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
2. **Run API**:
   ```powershell
   dotnet watch run --project backend/BoardGameHub.Api
   ```
   *Note: Database migrations are applied automatically on startup.*

## 🧪 Testing

We use **xUnit** for our test suite. To run all backend tests:
```powershell
dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj
```

## 🔐 Authentication
The API uses **JWT-based authentication** integrated with **ASP.NET Core Identity**. Tokens are passed via the SignalR `access_token` query parameter during the negotiation phase.
