# Branch Notes: fix/babble-hand-view

## Goal
Implement a dedicated Babble Hand view (`BabbleHandComponent`) for personal devices (mobile/tablet/controller) and decouple it from the shared Table display (`BabbleComponent`), ensuring Hand players receive the proper player view with interactive letter tiles, word submission, and personal results rather than an administrative host view.

## Discoveries & Deviations
- In `GAME_REGISTRY`, `Babble` was registered only with `tableComponent: BabbleComponent` and lacked a `handComponent`.
- When users joined as Hand (`isScreen === false`), `GameRoomStateService` fell back to `BabbleComponent`, which was built as a hybrid desktop/Table screen.
- In `BabbleComponent`, `isHost` was conflated with Table screen privileges, causing host controls (Pause, Resume, End Round) to clutter the mobile header and injecting inline dictionary validation and Next Round buttons into the results view.
- In `babble.component.scss`, `.grid-stage { display: none; }` hid the letter tiles on all screens $\le 768\text{px}$, leaving mobile players without a visible letter grid.
- `bgh_preferred_role` persistence across room sessions ensures roles are remembered properly.

## Verification
- Backend tests: 643 passed, 0 failed (`dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj`).
- Frontend unit tests:
  - `BabbleHandComponent`: 20/20 passed (`npm --prefix frontend test -- --include src/app/features/games/babble/babble-hand/babble-hand.component.spec.ts`).
  - `BabbleComponent`: 16/16 passed (`npm --prefix frontend test -- --include src/app/features/games/babble/babble-game/babble.component.spec.ts`).
  - `GameRoomStateService`: 32/32 passed (`npm --prefix frontend test -- --include src/app/features/game-room/services/game-room-state.service.spec.ts`).
- Frontend production build: `npm --prefix frontend run build` succeeded (0 errors).

## 4a. Blockers & Risks
- None.

## 4b. Quick Wins
- Building a standalone `BabbleHandComponent` following the established `ScatterbrainHandComponent` / `FarkleHandComponent` pattern cleanly isolates Hand player logic without touching complex Table stage behaviors.

## 4c. Deferred Items
- None.
