# Sushi Train Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Sushi Train".
- **Start**: Click "Start Game".

## 2. Drafting Phase (Round 1-3)
- **State**: `!isRoundOver`.
- **View**:
    - **Host**: Shows all players' tableaus and scores.
    - **Player**: Shows **Hand** of cards to pick from.
- **Action**:
    - **Select**: Player clicks a card to keep.
    - **Chopsticks**: Toggle to pick 2 cards (swaps Chopsticks back to hand).
    - **Reveal**: When all players select, cards reveal. Hands rotate (Drafting).
- **Loop**: Repeat until hands are empty (7-10 turns).

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
    - **Board**: "GAME OVER!". Final Scores. Pudding scoring applied (+6/-6).
- **Action**:
    - **Restart**: Host clicks **"Play Again"**.

---

# Discrepancies / Notes
1.  **Resolved**: Host controls (Next Round/Play Again) and Player View implementation were fixed in previous sessions.
2.  **Scoring**: Backend logic fully implements complex scoring (Wasabi multipliers, Chopstick swapping, Maki majorities, Pudding accumulation).
