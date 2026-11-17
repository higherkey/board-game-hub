# Branch Notes: fix/mobile-lobby-layout-and-avatar

## Goal
Resolve mobile layout and design defects in the game room/lobby and fix avatar not showing without a page refresh:
1. Prevent the global page/window from scrolling the header off screen.
2. Compact mobile lobby elements to fit viewport naturally without unnecessary scrolling.
3. Fix the bottom tab bar overlaying and hiding the lobby controls/parameters.
4. Remove unwanted rounded corners and outer margins around the lobby section.
5. Fix avatar not appearing for newly entered guests or authenticated users until refreshing.

## Discoveries & Deviations
- `:host` in `game-room.component.scss` used `height: 100vh;` instead of `100dvh`, exceeding mobile browser viewport when address bars are visible, causing `window` scrolling and pushing `app-room-header` off screen.
- `app-mobile-tab-bar` was placed outside the main flex container and styled with `position: fixed; bottom: 0;`, overlaying content at the bottom of the screen. Moving it in-flow at the bottom of the flex column inside `game-room` guarantees it never overlaps main content.
- `.main-stage` and `.settings-panel` had `border-radius: var(--radius-lg, 12px);` and outer margins, revealing dark/poly backgrounds at the top corners and edges. Flattened to `border-radius: 0; border: none; box-shadow: none;` on mobile.
- In `auth.service.ts`, `setGuestName` did not initialize or query `getGuestId()`, so initial guest session had `avatarUrl: undefined`. When `getGuestId()` later created the avatar in `localStorage`, it did not notify `sessionSubject`, so the UI only loaded the avatar on subsequent page reloads. Updated `getGuestId()` and `setGuestName()` to immediately populate and emit the avatar in `session$`.
- In `AuthController.cs`, `GenerateJwtTokenAsync` did not include the `AvatarUrl` claim in JWT tokens, causing `GameHub` to receive null avatar URLs for registered users. Added `AvatarUrl` claim to JWT tokens.
- Global scrollbars were refined from an intrusive 10px bright blue bar to a sleek 8px semi-transparent thumb (`color-mix`).

## Verification
- Backend tests: `dotnet test` passed (583 passed).
- Frontend tests: `ng test` passed (512 passed).
- Frontend build: `ng build` succeeded cleanly.

## 4a. Blockers & Risks
- None.

## 4b. Quick Wins
- Placing `app-mobile-tab-bar` in-flow cleanly resolves bottom bar overlap without brittle padding calculations.
- Adding `overflow-hidden` to body during `GameRoomComponent` lifecycle permanently prevents address-bar scroll bouncing from hiding the room header.

## 4c. Deferred Items
- None.
