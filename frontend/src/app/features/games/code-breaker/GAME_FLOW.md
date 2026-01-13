# Code Breaker Game Flow

## 1. Setup
*   **Host:** Selects "Cyber Breach".
*   **Mode:** Versus (PvP) or Co-op (vs CPU).
*   **Difficulty:** 4 Pins (Normal) or 5 Pins (Hard). Duplicates (On/Off).
*   **Turns:** 10 Attempts.

## 2. Code Generation Phase
*   **CPU Mode:** Server randomly generates Secret Code (e.g., [Red, Red, Blue, Green]).
*   **PvP Mode:**
    *   Player A (Architect) sees drag-and-drop palette.
    *   Player A locks in Secret Code.
    *   Player B (Hacker) waits.

## 3. Hacking Phase (Loop)
*   **Turn Start:** Row N is active.
*   **Hacker Action:**
    *   Drags colors into slots 1-4.
    *   Clicks "Execute" (Submit).
*   **Validation:**
    *   Server compares Guess vs Secret.
    *   **Logic:**
        1. Count Exact Matches (Black Pins). Remove from pool.
        2. Count Color-Only Matches (White Pins) from remaining.
    *   Server returns Pin result (Validates length 0-4).
*   **Feedback Display:**
    *   Pins animate next to the row.
    *   Active Row increments (N+1).

## 4. End Condition
*   **Win:** 4 Black Pins achieved.
    *   "ACCESS GRANTED" animation.
    *   Score usually based on (Total Turns - Used Turns).
*   **Loss:** Turn 10 executed without success.
    *   "SYSTEM LOCKDOWN" animation.
    *   Secret Code is revealed.

## 5. Rematch
*   **PvP:** Swap Roles (Hacker becomes Architect).
*   **Co-op:** New Difficulty Level?
