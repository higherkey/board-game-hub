# Work Trace: feat/farkle

## 1) Planned Work
- **UI Refactoring**: Decouple monolithic CSS from `game-room.component.scss` into modular component SCSS files (`room-header.component.scss`, `room-sidebar.component.scss`).
- **Accessibility & UX**: Add proper ARIA attributes to mobile room menu navigation overlay and header buttons. Mask room code display during room initialization (`CREATE` state).
- **Farkle Game Integration & Testing**: Ensure 3D dice styling is clean and maintain test suites for both backend (`FarkleServiceTests.cs`) and frontend (`farkle-hand.component.spec.ts`, `farkle-table.component.spec.ts`).
- **Build & Style Budget**: Adjust Angular component style budgets in `angular.json` to accommodate rich game component styles.

## 2) In Progress Work
- None.

## 3) Completed Work
- `frontend/src/app/features/game-room/game-room.component.scss` — Extracted header, sidebar, and overlay styles.
- `frontend/src/app/features/game-room/components/room-header/` — Scoped SCSS, added ARIA attributes for a11y, masked CREATE code, updated spec tests.
- `frontend/src/app/features/game-room/components/room-sidebar/` — Scoped SCSS and updated spec tests.
- `frontend/src/app/features/games/farkle/farkle-table/farkle-table.scss` — Formatted 3D dice styles.
- `frontend/angular.json` — Raised `anyComponentStyle` budget warning to 12kB and error to 16kB.
- `README.md` — Restructured documentation to standard-readme format with project status badges.
- `backend/BoardGameHub.Tests/Services/Games/FarkleServiceTests.cs` — Verified 15 unit tests.
- `frontend/src/app/features/games/farkle/**/*.spec.ts` — Verified 11 Karma unit tests.

## 4) Issues and Out of Scope
- **4a) Potential Blockers**: None.
- **4b) Opportunities**:
  - #145: `test(farkle): Implement Playwright E2E test suite for Farkle Table & Hand gameplay`
  - #146: `feat(a11y): Add focus-trap directive for mobile room menu navigation overlay`
  - #147: `refactor(farkle): Extract 3D dice keyframe animations into shared SCSS partial`
