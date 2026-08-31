# Board Game Hub

> Connecting people and making them feel as close as possible no matter where they are in the world.

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/richardlitt/standard-readme)
[![Live Demo](https://img.shields.io/badge/Live%20Demo%20(Prod)-brightgreen?style=flat-square)](https://board-game-hub-alpha.vercel.app/)
[![Dev Preview](https://img.shields.io/badge/Dev%20Preview-blue?style=flat-square)](https://board-game-hub-dev.vercel.app/)
[![Backend Deploy](https://github.com/higherkey/board-game-hub/actions/workflows/deploy-backend-render.yml/badge.svg)](https://github.com/higherkey/board-game-hub/actions/workflows/deploy-backend-render.yml)
[![Frontend Deploy](https://github.com/higherkey/board-game-hub/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/higherkey/board-game-hub/actions/workflows/frontend-deploy.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=higherkey_board-game-hub&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=higherkey_board-game-hub)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=higherkey_board-game-hub&metric=coverage)](https://sonarcloud.io/summary/new_code?id=higherkey_board-game-hub)
[![Angular 21](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![SignalR](https://img.shields.io/badge/SignalR-Active-orange?style=flat-square&logo=signalr)](#)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg?style=flat-square)](LICENSE)

Board Game Hub is a multiplayer board game platform created by [eight1five design](https://eight1fivedesign.com). Designed for "Table" (shared screen) and "Hand" (personal device) gameplay, its mission is to bring people together and make them feel right in the same room — no matter where they are in the world.

### 🌐 Deployments & Environments

| Environment | Frontend (Vercel) | Backend API (Render) | Database (Supabase) | Branch Trigger |
|---|---|---|---|---|
| **Production** | [board-game-hub-alpha.vercel.app](https://board-game-hub-alpha.vercel.app/) | `https://board-game-hub-api.onrender.com` | Supabase (Prod) | `main` |
| **Development** | [board-game-hub-dev.vercel.app](https://board-game-hub-dev.vercel.app/) | `https://board-game-hub-api-dev.onrender.com` | Supabase (Dev) | `dev` |
| **PR Previews** | Dynamic PR preview comments | Dynamic PR previews (Render Blueprint) | Ephemeral / Branch | `pull_request` |

## Table of Contents

- [Background](#background)
- [Deployments & Environments](#-deployments--environments)
- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Background

Board Game Hub was built on the core belief that technology should bring people closer together, not pull them apart. By combining a central shared display with individual mobile controllers, Board Game Hub recreates the warmth, laughter, and intimacy of physical game night across any distance.

### Platform Concept (Table vs Hand)

The platform distinguishes between two roles:
- **Table**: The shared display (e.g., a TV). Optimized for large text and shared game state. Join with `Player.isScreen === true`.
- **Hand**: The personal controller (e.g., a phone). Used for private input and individual actions. Join with `Player.isScreen === false`.

For more details, see the [Platform Glossary](file:///c:/Programming/board%20game%20hub/docs/platform-glossary.md).

### Game Plugin Model

Board Game Hub is designed to be extensible. New games can be added by implementing a backend `IGameService` and registering a frontend component. Current games include:
- **Scatterbrain**: A fast-paced word game.
- **Clover-Minded**: A cooperative clue-giving game.

### Project Structure

- **[/frontend](file:///c:/Programming/board%20game%20hub/frontend)**: Angular client application.
- **[/backend](file:///c:/Programming/board%20game%20hub/backend)**: .NET Core API and SignalR hubs.
- **[/docs](file:///c:/Programming/board%20game%20hub/docs)**: Technical documentation and architecture plans.

---

## Install

This project requires [Docker](https://www.docker.com/) for database dependencies, [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0), and [Node.js](https://nodejs.org/) for Angular.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/higherkey/board-game-hub.git
   cd "board game hub"
   ```
2. **Start Docker dependencies:**
   ```bash
   docker compose up -d postgres pgadmin
   ```
3. **Install frontend dependencies:**
   ```bash
   npm --prefix frontend install
   ```
4. **Apply local database migrations:**
   Run the migration script:
   ```powershell
   ./backend/migrate-db.ps1
   ```

---

## Usage

### Development Startup

To run the full development environment with hot reloading (opens backend and frontend hot reload windows):
```powershell
./dev-start-dev.ps1
```

Or start components individually:
- **Backend**: `dotnet watch run --project backend/BoardGameHub.Api`
- **Frontend**: `npm --prefix frontend start`

### Testing

Board Game Hub maintains stability through a standardized testing methodology:
- **Backend**: Run all backend tests:
  ```bash
  dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj
  ```
- **Frontend Unit**: Run frontend unit tests (Karma):
  ```bash
  npm --prefix frontend test
  ```
- **Frontend E2E**: Run Playwright E2E game tests:
  ```bash
  npm --prefix frontend run test:babble
  ```

For full details, see the [.agent/workflows/testing-workflow.md](.agent/workflows/testing-workflow.md).

---

## Contributing

We welcome contributions of all kinds! Whether you want to add a new game, improve the platform core, or polish the UX.

Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** for developer workflow standards and legal terms.

- **Using AI?** We have established AI workflows in `.agent/workflows` to help you move faster. Mandatory tracking and testing standards apply to all AI-assisted work (e.g. maintain a manual work trace in `docs/traces/` for your feature branch).

---

## License

Proprietary / Source-Available. You are free to view and contribute to the source code, but commercial use is restricted. See [CONTRIBUTING.md](file:///c:/Programming/board%20game%20hub/CONTRIBUTING.md) for details.
