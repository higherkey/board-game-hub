# Board Game Hub

> Connecting people and making them feel as close as possible no matter where they are in the world.

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/richardlitt/standard-readme)
[![Live Demo](https://img.shields.io/badge/Live%20Demo%20(Prod)-brightgreen?style=flat-square)](https://boardgamehub.eight1fivedesign.com)
[![Staging Preview](https://img.shields.io/badge/Staging%20Preview-purple?style=flat-square)](https://staging.board-game-hub-frontend.pages.dev)
[![Dev Preview](https://img.shields.io/badge/Dev%20Preview-blue?style=flat-square)](https://dev.board-game-hub-frontend.pages.dev)
[![Backend Deploy](https://github.com/higherkey/board-game-hub/actions/workflows/deploy-backend-render.yml/badge.svg)](https://github.com/higherkey/board-game-hub/actions/workflows/deploy-backend-render.yml)
[![Frontend Deploy](https://github.com/higherkey/board-game-hub/actions/workflows/deploy-frontend-cloudflare.yml/badge.svg)](https://github.com/higherkey/board-game-hub/actions/workflows/deploy-frontend-cloudflare.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=higherkey_board-game-hub&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=higherkey_board-game-hub)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=higherkey_board-game-hub&metric=coverage)](https://sonarcloud.io/summary/new_code?id=higherkey_board-game-hub)
[![Angular 21](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com/)
[![Neon Postgres](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-00E599?style=flat-square&logo=postgresql)](https://neon.tech/)
[![SignalR](https://img.shields.io/badge/SignalR-Active-orange?style=flat-square&logo=signalr)](#)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg?style=flat-square)](LICENSE)

Board Game Hub is a multiplayer board game platform created by [eight1five design](https://eight1fivedesign.com). Designed for "Table" (shared screen) and "Hand" (personal device) gameplay, its mission is to bring people together and make them feel right in the same room — no matter where they are in the world.

### 🌐 Deployments & Release Pipeline

We follow **[Automated Conventional Semantic Versioning](CONTRIBUTING.md#️-developer-workflow--automated-conventional-semantic-versioning)** (`SemVer 2.0.0` + `Conventional Commits`):

| Tier | Branch | Frontend (Cloudflare Pages) | Backend API (Render) | Database (Postgres) | Version Tagging |
|---|---|---|---|---|---|
| **prod** | `main` | [boardgamehub.eight1fivedesign.com](https://boardgamehub.eight1fivedesign.com) | `https://board-game-hub-api.onrender.com` | Neon Prod DB | Milestone Release (`v0.25.0`) |
| **staging** | `staging` | `https://staging.board-game-hub-frontend.pages.dev` | `https://board-game-hub-api-staging.onrender.com` | Neon Staging DB | Release Candidate (`v0.25.0-rc.1`) |
| **dev** | `dev` | [dev.board-game-hub-frontend.pages.dev](https://dev.board-game-hub-frontend.pages.dev) | `https://board-game-hub-api-dev.onrender.com` | Neon Dev DB | Dev Pre-Release (`v0.25.0-dev.1`) |
| **feature PRs** | `feat/*`, `fix/*` | Cloudflare Branch Preview | PR Build / Unit Tests | Local / Test InMemory | Ephemeral |


## Table of Contents

- [Background](#background)
- [Deployments & Environments](#-deployments--environments)
- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Background

Board Game Hub was built on the core belief that technology should bring people closer together, not pull them apart. By combining a central shared display with individual mobile controllers, Board Game Hub recreates the warmth, laughter, and intimacy of physical game night across any distance.

### Platform Concept (Table vs Hand & Zones of Play)

The platform distinguishes between two roles:
- **Table**: The shared display (e.g., a TV or projector). Optimized for large text, high readability from across the room, and shared game state. Join with `Player.isScreen === true`.
- **Hand**: The personal controller (e.g., a mobile phone or tablet). Used for private input, individual actions, and secret clues. Join with `Player.isScreen === false`.

This dual-role architecture is grounded in Scott Rogers & Gil Hova's tabletop ergonomics theory (**The Six Zones of Play**):
- **Hand Devices** govern **Zones 1–3**: Active touch input ($\ge 44\text{px}$ targets), hidden/reserve staging, and personal player tableaus.
- **Table Devices** govern **Zones 4–6**: Shared communal boards, peripheral sideboards (scores, round tracks), and ambient rules.

For architectural specifications and theoretical foundations, see:
- 📖 [Platform Glossary](docs/platform-glossary.md) — Core terms and wire models.
- 📐 [Game Archetypes & Spatial Hierarchy](docs/game-archetypes-and-spatial-hierarchy.md) — Four-tier compositional hierarchy and macro-archetypes.
- 🔬 [Tabletop Spatial Ergonomics (The Six Zones of Play)](docs/zones-of-play-design-system.md) — Pure theoretical reference on table ergonomics.

### Game Plugin Model & Spatial Archetypes

Board Game Hub is designed to be extensible. Rather than building ad-hoc, brittle layouts, new games compose standardized spatial layout archetypes (`SpatialGridArena`, `HandDeckTray`, `PlayerTableauBay`, `PassingRelay`, `DeductionScreen`, `CreativeCanvas`, `SocialPromptVote`) paired with backend `IGameService` implementations. Current flagship games include:
- **Babble**: High-intensity word puzzle combining passing relay timer mechanics with a communal grid.
- **Clover-Minded**: Cooperative spatial deduction featuring asymmetric keyword staging and clover placement.
- **Farkle**: Push-your-luck dice game pairing personal player tableaus with a communal scoreboard ring.

### Project Structure

- **[/frontend](frontend)**: Angular 21 client application (standalone components, Neobrutalist design system, SignalR transport).
- **[/backend](backend)**: .NET 10 Web API and SignalR hubs with event-driven state diff broadcasting.
- **[/docs](docs)**: Technical documentation, spatial hierarchy guides, zones of play theory, and release notes.

---

## Install

This project requires [Docker](https://www.docker.com/) for database dependencies, [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0), and [Node.js](https://nodejs.org/) for Angular.

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
