# Plan: Table / Hand — shared definitions and code

This document complements **`platform-glossary.md`**. It records **what we standardized in code** and **optional follow-ups**.

## Completed (this iteration)

1. **`table-hand.types.ts`** — Shared TypeScript types:
   - `TableHandRole`, `isTableRole`, `isHandRole`
   - `GameShellInputs` — common shape for game components (`room`, `myConnectionId`, `isHost`, `isScreen`, `isTable`, `isHand`)

2. **`GameRoomComponent`** — When a game registers **both** `hostComponent` and `playerComponent` in `GAME_REGISTRY`:
   - **Table** (`isScreen === true`) loads **`hostComponent`**.
   - **Hand** (`isScreen === false`) loads **`playerComponent`**.
   - If only `hostComponent` is set, both roles use the same component (legacy behavior).

3. **`gameInputs`** — Now includes **`isScreen`**, **`isTable`**, and **`isHand`** so a single component can branch without extra API calls.

## Optional follow-ups (not required for Clover-Minded)

| Idea | Rationale |
|------|-----------|
| Rename `hostComponent` / `playerComponent` to `tableComponent` / `handComponent` in `GameConfig` | Clearer naming; needs a repo-wide rename and a short migration note for forks. |
| `RoomRoleContext` injectable | Wrap `SignalRService` + `me$` to expose `isScreen` and helpers; reduces `@Input()` drilling in deep trees. |
| Backend `Player` XML docs | Mirror glossary terms on `IsScreen` for API readers. |
| Per-client `GameData` patches | Needed for **strict** hidden information (true private clues with zero leakage). Clover-Minded currently relies on **client-side filtering** of `GameData` for prep; see Clover README. |

## Games using Table + Hand

- **Clover-Minded** — First game to use split shells (`CloverMindedTableComponent` / `CloverMindedHandComponent`).
