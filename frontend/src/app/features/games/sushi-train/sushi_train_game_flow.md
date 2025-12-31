# Sushi Train Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Sushi Train".
- **Start**: Click "Start Game".

## 2. Drafting Phase (Round 1-3)
- **State**: `!isRoundOver`.
- **View**:
    - **Board (Shared)**: Shows all players' mats (Tableau, Score, Puddings). Header: "Round X/3".
    - **Player (Private)**: Shows **Hand** of cards.
- **Action**:
    - **Select**: Player clicks a card to keep.
    - **Chopsticks**: (If available/played) Player can toggle Chopsticks to pick 2 cards.
    - **Reveal**: When all players select, cards are revealed and added to Tableau. Hands rotate.
- **Loop**: Repeat until hands are empty.

## 3. Round End
- **State**: `isRoundOver`.
- **View**:
    - **Board**: "Round Over! Check Scores!".
    - **Player**: Waiting message.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.
        - Hands dealt. Round incremented.

## 4. Game End
- **State**: `isGameOver`.
- **View**:
    - **Board**: "GAME OVER!". Final Scores. Pudding scoring applied.
- **Action**:
    - **Restart**: Host clicks **"Play Again"**.

---

# Discrepancies / Notes
1.  **Critical Implementation Defect**: The `SushiTrainComponent` currently **ONLY** renders the Board View. It does not import or display the `SushiTrainPlayerComponent`. Players joining the room see the Board View and have no way to view their hand or select cards.
    - **Fix**: Refactor `SushiTrainComponent` to act as a wrapper (Main Game Component) that switches between `<app-sushi-train-board>` and `<app-sushi-train-player>` based on the user's role/isHost flag.
2.  **Missing "Next Round/Restart" Controls**: The Board View lacks buttons for the Host to advance the game state.
