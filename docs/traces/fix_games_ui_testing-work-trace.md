# Work Trace: fix_games_ui_testing

## 1) Planned Work

### TODO List
- [x] Merge latest `refactor/game-room-layout-audit` into `fix_games_ui_testing`.
- [x] Run live dual-device browser audit using `/browser` tools (Table host + Hand mobile view in isolated context).
- [x] Fix mobile in-game vertical spacing bug (`*ngIf` on `.main-stage`).
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
Deliver a high-contrast, beautiful mobile and desktop gameplay experience with clear controls, high-contrast buttons, and un-cluttered screen.

## 2) In Progress Work
- All site-wide contrast audits, Join As button refactors, and test suites complete.

## 3) Completed Work
- Refactored Join As buttons in `room-entry.component.html` to high-contrast `.join-type-card.btn-outline-primary` (solid deep navy background with pure white text when selected).
- Added global high-contrast rules for `.btn-outline-secondary` in `styles.scss`.
- Created `DeviceService` (`device.service.ts`) for automatic User-Agent and viewport detection.
- Fixed Found Words header contrast in `babble.component.scss` (`#ffffff !important` with text shadow).
- Replaced low-contrast grey role switch button with high-contrast navy pills (`HAND` / `TABLE`).
- Overrode `.game-sidebar` `max-width: 75vw` on mobile to `width: 100% !important`.
- Removed `.babble-header` on mobile (`d-none d-md-flex`).
- Redesigned `<app-mobile-tab-bar>` with 3px pink top border and active pink pills.
- Verified backend xUnit test suite: 235 / 235 tests passed.
- Verified frontend Karma unit test suite: 293 / 293 tests passed.
- Production build (`ng build`) completed in 6.6s.

## 4) Issues and Out of Scope
### 4a) Potential Blockers
None.

### 4b) Opportunities
None.
