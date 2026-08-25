# Work Trace: fix_games_ui_testing

## 1) Planned Work

### TODO List
- [x] Merge latest `refactor/game-room-layout-audit` into `fix_games_ui_testing`.
- [x] Run live dual-device browser audit using `/browser` tools (Table host + Hand mobile view in isolated context).
- [x] Fix mobile in-game vertical spacing bug (`*ngIf` on `.main-stage`).
- [x] Make "Your Display Name" section prominent with 20px label, pink icon, 2px solid navy input border, and bold hint text.
- [x] Refactor "Join As" buttons with high-contrast `.join-type-card` choices.
- [x] Global high-contrast sweep for `.btn-outline-secondary` in `styles.scss`.
- [x] Create `DeviceService` for automatic User-Agent and viewport detection.
- [x] Fix Found Words header contrast in Babble (`#ffffff !important`).
- [x] Redo "Switch to Player" / "Switch to Table" role button with high contrast pills and explicit labels (`HAND` / `TABLE`).
- [x] Fix `.game-sidebar` mobile width constraint (`width: 100% !important; max-width: 100% !important;`).
- [x] Hide `.babble-header` on mobile (`d-none d-md-flex`).
- [x] Redo `<app-mobile-tab-bar>` with high-contrast 3px pink top border and active pink pill buttons.
- [x] Verify complete test suite (`dotnet test` & `npm test`).

### File List
- **Documentation & Work Trace**:
  - `docs/traces/fix_games_ui_testing-work-trace.md`
- **Global Styles**:
  - `frontend/src/styles.scss`
- **Device Service**:
  - `frontend/src/app/services/device.service.ts`
- **Game Room Layout Components**:
  - `frontend/src/app/features/game-room/game-room.component.html`
  - `frontend/src/app/features/game-room/game-room.component.scss`
  - `frontend/src/app/features/game-room/components/room-header/room-header.component.html`
  - `frontend/src/app/features/game-room/components/room-header/room-header.component.ts`
  - `frontend/src/app/features/game-room/components/host-settings/host-settings.component.scss`
  - `frontend/src/app/features/game-room/components/player-settings/player-settings.component.scss`
  - `frontend/src/app/features/game-room/components/room-entry/room-entry.component.html`
  - `frontend/src/app/features/game-room/components/room-entry/room-entry.component.ts`
  - `frontend/src/app/features/game-room/components/room-entry/room-entry.component.scss`
  - `frontend/src/app/features/game-room/components/room-sidebar/room-sidebar.component.html`
  - `frontend/src/app/features/game-room/components/mobile-tab-bar/mobile-tab-bar.component.html`
  - `frontend/src/app/features/game-room/components/mobile-tab-bar/mobile-tab-bar.component.scss`
- **Babble Component**:
  - `frontend/src/app/features/games/babble/babble-game/babble.component.scss`
  - `frontend/src/app/features/games/babble/babble-game/babble.component.html`

### Rationale
Deliver a high-contrast, prominent, beautiful mobile and desktop gameplay experience.

### Completed Landing Page Work
- Synchronized branch with latest `dev` (`fast-forward`).
- Implemented 12s synchronized Table & Hand timed animation showing all 3 steps left-to-right (Host TV $\rightarrow$ Dual-Phone Join with QR/Code $\rightarrow$ Live Tile Game Board & Hand Controllers) with 01/02/03 step overview cards.
- Added clean, concise "How Table vs. Hand Works" concept section below the hero.
- Implemented expandable quick-join code pill with auto-uppercase and validation.
- Cleaned up prototype routes and verified all 300 frontend Karma tests and 239 backend xUnit tests.

## 4) Issues and Out of Scope
### 4a) Potential Blockers
None.

### 4b) Opportunities
None.
