# Great Minds Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Great Minds".
- **Start**: Click "Start Game".
- **Rules**: "Play cards in ascending order. No talking."

## 2. Playing Phase
- **State**: `GameState` (Level, Lives, Sync Tokens, Top Card).
- **View**:
    - **Board**: Background, HUD (Level, Lives, Syncs), Center Stack.
    - **Player**: Big Play Button (Lowest Card), Queue (Hidden cards).
- **Action**:
    - **Play**: Player clicks "TAP TO PLAY" (if they think they are lowest).
        - **Logic**: If Play > Others' Lowest -> Mistake (Life Lost, Lower cards discarded).
        - **Logic**: If Play == Lowest -> Success.
    - **Sync** (Throwing Star): Player clicks "SYNC" to vote.
        - **Logic**: If executed (Host/Vote?), everyone discards lowest card.
- **Feedback**:
    - Right Card: "Success" animation. Stack updates.
    - Wrong Card: "Error" animation ("CONNECTION BROKEN"). Life lost.
    - Level Complete: "LEVEL X" flash message.

## 3. End Game (Victory/Defeat)
- **Victory**: All levels (1-12) cleared.
    - **View**: Board shows "TRANSCENDENCE ACHIEVED".
- **Defeat**: Lives hit 0.
    - **View**: "Connection Lost".
- **Controls**:
    - **Restart**: Host clicks "Play Again" (Confirmed implemented).

---

# Discrepancies / Notes
1.  **Rewards**: Backend uses fixed reward levels (3, 6, 9) for all player counts. Official rules vary by count (e.g. 4p gets rewards at 2, 5, 8). This is acceptable.
2.  **Sync Voting**: Official rules require "All players raise hand". Backend implementation currently allows single trigger or Host trigger?
    - **Audit**: `SubmitSync` logic executes immediately when *any* player triggers it (or Host)? Code: `SubmitSync` triggers immediately. There is no voting logic for Sync in backend.
    - **Note**: This is a simplification. Any player can burn a sync token.
