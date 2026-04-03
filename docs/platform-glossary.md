# Board Game Hub — platform glossary

These terms apply **across games** in this codebase. Game-specific rules live under each game’s feature folder (for example `frontend/src/app/features/games/<game>/README.md`).

## Roles and devices

| Term | Meaning |
|------|---------|
| **Table** | The **shared display** role: a client joined with `Player.isScreen === true`. Optimized for a TV or projector: large typography, read-only or “stage” controls, and anything everyone should see at once. |
| **Hand** | A **personal device** role: `Player.isScreen === false`. Phones or tablets used for private input, individual actions, or secondary UI. |
| **Host** | The player (or Table) with room management privileges (`Player.isHost`, `Room.hostPlayerId`, etc.). Host is orthogonal to Table/Hand: a host can join as Table or Hand. |
| **Spectator** (game-specific) | Some games assign a **Spectator** for a round (for example Clover-Minded). That is **not** the same as “spectating the room”; it is a **rule role** defined in that game’s state machine. |

## Wire model

- **Table / Hand** are represented on the server as **`Player.isScreen`** (see `backend/BoardGameHub.Api/Models/Player.cs`).
- The SignalR hub exposes **`ChangeRole(isScreen)`** so a user can switch between Table and Hand without rejoining.

## UI shell selection

- Games may register a **Table shell** and a **Hand shell** in `frontend/src/app/features/games/game.registry.ts` (`hostComponent` = Table, `playerComponent` = Hand when both are set).
- `GameRoomComponent` chooses the shell from **`isScreen`**, not from host vs non-host. See `docs/platform-table-hand-plan.md`.

## Related files

- TypeScript: `frontend/src/app/core/platform/table-hand.types.ts`
- Room / player model: `backend/BoardGameHub.Api/Models/Room.cs`, `Player.cs`
