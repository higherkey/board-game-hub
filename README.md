# Board Game Hub

> Bringing people together through shared screens and personal devices.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=flat-square)](https://board-game-hub-alpha.vercel.app/)

Board Game Hub is a multiplayer board game platform designed for "Table" (shared screen) and "Hand" (personal device) gameplay. It bridges the gap between digital and physical play by allowing players to use their phones as controllers while a central screen (TV or laptop) serves as the game board.

## 🚀 Tech Stack

- **Frontend**: Angular 18 (Standalone Components, RxJS, SignalR Client)
- **Backend**: ASP.NET Core 8 Web API
- **Real-time**: SignalR (WebSockets)
- **Database**: PostgreSQL (EF Core)
- **Styling**: Bootstrap 5 + custom SCSS

## 🎮 Platform Concept (Table vs Hand)

The platform distinguishes between two roles:
- **Table**: The shared display (e.g., a TV). Optimized for large text and shared game state. Join with `Player.isScreen === true`.
- **Hand**: The personal controller (e.g., a phone). Used for private input and individual actions. Join with `Player.isScreen === false`.

For more details, see the [Platform Glossary](file:///c:/Programming/board%20game%20hub/docs/platform-glossary.md).

## 🧩 Game Plugin Model

Board Game Hub is designed to be extensible. New games can be added by implementing a backend `IGameService` and registering a frontend component.
Current games include:
- **Scatterbrain**: A fast-paced word game.
- **Clover-Minded**: A cooperative clue-giving game.

## 🛠️ Project Structure

- **[/frontend](file:///c:/Programming/board%20game%20hub/frontend)**: Angular client application.
- **[/backend](file:///c:/Programming/board%20game%20hub/backend)**: .NET Core API and SignalR hubs.
- **[/docs](file:///c:/Programming/board%20game%20hub/docs)**: Technical documentation and architecture plans.

## 🚢 Deployment & Database Migrations

Deployments to `dev` and `main` are triggered automatically via GitHub Actions (`.github/workflows/`).

**Database schema changes are applied automatically during deployment** using EF Core Migration Bundles — the schema is always updated *before* the new container starts. Developers should **never** apply migrations by re-adding `db.Database.Migrate()` to startup code.

For full details on local and CI/CD migration workflows, see the [Backend README](file:///c:/Programming/board%20game%20hub/backend/README.md#-database-migrations).

## ✅ Testing & Quality

Board Game Hub maintains mission-critical stability through a standardized testing methodology:
- **Comprehensive Testing**: All features are validated with .NET unit tests (Backend) and Karma/Jasmine specs (Frontend). See our [.agent/workflows/testing-workflow.md](.agent/workflows/testing-workflow.md) for full standards.
- **Peer Review**: Every significant change undergoes a senior-level code and UX audit.
- **Future Ready**: We are currently preparing for additional E2E coverage via Playwright.

## 🤝 Contributing

We welcome contributions of all kinds! Whether you want to add a new game, improve the platform core, or polish the UX, we'd love to have you.

- **Human-only?** No problem. Please ensure you maintain a manual work trace in `docs/traces/` for your feature branch.
- **Using AI?** We have established AI workflows in `.agent/workflows` to help you move faster. Mandatory tracking and testing standards apply to all AI-assisted work.

Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** for developer workflow standards and legal terms.

## ⚖️ License

This project is **Source-Available and Proprietary**. You are free to view and contribute to the source code, but commercial use is restricted. See [CONTRIBUTING.md](file:///c:/Programming/board%20game%20hub/CONTRIBUTING.md) for details.

