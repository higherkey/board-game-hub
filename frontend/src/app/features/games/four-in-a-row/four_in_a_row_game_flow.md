# Four in a Row

Two Hand players play an untimed match on a 7 × 6 board. Any shared Table is a read-only display and does not take a player slot. The first Hand is Red (1), the second Yellow (2).

## Flow

1. Select Four in a Row in the lobby, join two Hands, mark both ready, and start.
2. The active Hand chooses a numbered column. The disc falls to its lowest empty cell. Full columns are disabled; the server rejects malformed, unauthorized, paused, and out-of-turn drops.
3. Four adjacent discs horizontally, vertically, or along either diagonal win. The Table and both Hands highlight the winning line. A full board with no line is a draw.
4. A win awards one point once, records round scores, and moves the room to Finished. A draw awards zero points. Generic timer/score requests cannot finish an unresolved board.
5. Room controls can start the next match or return everyone to game selection. A new match clears the board and round scores; session totals follow the platform's new-game/next-round behavior.

## Contract

- Action: `DROP`, payload `{ "column": 0 }` (zero-based, 0–6).
- Grid is column-major: `grid[column][row]`; row zero is at the top. Values: 0 empty, 1 Red, 2 Yellow.
- State includes `phase` (`Playing`/`GameOver`), `playerOrder`, `currentPlayerId`, `winnerId`, `moveCount`, `lastMove`, and `winningCells`.
- Reconnects rebind turn, winner, player order and round-score IDs while preserving disc colors. The shared room service rebinds undo snapshots to the current connection IDs so undo remains available after reconnecting. Undoing a scored move restores the previous totals.
- Catalog status becomes Testing through the accompanying EF migration; apply it using the normal deployment migration workflow.

## Verification

- Backend: `dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj --collect:"XPlat Code Coverage"`.
- Frontend: `npm --prefix frontend test -- --watch=false --browsers=ChromeHeadlessNoSandbox`.
- Live transport: start a disposable local API with `ConnectionStrings__DefaultConnection=InMemoryFourInARow`, then from `frontend/` run `npx playwright test e2e/games/four-in-a-row-realtime.spec.ts --project=chromium`. Override `BGH_API_URL` for a different local API port. This test uses real SignalR clients and needs no browser.
- Visually check Table/Hand layout, keyboard column selection, reduced motion and touch targets at 360px, 768px, 1024px and 1440px.
