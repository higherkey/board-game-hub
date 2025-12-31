# Great Minds Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Great Minds".
- **Start**: Click "Start Game".

## 2. Playing Phase
- **State**: `GameState` (Level, Lives, Sync Tokens, Top Card).
- **View**:
    - **Board**: Background, HUD (Level, Lives, Syncs), Center Stack.
    - **Player**: Big Play Button (Lowest Card), Queue (Hidden cards).
- **Action**:
    - Players must play cards in ascending order without communicating.
    - **Play**: Player clicks "TAP TO PLAY" (if they think they are lowest).
    - **Sync**: Player clicks "SYNC" to vote for a sync (if available).
- **Feedback**:
    - Right Card: "Success" animation. Stack updates.
    - Wrong Card: "Error" animation ("CONNECTION BROKEN"). Life lost.
    - Level Complete: "LEVEL X" flash message.

## 3. End Game (Victory/Defeat)
- **Victory**: All levels cleared.
    - **View**: Board shows "TRANSCENDENCE ACHIEVED" (Victory State).
- **Defeat**: Lives hit 0.
    - **View**: Currently just shows 0 hearts. No explicit "Game Over" screen.
- **Controls**:
    - **Critical Missing Feature**: No "Restart Game" or "Try Again" button for the Host in either Victory or Defeat states.

---

# Discrepancies / Notes
1.  **Missing "Restart" Button**: Host cannot reset the game after winning or losing.
2.  **Missing Defeat UI**: No clear "Game Over" message when lives run out.
