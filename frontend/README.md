# Board Game Hub - Frontend

This directory contains the Angular 18 client application for the Board Game Hub platform.

## 🏛️ Architecture

The frontend is built with **Angular 18** using **Standalone Components**. It is designed to handle two distinct roles: **Table** and **Hand**.

### Core Concepts
- **Table vs Hand Routing**: The application uses the `isScreen` flag from the player's room state to choose between a shared "Table" view (for TVs/shared screens) and a private "Hand" view (for mobile devices).
- **`SignalRService`**: The central transport layer. It manages the real-time connection to the backend and acts as the source of truth for game and room state streams.
- **Game Registry**: The `frontend/src/app/features/games/game.registry.ts` file is the entry point for all games. It maps `GameType` to the appropriate Table and Hand components.
- **Styling**: Uses **Bootstrap 5** and custom **SCSS** with a focus on responsive, mobile-first design for the "Hand" role.

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- Angular CLI

### Setup
1. **Install Dependencies**:
   ```powershell
   npm install
   ```
2. **Run Dev Server**:
   ```powershell
   npm start
   ```
   Navigate to `http://localhost:4200/`. The app will reload automatically on source changes.

## 🧪 Testing

### Unit Tests
Execute unit tests via **Karma**:
```powershell
npm test
```

### Coverage Tracking
For CI/CD scanning, tests are run with `--code-coverage` to generate an `lcov.info` report. This report is ingested by the **SonarScanner for .NET** during our centralized GitHub Actions run (`.github/workflows/sonar.yml`). You can find full details about our Unified Monorepo SonarCloud architecture in the [project root testing workflow](../.agent/workflows/testing-workflow.md).

### End-to-End Tests
Execute Playwright tests (specifically for the Babble game suite):
```powershell
npm run test:babble
```

## 🏗️ Code Scaffolding
Run `ng generate component component-name` to generate a new component.

