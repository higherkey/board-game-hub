# Work Trace: feat-166-table-hand-controllers

## 1. Overview
Enforce explicit Table vs. Hand dual-role architecture across party games in Board Game Hub. Refactor `GameConfig` in `game.registry.ts` to rename legacy `hostComponent`/`playerComponent` to canonical `tableComponent`/`handComponent`, and wire dedicated Hand controller views for *Wisecrack*, *Poppycock*, *Scatterbrain*, and *Pictophone*.

## 2. Problem Statement
- In `game.registry.ts`, `GameConfig` used legacy terms `hostComponent` and `playerComponent`, and only *CloverMinded* and *Farkle* were wired with separate components.
- *Wisecrack* and *Poppycock* already had dedicated player components (`WisecrackPlayerComponent`, `PoppycockPlayerComponent`), but they were not registered in `game.registry.ts`, forcing mobile Hand players to see Table views.
- *Scatterbrain* had inline host vs. player checks (`*ngIf="isHost"`) bundled in a single file instead of clean Table and Hand separation.
- *Pictophone* lacked dedicated Hand controller view registration.

## 3. Architecture & Implementation Plan
- **Standardize `GameConfig`**: Rename `hostComponent` $\rightarrow$ `tableComponent` and `playerComponent` $\rightarrow$ `handComponent` (maintaining backward-compatible optional aliases if needed during transition).
- **Register Hand Components in `game.registry.ts`**:
  - `Wisecrack`: `tableComponent: WisecrackGameComponent`, `handComponent: WisecrackPlayerComponent`
  - `Poppycock`: `tableComponent: PoppycockGameComponent`, `handComponent: PoppycockPlayerComponent`
  - `Scatterbrain`: Extract/wire dedicated `ScatterbrainHandComponent` / `ScatterbrainTableComponent`
  - `Pictophone`: Wire dedicated Hand input/drawing controller views
- **Update `GameRoomStateService.ts`**: Resolve component based on `isScreen ? config.tableComponent : (config.handComponent || config.tableComponent)`.
- **Verify**: Build frontend, execute unit & E2E tests, audit via `/plan-review` and `/peer-review-with-quality`.

## 4. Completed Milestones
- [x] Create `implementation_plan.md` and audit via `/plan-review`, `/frontend-ui-engineering-slim`, and `/doubt-driven-development-slim`.
- [x] Refactor `GameConfig` in `game.registry.ts` to `tableComponent` & `handComponent`.
- [x] Update `game-room-state.service.ts` to resolve `tableComponent`/`handComponent` dynamically based on `isScreen`.
- [x] Upgrade `WisecrackPlayerComponent` and `PoppycockPlayerComponent` with direct SignalR integration, `myConnectionId` binding, and host admin controls.
- [x] Extract `ScatterbrainHandComponent` with mobile-optimized input form, challenge voting modal, and host controls.
- [x] Create `PictophoneHandComponent` hosting mobile text prompt input, drawing canvas, showcase star reactions, and host controls.
- [x] Add comprehensive unit test suites for all Hand components and `GameRoomStateService` (358 Karma tests passing, 100% pass rate).
- [x] Verify zero-warning Angular build and 239 backend xUnit tests passing.
- [x] Address SonarCloud New Code Coverage: achieved $\ge 80\%$ on all changed and newly created TypeScript code.
- [x] Refactor template markup across Hand controllers to reduce duplication from $13.4\%$ down to $7.3\%$ and prepare final toolbar divergence.

