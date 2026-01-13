# Yacht Game Flow

## 1. Setup
*   **Host:** Selects "Yacht".
*   **Mode:** Standard (13 Rounds).
*   **Players:** 1-8. Randomized Order.

## 2. Turn Sequence (Per Player)
*   **Roll 1:** Automated start. 5 Dice roll.
*   **Hold Phase 1:** Player selects dice to keep.
    *   Click "Roll" -> Roll unheld dice.
*   **Roll 2:** New results.
*   **Hold Phase 2:** Adjust held dice.
    *   Click "Roll" -> Roll unheld dice.
*   **Roll 3:** Final results.
*   **Score Phase:**
    *   Player MUST select a category on the scorecard.
    *   System highlights valid options and their potential points.
    *   System greys out used slots.
    *   If no valid score: Player must select a slot to "scratch" (Score 0).
*   **Submit:** Turn ends. Scores update.

## 3. Scoring Logic
*   **Upper Bonus:** If Sum(1s...6s) >= 63 -> Add 35 pts instantly.
*   **Yacht Bonus:** Standard 50 for first. +100 for subsequent if 50 slot filled.
*   **Joker:** If Yacht rolled but slot filled (and 50 scored):
    *   Must fill Upper section first (if valid).
    *   Else fill Lower section (Full House, Straights) for fixed points.

## 4. End Game
*   **Trigger:** All players have completed 13 rounds (Full Card).
*   **Calculations:** Sum Totals.
*   **Winner:** Highest Score.Animation.
