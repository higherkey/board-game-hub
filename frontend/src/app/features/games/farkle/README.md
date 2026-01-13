# Farkle (Public Domain)

**Status:** Backlog
**Players:** 1-8 (Supports Solo Play)
**Time:** 15-30 Minutes
**Genre:** Dice, Push Your Luck

## 🎲 Game Overview
Farkle is a classic dice game where players roll six dice to score points based on specific combinations. After each roll, a player must set aside at least one scoring die to accumulate points. They can then choose to tackle the remaining dice for more points ("pushing their luck") or bank their current score. If a roll yields no scoring dice, the player "Farkles" and loses all points for that turn.

## 📜 Rules
1.  **The Roll:** A player starts their turn by throwing 6 dice.
2.  **Scoring Dice:**
    *   **1:** 100 points
    *   **5:** 50 points
    *   **Three of a Kind:** 100x Face Value (e.g., three 2s = 200, three 6s = 600). Exception: Three 1s = 1000.
    *   **Four of a Kind:** 1000 (or 2x Three of a Kind).
    *   **Five of a Kind:** 2000.
    *   **Six of a Kind:** 3000.
    *   **Straight (1-6):** 1500.
    *   **Three Pairs:** 1500.
3.  **The Decision:**
    *   After rolling, the player *must* select at least one scoring die/combo to keep.
    *   They can then either **Bank** (end turn and secure points) or **Roll Again** with the remaining dice.
4.  **Farkle:** If a player rolls and no dice can score, their turn ends immediately, and they score **0** for the round.
5.  **Hot Dice:** If a player manages to set aside all 6 dice as scorers, they get "Hot Dice" and can roll all 6 again to continue accumulating points in the same turn.
6.  **Winning:** First player to reach 10,000 points triggers the final round. Each other player gets one last turn to beat the high score.

## 🏗️ Components & Architecture

### Backend Components
*   `FarkleGameService`: Manages game state, dice rolling logic, and scoring validation.
*   `FarkleGameState`:
    *   `CurrentPlayerId`: string
    *   `Dice`: List of 6 integers (Faces 1-6)
    *   `HeldDice`: List of booleans (indexes of held dice)
    *   `TurnScore`: int (Points accumulated in current turn)
    *   `Scores`: Dictionary<string, int> (Total scores)
    *   `IsHotDice`: boolean

### Frontend Components
*   `FarkleGameComponent`: Main container.
    *   `DiceTrayComponent`: Visual representation of 6 dice (3D or 2D sprites).
    *   `ScoreBoardComponent`: List of players and totals.
    *   `ControlsComponent`: "Roll", "Bank" buttons.

### File Structure
```
frontend/src/app/features/games/farkle/
├── farkle.component.ts       // Main Game Logic
├── farkle.component.html     // Template
├── farkle.component.scss     // Styles
├── rules/                    // Rules Logic
│   └── farkle-rules.ts       // Scoring calculator
└── components/
    ├── dice-tray/
    └── score-board/
```
