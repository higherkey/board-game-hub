# Board Game Hub - Frontend

This directory contains the Angular 21 client application for the Board Game Hub platform.

## 🏛️ Architecture

The frontend is built with **Angular 21** using **Standalone Components** and a tokenized **Neobrutalist** physical design system.

### Core Concepts (Basics)
- **Table vs. Hand Routing**: Selects between a communal shared screen (TV) and a private controller (phone) using `Player.isScreen`. For details, see [Platform Glossary](../docs/platform-glossary.md).
- **Spatial Game Archetypes**: Games compose reusable spatial primitives across a four-tier hierarchy. For details, see [Game Archetypes & Spatial Hierarchy](../docs/game-archetypes-and-spatial-hierarchy.md) and [Zones of Play](../docs/zones-of-play-design-system.md).
- **`SignalRService`**: Real-time WebSocket transport layer; acts as the reactive source of truth for room and game state streams.
- **Game Registry**: [`game.registry.ts`](src/app/features/games/game.registry.ts) registers Table (`hostComponent`) and Hand (`playerComponent`) shells for each game.
- **Design System & Styling**: Token-driven Neobrutalist design system in `styles.scss` (OKLCH color palette, hard offset shadows, zero inline styles, zero `!important`, $\ge 44\text{px}$ touch targets).

### 📐 Frontend Quality & Styling Standards

All contributions to the frontend must adhere to the following quality mandates:
1. **Zero `!important`**: Never use `!important`. Rely on proper CSS cascading, selector specificity, and component scoping (`:host`).
2. **Zero Inline Styles**: Never use the `style="..."` attribute. Use component-scoped SCSS or design token utility classes.
3. **Touch Targets $\ge 44 \times 44\text{px}$**: Interactive elements (buttons, links, toggles) must meet the minimum physical touch target of $44 \times 44\text{px}$ on touch/mobile viewports (`@media (pointer: coarse)`).
4. **Layout Stability (CLS = 0)**: Always declare explicit `aspect-ratio` or `width`/`height` on `<img>`, `<video>`, and `<canvas>` elements to prevent content reflows during loading.
5. **Accessible Focus Rings**: Never use `outline: none` without providing a high-contrast `:focus-visible` outline ring (`outline: 2px solid var(--accent); outline-offset: 2px`).
6. **Reduced Motion Support**: Guard GSAP transforms and CSS animations with `@media (prefers-reduced-motion: reduce)` (e.g. passing `{ duration: 0 }` to place elements instantly).
7. **Viewport Stability**: Never use `100vh` for full-screen game stages on mobile; use `100dvh` (or `height: 100%` within a constrained flex parent) to prevent browser toolbar bouncing.

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

