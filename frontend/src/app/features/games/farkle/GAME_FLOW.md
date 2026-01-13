# Farkle Game Flow

## 1. Room Creation & Setup
*   **Host** creates room, selects "Farkle".
*   **Settings:**
    *   Winning Score (5000, 10000, 20000).
    *   Scoring Variation (Standard, Three Pairs=1500, etc.).
*   **Lobby:** Players join. Min 1, Max 8.

## 2. Game Start
*   Order is randomized.
*   First player becomes `ActivePlayer`.

## 3. Turn Sequence
### A. The Roll
1.  **Server** rolls `6 - count(HeldDice)` dice.
2.  **Server** evaluates dice for valid scoring combinations.
3.  **Client** displays dice animations.

### B. Player Action: Selection
1.  **Player** clicks dice to "Hold" them.
2.  **System** validates selection:
    *   Must select at least one *new* scoring die/combo.
    *   Cannot hold non-scoring dice.
3.  **UI:** Updates "Potential Turn Score".

### C. Player Action: Decision
*   **Option 1: Bank** (If Turn Score >= 300 or Threshold)
    *   Turn Score is added to Total Score.
    *   Turn ends. Next player.
*   **Option 2: Roll Again**
    *   If all 6 dice are held ("Hot Dice"): All 6 became available to roll.
    *   Else: Roll remaining dice.
*   **Scenario: Farkle**
    *   If a roll produces **ZERO** scoring dice:
    *   **UI:** "FARKLE!" animation.
    *   Turn Score = 0.
    *   Turn ends.

## 4. End Game
*   **Trigger:** A player exceeds the Winning Score (e.g., 10,000).
*   **State Change:** `FinalRound` = true.
*   **Final Turns:** Every other player gets **one** last turn to try and beat the high score.
*   **Winner:** The player with the highest score after the final round wins.
