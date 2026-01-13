# Clover-Minded Game Flow

## 1. Setup
*   **Initialization:** Game draws from a pool of ~500 common nouns/adjectives.
*   **Board Assignment:** Each player receives a digital Clover Board.
*   **Card Dealing:** 4 cards are automatically assigned and rotated to outer edges.

## 2. Planning Phase (Individual)
*   Players see 4 outer edges, each with a pair of words (e.g., "Apple" & "Tree").
*   Input boxes appear on the 4 leaves of the clover.
*   Players type their single-word connections (e.g., "ORCHARD").
*   Action: "I'm Done" button.

## 3. The Shuffle
*   The game removes the 4 used cards.
*   A 5th random card is added as a distractor.
*   All 5 cards are shuffled.

## 4. Resolution Phase (Team)
*   **Focus:** The UI cycles through each player's board one by one.
*   **Team Interface:** Players (except the current board owner) can drag and drop cards onto the board.
*   **Rotations:** Cards can be rotated 0, 90, 180, or 270 degrees.
*   **Submit:** Team clicks "GUESS".

## 5. Feedback Loop
*   **Attempt 1:**
    *   If 4/4 correct: 🌟 PERFECT! +6 points.
    *   If <4: Game removes incorrect cards. Team gets one last chance.
*   **Attempt 2:**
    *   Team places remaining cards.
    *   Scoring: +1 per correct card.

## 6. Global Scoreboard
*   Points from all boards are tallied.
*   Final rating displayed based on total score (e.g., "Botanist", "Lucky Leprechaun").
